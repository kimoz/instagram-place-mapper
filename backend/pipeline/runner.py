import os
from datetime import datetime, timezone
from typing import List, Optional
from database import SessionLocal
import models
from pipeline.crawler import crawl_hashtags, RawPost
from pipeline.ai_extractor import extract_place_from_caption
from pipeline.geocoder import geocode_place


def _upsert_place(db, extraction, geo, post: RawPost) -> bool:
    existing = (
        db.query(models.Place)
        .filter(
            models.Place.restaurant_name == extraction.restaurant_name,
            models.Place.region == extraction.region,
        )
        .first()
    )
    now = datetime.now(timezone.utc)
    if existing:
        existing.insta_summary = extraction.summary
        existing.crawled_at = now
        db.commit()
        return False
    place = models.Place(
        restaurant_name=extraction.restaurant_name,
        region=extraction.region,
        country=extraction.country,
        category=extraction.category,
        insta_summary=extraction.summary,
        instagram_url=post.post_url,
        thumbnail_url=post.image_url,
        address=geo.address if geo else None,
        lat=geo.lat if geo else None,
        lng=geo.lng if geo else None,
        crawled_at=now,
    )
    db.add(place)
    db.commit()
    return True


def _default_hashtags() -> List[str]:
    raw = os.environ.get("CRAWL_HASHTAGS", "맛집,카페,맛스타그램")
    return [h.strip() for h in raw.split(",") if h.strip()]


def run_pipeline(hashtags: Optional[List[str]] = None) -> dict:
    resolved_hashtags = hashtags or _default_hashtags()
    db = SessionLocal()
    log = models.CrawlLog(started_at=datetime.now(timezone.utc))
    db.add(log)
    db.commit()

    places_added = 0
    error_msg = None

    try:
        posts = crawl_hashtags(resolved_hashtags)
        for post in posts:
            extraction = extract_place_from_caption(post.caption)
            if not extraction:
                continue
            geo = geocode_place(extraction.restaurant_name, extraction.region)
            is_new = _upsert_place(db, extraction, geo, post)
            if is_new:
                places_added += 1

        log.status = "success"
        log.places_added = places_added
    except Exception as e:
        db.rollback()
        log.status = "failed"
        log.error_message = str(e)
        error_msg = str(e)
    finally:
        log.finished_at = datetime.now(timezone.utc)
        db.commit()
        db.close()

    return {"status": log.status, "places_added": places_added, "error": error_msg}


if __name__ == "__main__":
    result = run_pipeline()
    print(result)
