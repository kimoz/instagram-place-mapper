from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from dependencies import get_db
import models

router = APIRouter(prefix="/api/places", tags=["places"])


def _place_to_dict(p: models.Place) -> dict:
    return {
        "id": str(p.id),
        "restaurant_name": p.restaurant_name,
        "region": p.region,
        "country": p.country,
        "insta_summary": p.insta_summary,
        "instagram_url": p.instagram_url,
        "thumbnail_url": p.thumbnail_url,
        "map_data": {
            "address": p.address,
            "category": p.category,
            "rating_info": p.rating_info,
            "source": p.source,
            "lat": p.lat,
            "lng": p.lng,
        },
    }


@router.get("/search")
def search_places(
    region: str = Query(default="", max_length=100),
    category: str = Query(default="", max_length=50),
    country: str = Query(default="", max_length=2),
    db: Session = Depends(get_db),
):
    # whitespace-only region matches nothing (not the same as empty = no filter)
    if region and not region.strip():
        return {"success": True, "data": []}
    trimmed = region.strip()
    q = db.query(models.Place)
    if trimmed:
        q = q.filter(models.Place.region.contains(trimmed, autoescape=True))
    if category.strip():
        q = q.filter(models.Place.category == category.strip())
    if country.strip():
        q = q.filter(models.Place.country == country.strip().upper())
    places = q.all()
    return {"success": True, "data": [_place_to_dict(p) for p in places]}


@router.get("/trending")
def trending_places(db: Session = Depends(get_db)):
    from datetime import datetime, timedelta, timezone
    since = datetime.now(timezone.utc) - timedelta(days=30)
    places = (
        db.query(models.Place)
        .filter(models.Place.crawled_at >= since)
        .order_by(models.Place.crawled_at.desc())
        .limit(50)
        .all()
    )
    return {"success": True, "data": [_place_to_dict(p) for p in places]}


@router.get("/{place_id}")
def get_place(place_id: str, db: Session = Depends(get_db)):
    import uuid as _uuid
    try:
        uid = _uuid.UUID(place_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid UUID")
    place = db.query(models.Place).filter(models.Place.id == uid).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return _place_to_dict(place)
