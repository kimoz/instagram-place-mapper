"""
로컬 개발용 샘플 데이터 시드 스크립트.
실행: python seed.py
"""
import os
import uuid
from datetime import datetime, timezone, timedelta

os.environ.setdefault("DATABASE_URL", "sqlite:///./dev.db")

from database import engine, Base, SessionLocal
import models

Base.metadata.create_all(bind=engine)

PLACES = [
    {
        "restaurant_name": "블루보틀 커피 성수",
        "region": "성수동",
        "country": "KR",
        "category": "카페",
        "address": "서울 성동구 성수이로 78",
        "lat": 37.5447,
        "lng": 127.0565,
        "insta_summary": "성수 감성 그 자체, 콜드브루 한 잔에 힙한 하루 마무리",
        "instagram_url": "https://www.instagram.com/p/example1/",
        "rating_info": "4.5 / 5",
        "source": "Instagram",
        "days_ago": 1,
    },
    {
        "restaurant_name": "망원동 돼지국밥",
        "region": "망원동",
        "country": "KR",
        "category": "맛집",
        "address": "서울 마포구 망원로 68",
        "lat": 37.5548,
        "lng": 126.9026,
        "insta_summary": "새벽 해장은 여기서, 진하고 구수한 국물에 리뷰어들 난리남",
        "instagram_url": "https://www.instagram.com/p/example2/",
        "rating_info": "4.7 / 5",
        "source": "Instagram",
        "days_ago": 2,
    },
    {
        "restaurant_name": "연남동 이자카야 우라",
        "region": "연남동",
        "country": "KR",
        "category": "술집",
        "address": "서울 마포구 연남로 113",
        "lat": 37.5607,
        "lng": 126.9234,
        "insta_summary": "분위기 맛집, 일본 감성 이자카야인데 웨이팅 1시간은 기본",
        "instagram_url": "https://www.instagram.com/p/example3/",
        "rating_info": "4.4 / 5",
        "source": "Instagram",
        "days_ago": 3,
    },
    {
        "restaurant_name": "을지로 노가리 골목",
        "region": "을지로",
        "country": "KR",
        "category": "술집",
        "address": "서울 중구 을지로 157",
        "lat": 37.5662,
        "lng": 126.9905,
        "insta_summary": "노포 감성 + 500원 노가리 = 레전드 조합, 직장인 성지",
        "instagram_url": "https://www.instagram.com/p/example4/",
        "rating_info": "4.6 / 5",
        "source": "Instagram",
        "days_ago": 1,
    },
    {
        "restaurant_name": "이태원 한남 버거",
        "region": "한남동",
        "country": "KR",
        "category": "맛집",
        "address": "서울 용산구 이태원로 240",
        "lat": 37.5349,
        "lng": 127.0003,
        "insta_summary": "수제버거 끝판왕, 줄 서서 먹는데 그럴 가치 있음",
        "instagram_url": "https://www.instagram.com/p/example5/",
        "rating_info": "4.8 / 5",
        "source": "Instagram",
        "days_ago": 4,
    },
    {
        "restaurant_name": "익선동 한옥 카페",
        "region": "익선동",
        "country": "KR",
        "category": "카페",
        "address": "서울 종로구 익선동 166",
        "lat": 37.5729,
        "lng": 126.9962,
        "insta_summary": "한옥 뷰에 전통차 한 잔, 인생샷 명소 등극",
        "instagram_url": "https://www.instagram.com/p/example6/",
        "rating_info": "4.3 / 5",
        "source": "Instagram",
        "days_ago": 5,
    },
    {
        "restaurant_name": "도톤보리 이치란",
        "region": "도톤보리",
        "country": "JP",
        "category": "맛집",
        "address": "일본 오사카 도톤보리 7-18",
        "lat": 34.6688,
        "lng": 135.5013,
        "insta_summary": "오사카 여행 필수 코스, 1인 좌석에서 먹는 라멘이 꿀",
        "instagram_url": "https://www.instagram.com/p/example7/",
        "rating_info": "4.6 / 5",
        "source": "Instagram",
        "days_ago": 2,
    },
    {
        "restaurant_name": "방콕 이싸야 시암",
        "region": "시암",
        "country": "TH",
        "category": "맛집",
        "address": "태국 방콕 Siam Sq. Soi 1",
        "lat": 13.7463,
        "lng": 100.5311,
        "insta_summary": "방콕 파인다이닝 가성비 최고, 망고스틱 디저트가 시그니처",
        "instagram_url": "https://www.instagram.com/p/example8/",
        "rating_info": "4.5 / 5",
        "source": "Instagram",
        "days_ago": 6,
    },
    {
        "restaurant_name": "해방촌 루프탑 바",
        "region": "해방촌",
        "country": "KR",
        "category": "술집",
        "address": "서울 용산구 신흥로 172",
        "lat": 37.5445,
        "lng": 126.9888,
        "insta_summary": "남산 야경 뷰에서 칵테일 한 잔, 데이트 코스 1순위",
        "instagram_url": "https://www.instagram.com/p/example9/",
        "rating_info": "4.7 / 5",
        "source": "Instagram",
        "days_ago": 1,
    },
    {
        "restaurant_name": "제주 협재 카페 돌하르방",
        "region": "협재",
        "country": "KR",
        "category": "카페",
        "address": "제주 제주시 한림읍 협재리 127",
        "lat": 33.3941,
        "lng": 126.2397,
        "insta_summary": "협재 바다 뷰 오션카페, 에메랄드 바다 옆에서 마시는 아메리카노",
        "instagram_url": "https://www.instagram.com/p/example10/",
        "rating_info": "4.9 / 5",
        "source": "Instagram",
        "days_ago": 3,
    },
]


def seed():
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    inserted = 0
    skipped = 0

    for p in PLACES:
        exists = (
            db.query(models.Place)
            .filter(
                models.Place.restaurant_name == p["restaurant_name"],
                models.Place.region == p["region"],
            )
            .first()
        )
        if exists:
            skipped += 1
            continue

        place = models.Place(
            id=uuid.uuid4(),
            restaurant_name=p["restaurant_name"],
            region=p["region"],
            country=p["country"],
            category=p["category"],
            address=p["address"],
            lat=p["lat"],
            lng=p["lng"],
            insta_summary=p["insta_summary"],
            instagram_url=p["instagram_url"],
            rating_info=p["rating_info"],
            source=p["source"],
            crawled_at=now - timedelta(days=p["days_ago"]),
        )
        db.add(place)
        inserted += 1

    db.commit()
    db.close()
    print(f"Seed complete: {inserted} inserted, {skipped} skipped")


if __name__ == "__main__":
    seed()
