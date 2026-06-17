# Phase 1 Backend + Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SQLite → PostgreSQL 마이그레이션, 크롤링 파이프라인(Playwright → Claude API → Google Places → DB) 구현, Railway 배포

**Architecture:** FastAPI 백엔드가 PostgreSQL(Railway)에 연결. 크롤러는 독립 Python 스크립트로 Railway Cron이 주 2~3회 실행. Claude API로 인스타 캡션에서 장소 정보 추출, Google Places API로 좌표 변환.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy 2.x, PostgreSQL, psycopg2-binary, anthropic SDK, googlemaps, playwright, pytest, Railway

---

## 파일 구조

```
backend/
├── main.py                    # (수정) 라우터 등록, CORS
├── database.py                # (수정) PostgreSQL 연결
├── models.py                  # (수정) UUID + 신규 컬럼
├── requirements.txt           # (수정) 의존성 추가
├── routers/
│   ├── __init__.py            # (신규)
│   ├── places.py              # (신규) 장소 검색/상세 라우터
│   └── admin.py              # (신규) 파이프라인 트리거/로그
├── pipeline/
│   ├── __init__.py            # (신규)
│   ├── ai_extractor.py        # (신규) Claude API 장소 추출
│   ├── geocoder.py            # (신규) Google Places 좌표 변환
│   ├── crawler.py             # (신규) Playwright 인스타 크롤링
│   └── runner.py              # (신규) 파이프라인 오케스트레이터
├── tests/
│   ├── conftest.py            # (신규) pytest fixture
│   ├── test_places_api.py     # (신규) 장소 API 테스트
│   ├── test_ai_extractor.py   # (신규) Claude 추출 테스트
│   └── test_geocoder.py       # (신규) 지오코딩 테스트
├── Dockerfile                 # (신규) Railway 배포용
└── railway.toml               # (신규) Railway 설정
```

---

## Task 1: requirements.txt + DB 연결 업데이트

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/database.py`

- [ ] **Step 1: requirements.txt 교체**

```
fastapi
uvicorn[standard]
pydantic
sqlalchemy
psycopg2-binary
anthropic
googlemaps
playwright
python-dotenv
pytest
pytest-mock
httpx
```

- [ ] **Step 2: database.py 를 PostgreSQL로 교체**

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

- [ ] **Step 3: .env 파일 생성 (git에 커밋하지 않음)**

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/places_dev
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_PLACES_API_KEY=AIza...
INSTAGRAM_USERNAME=your_account
INSTAGRAM_PASSWORD=your_password
ADMIN_SECRET=your_secret_token
```

- [ ] **Step 4: .gitignore에 .env 추가 확인**

```bash
echo ".env" >> .gitignore
echo "__pycache__/" >> .gitignore
```

- [ ] **Step 5: 로컬 PostgreSQL에 DB 생성**

```bash
createdb places_dev
# 또는 Docker: docker run -d -p 5432:5432 -e POSTGRES_DB=places_dev -e POSTGRES_PASSWORD=password postgres:15
```

- [ ] **Step 6: Commit**

```bash
git add backend/requirements.txt backend/database.py backend/.gitignore
git commit -m "feat: switch to PostgreSQL"
```

---

## Task 2: 모델 업데이트 (UUID + 신규 컬럼)

**Files:**
- Modify: `backend/models.py`

- [ ] **Step 1: models.py 전체 교체**

```python
import uuid
from sqlalchemy import Column, String, Float, DateTime, Text, Integer, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base


class Place(Base):
    __tablename__ = "places"
    __table_args__ = (UniqueConstraint("restaurant_name", "region", name="uq_place_region"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_name = Column(String(200), nullable=False, index=True)
    region = Column(String(100), index=True)
    country = Column(String(2))
    category = Column(String(50))
    address = Column(Text)
    lat = Column(Float)
    lng = Column(Float)
    insta_summary = Column(Text)
    instagram_url = Column(Text)
    thumbnail_url = Column(Text)
    rating_info = Column(String(100))
    source = Column(String(50), default="Instagram")
    crawled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String, unique=True, nullable=False)
    email = Column(String(200))
    display_name = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "place_id", name="uq_bookmark"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    place_id = Column(UUID(as_uuid=True), ForeignKey("places.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CrawlLog(Base):
    __tablename__ = "crawl_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at = Column(DateTime(timezone=True))
    finished_at = Column(DateTime(timezone=True))
    places_added = Column(Integer, default=0)
    status = Column(String(20))
    error_message = Column(Text)
```

- [ ] **Step 2: DB 스키마 생성 확인**

```bash
cd backend
python -c "from database import engine, Base; import models; Base.metadata.create_all(bind=engine); print('OK')"
```

Expected output: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/models.py
git commit -m "feat: update schema with UUID, new Place fields, User/Bookmark/CrawlLog tables"
```

---

## Task 3: 장소 API 라우터 (검색 + 필터 + 상세)

**Files:**
- Create: `backend/routers/__init__.py`
- Create: `backend/routers/places.py`
- Modify: `backend/main.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_places_api.py`

- [ ] **Step 1: 테스트 작성**

`backend/tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from main import app, get_db
import models, uuid

SQLITE_TEST_URL = "sqlite:///./test.db"
engine = create_engine(SQLITE_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def sample_places(db):
    places = [
        models.Place(
            id=uuid.uuid4(),
            restaurant_name="어니언 성수",
            region="성수동",
            country="KR",
            category="카페",
            address="서울 성동구 아차산로9길 8",
            lat=37.5441, lng=127.0573,
            insta_summary="인더스트리얼 감성의 폐공장 카페",
        ),
        models.Place(
            id=uuid.uuid4(),
            restaurant_name="쿠시카츠 다루마",
            region="도톤보리",
            country="JP",
            category="맛집",
            address="1 Chome-6-4 Dotonbori, Osaka",
            lat=34.6685, lng=135.5016,
            insta_summary="오사카 필수 코스 쿠시카츠",
        ),
    ]
    for p in places:
        db.add(p)
    db.commit()
    return places
```

`backend/tests/test_places_api.py`:
```python
def test_search_by_region(client, sample_places):
    res = client.get("/api/places/search?region=성수동")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) == 1
    assert data["data"][0]["restaurant_name"] == "어니언 성수"

def test_search_by_category(client, sample_places):
    res = client.get("/api/places/search?category=카페")
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1

def test_search_by_country(client, sample_places):
    res = client.get("/api/places/search?country=JP")
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1
    assert res.json()["data"][0]["country"] == "JP"

def test_region_too_long_returns_422(client):
    res = client.get(f"/api/places/search?region={'a' * 101}")
    assert res.status_code == 422

def test_whitespace_region_returns_empty(client, sample_places):
    res = client.get("/api/places/search?region=   ")
    assert res.status_code == 200
    assert res.json()["data"] == []

def test_get_place_detail(client, sample_places):
    place_id = str(sample_places[0].id)
    res = client.get(f"/api/places/{place_id}")
    assert res.status_code == 200
    assert res.json()["restaurant_name"] == "어니언 성수"

def test_get_place_not_found(client):
    import uuid
    res = client.get(f"/api/places/{uuid.uuid4()}")
    assert res.status_code == 404
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
cd backend && pip install -r requirements.txt
pytest tests/test_places_api.py -v
```

Expected: 여러 개 FAIL (routers/places.py 없으므로)

- [ ] **Step 3: routers/__init__.py 생성**

```python
# empty
```

- [ ] **Step 4: routers/places.py 작성**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import SessionLocal
import models

router = APIRouter(prefix="/api/places", tags=["places"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
    since = datetime.now(timezone.utc) - timedelta(days=7)
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
```

- [ ] **Step 5: main.py 교체**

```python
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routers.places import router as places_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Instagram Place Mapper API")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

app.include_router(places_router)

# get_db는 conftest가 override할 수 있도록 main에서도 노출
from routers.places import get_db  # noqa


@app.get("/")
def read_root():
    return {"message": "Instagram Place Mapper API"}
```

- [ ] **Step 6: 테스트 재실행 — PASS 확인**

```bash
pytest tests/test_places_api.py -v
```

Expected: 7 passed

- [ ] **Step 7: Commit**

```bash
git add backend/routers/ backend/main.py backend/tests/
git commit -m "feat: places router with region/category/country filters, place detail endpoint"
```

---

## Task 4: Claude API 장소 추출 모듈

**Files:**
- Create: `backend/pipeline/__init__.py`
- Create: `backend/pipeline/ai_extractor.py`
- Create: `backend/tests/test_ai_extractor.py`

- [ ] **Step 1: 테스트 작성**

`backend/tests/test_ai_extractor.py`:
```python
import pytest
from unittest.mock import MagicMock, patch
from pipeline.ai_extractor import extract_place_from_caption, PlaceExtraction


def test_extract_returns_place_data():
    mock_response = MagicMock()
    mock_response.content[0].text = '''{
        "restaurant_name": "어니언 성수",
        "region": "성수동",
        "country": "KR",
        "category": "카페",
        "summary": "인더스트리얼 감성의 폐공장 카페"
    }'''

    with patch("pipeline.ai_extractor.anthropic.Anthropic") as MockClient:
        MockClient.return_value.messages.create.return_value = mock_response
        result = extract_place_from_caption("어니언 성수 방문 #성수동카페 ...")

    assert result is not None
    assert result.restaurant_name == "어니언 성수"
    assert result.country == "KR"
    assert result.category == "카페"


def test_extract_returns_none_for_non_place_caption():
    mock_response = MagicMock()
    mock_response.content[0].text = 'null'

    with patch("pipeline.ai_extractor.anthropic.Anthropic") as MockClient:
        MockClient.return_value.messages.create.return_value = mock_response
        result = extract_place_from_caption("오늘 날씨 너무 좋다 ☀️")

    assert result is None


def test_extract_handles_malformed_json_gracefully():
    mock_response = MagicMock()
    mock_response.content[0].text = "이건 JSON이 아님"

    with patch("pipeline.ai_extractor.anthropic.Anthropic") as MockClient:
        MockClient.return_value.messages.create.return_value = mock_response
        result = extract_place_from_caption("...")

    assert result is None
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
pytest tests/test_ai_extractor.py -v
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: pipeline/__init__.py 생성**

```python
# empty
```

- [ ] **Step 4: pipeline/ai_extractor.py 작성**

```python
import json
import os
from dataclasses import dataclass
from typing import Optional
import anthropic

PROMPT_TEMPLATE = """아래 인스타그램 게시물 캡션에서 맛집/카페 정보를 추출해줘.
장소 정보가 없으면 null만 반환.

캡션:
{caption}

반드시 아래 JSON 형식으로만 응답. 설명 없이 JSON만:
{{
  "restaurant_name": "장소명",
  "region": "지역명 (예: 성수동, 도톤보리)",
  "country": "KR",
  "category": "카페|맛집|술집|기타 중 하나",
  "summary": "인스타그램 반응 한 줄 요약"
}}

장소 정보 없으면: null"""


@dataclass
class PlaceExtraction:
    restaurant_name: str
    region: str
    country: str
    category: str
    summary: str


def extract_place_from_caption(caption: str) -> Optional[PlaceExtraction]:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(caption=caption[:1500])}],
    )
    raw = response.content[0].text.strip()
    if raw == "null":
        return None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not data or not data.get("restaurant_name"):
        return None
    return PlaceExtraction(
        restaurant_name=data["restaurant_name"],
        region=data.get("region", ""),
        country=data.get("country", "KR"),
        category=data.get("category", "기타"),
        summary=data.get("summary", ""),
    )
```

- [ ] **Step 5: 테스트 재실행 — PASS 확인**

```bash
pytest tests/test_ai_extractor.py -v
```

Expected: 3 passed

- [ ] **Step 6: Commit**

```bash
git add backend/pipeline/ backend/tests/test_ai_extractor.py
git commit -m "feat: Claude API extractor for Instagram captions"
```

---

## Task 5: Google Places 지오코더

**Files:**
- Create: `backend/pipeline/geocoder.py`
- Create: `backend/tests/test_geocoder.py`

- [ ] **Step 1: 테스트 작성**

`backend/tests/test_geocoder.py`:
```python
import pytest
from unittest.mock import patch
from pipeline.geocoder import geocode_place, GeoResult


def test_geocode_returns_coordinates():
    mock_result = [{
        "formatted_address": "서울 성동구 아차산로9길 8",
        "geometry": {"location": {"lat": 37.5441, "lng": 127.0573}},
    }]
    with patch("pipeline.geocoder.googlemaps.Client") as MockClient:
        MockClient.return_value.places.return_value = {"results": mock_result}
        result = geocode_place("어니언 성수", "성수동")

    assert result is not None
    assert abs(result.lat - 37.5441) < 0.001
    assert result.address == "서울 성동구 아차산로9길 8"


def test_geocode_returns_none_when_no_result():
    with patch("pipeline.geocoder.googlemaps.Client") as MockClient:
        MockClient.return_value.places.return_value = {"results": []}
        result = geocode_place("없는장소xyz", "어딘가")

    assert result is None
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
pytest tests/test_geocoder.py -v
```

Expected: FAIL

- [ ] **Step 3: pipeline/geocoder.py 작성**

```python
import os
from dataclasses import dataclass
from typing import Optional
import googlemaps


@dataclass
class GeoResult:
    address: str
    lat: float
    lng: float


def geocode_place(restaurant_name: str, region: str) -> Optional[GeoResult]:
    client = googlemaps.Client(key=os.environ["GOOGLE_PLACES_API_KEY"])
    query = f"{restaurant_name} {region}"
    response = client.places(query=query, language="ko")
    results = response.get("results", [])
    if not results:
        return None
    top = results[0]
    location = top["geometry"]["location"]
    return GeoResult(
        address=top.get("formatted_address", ""),
        lat=location["lat"],
        lng=location["lng"],
    )
```

- [ ] **Step 4: 테스트 재실행 — PASS 확인**

```bash
pytest tests/test_geocoder.py -v
```

Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline/geocoder.py backend/tests/test_geocoder.py
git commit -m "feat: Google Places geocoder"
```

---

## Task 6: Playwright Instagram 크롤러

**Files:**
- Create: `backend/pipeline/crawler.py`

> 주의: Playwright는 실제 브라우저가 필요해 유닛 테스트가 어렵습니다. 인터페이스만 테스트하고, 실제 크롤링은 수동으로 검증합니다.

- [ ] **Step 1: Playwright 브라우저 설치**

```bash
playwright install chromium
```

Expected: Chromium 다운로드 완료

- [ ] **Step 2: pipeline/crawler.py 작성**

```python
import os
import time
from dataclasses import dataclass
from typing import List
from playwright.sync_api import sync_playwright, Page


@dataclass
class RawPost:
    caption: str
    image_url: str
    post_url: str


HASHTAGS_KR = ["성수동맛집", "홍대카페", "연남동", "압구정로데오맛집"]
HASHTAGS_OVERSEAS = ["오사카맛집한국인", "도쿄맛집한국인", "방콕맛집한국인"]


def _login(page: Page) -> None:
    page.goto("https://www.instagram.com/accounts/login/")
    page.wait_for_selector("input[name='username']", timeout=10000)
    page.fill("input[name='username']", os.environ["INSTAGRAM_USERNAME"])
    page.fill("input[name='password']", os.environ["INSTAGRAM_PASSWORD"])
    page.click("button[type='submit']")
    page.wait_for_url("https://www.instagram.com/", timeout=15000)
    time.sleep(2)


def _scrape_hashtag(page: Page, tag: str, max_posts: int = 20) -> List[RawPost]:
    posts: List[RawPost] = []
    page.goto(f"https://www.instagram.com/explore/tags/{tag}/")
    time.sleep(3)

    links = page.query_selector_all("article a")
    post_urls = list({a.get_attribute("href") for a in links if a.get_attribute("href")})[:max_posts]

    for href in post_urls:
        try:
            page.goto(f"https://www.instagram.com{href}")
            time.sleep(2)
            caption_el = page.query_selector("div[data-testid='post-comment-root'] span")
            caption = caption_el.inner_text() if caption_el else ""
            img_el = page.query_selector("div._aagv img")
            image_url = img_el.get_attribute("src") if img_el else ""
            if caption:
                posts.append(RawPost(
                    caption=caption,
                    image_url=image_url or "",
                    post_url=f"https://www.instagram.com{href}",
                ))
        except Exception:
            continue
    return posts


def crawl_hashtags(hashtags: List[str] = None, max_per_tag: int = 20) -> List[RawPost]:
    if hashtags is None:
        hashtags = HASHTAGS_KR + HASHTAGS_OVERSEAS
    all_posts: List[RawPost] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = context.new_page()
        _login(page)
        for tag in hashtags:
            posts = _scrape_hashtag(page, tag, max_per_tag)
            all_posts.extend(posts)
            time.sleep(5)  # 태그 간 딜레이
        browser.close()
    return all_posts
```

- [ ] **Step 3: 로컬에서 수동 검증 (선택)**

```bash
cd backend
python -c "
from pipeline.crawler import crawl_hashtags
posts = crawl_hashtags(['성수동맛집'], max_per_tag=3)
for p in posts:
    print(p.caption[:100])
"
```

Expected: 게시물 캡션 3개 출력 (Instagram 로그인 필요)

- [ ] **Step 4: Commit**

```bash
git add backend/pipeline/crawler.py
git commit -m "feat: Playwright Instagram hashtag crawler"
```

---

## Task 7: 파이프라인 오케스트레이터 + 어드민 라우터

**Files:**
- Create: `backend/pipeline/runner.py`
- Create: `backend/routers/admin.py`
- Modify: `backend/main.py`

- [ ] **Step 1: pipeline/runner.py 작성**

```python
import os
from datetime import datetime, timezone
from typing import List
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
        return False  # updated, not new
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
    return True  # new


def run_pipeline(hashtags: List[str] = None) -> dict:
    db = SessionLocal()
    log = models.CrawlLog(started_at=datetime.now(timezone.utc))
    db.add(log)
    db.commit()

    places_added = 0
    error_msg = None

    try:
        posts = crawl_hashtags(hashtags)
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
```

- [ ] **Step 2: routers/admin.py 작성**

```python
import os
from fastapi import APIRouter, Header, HTTPException
from database import SessionLocal
import models

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _verify_admin(x_admin_secret: str = Header(None)):
    if x_admin_secret != os.environ.get("ADMIN_SECRET"):
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/pipeline/run")
def trigger_pipeline(x_admin_secret: str = Header(None)):
    _verify_admin(x_admin_secret)
    from pipeline.runner import run_pipeline
    import threading
    result = {}
    def _run():
        result.update(run_pipeline())
    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return {"message": "Pipeline started in background"}


@router.get("/pipeline/logs")
def get_pipeline_logs(x_admin_secret: str = Header(None)):
    _verify_admin(x_admin_secret)
    db = SessionLocal()
    try:
        logs = db.query(models.CrawlLog).order_by(models.CrawlLog.started_at.desc()).limit(20).all()
        return {"logs": [
            {
                "id": str(l.id),
                "started_at": l.started_at.isoformat() if l.started_at else None,
                "finished_at": l.finished_at.isoformat() if l.finished_at else None,
                "places_added": l.places_added,
                "status": l.status,
                "error_message": l.error_message,
            }
            for l in logs
        ]}
    finally:
        db.close()
```

- [ ] **Step 3: main.py에 admin 라우터 추가**

```python
from routers.admin import router as admin_router
# ... 기존 코드 ...
app.include_router(places_router)
app.include_router(admin_router)
```

- [ ] **Step 4: 어드민 API 수동 검증**

```bash
uvicorn main:app --reload
# 다른 터미널에서:
curl -X POST http://localhost:8000/api/admin/pipeline/logs \
  -H "x-admin-secret: your_secret_token"
```

Expected: `{"logs": []}`

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline/runner.py backend/routers/admin.py backend/main.py
git commit -m "feat: pipeline runner with upsert logic, admin trigger and logs endpoints"
```

---

## Task 8: Railway 배포

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/railway.toml`

- [ ] **Step 1: Dockerfile 작성**

```dockerfile
FROM python:3.11-slim

# Playwright용 시스템 의존성
RUN apt-get update && apt-get install -y \
    wget curl gnupg \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libxkbcommon0 libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install chromium --with-deps

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: railway.toml 작성**

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/"
healthcheckTimeout = 30

[[services]]
name = "api"

[[crons]]
name = "pipeline"
schedule = "0 3 * * 2,4,6"
command = "python -m pipeline.runner"
```

- [ ] **Step 3: Railway 프로젝트 생성 + 배포**

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화 (instagram-place-mapper 디렉토리에서)
railway init

# PostgreSQL 플러그인 추가 (Railway 대시보드에서)
# Dashboard → New → Database → PostgreSQL

# 환경 변수 설정
railway variables set DATABASE_URL="postgresql://..." \
  ANTHROPIC_API_KEY="sk-ant-..." \
  GOOGLE_PLACES_API_KEY="AIza..." \
  INSTAGRAM_USERNAME="..." \
  INSTAGRAM_PASSWORD="..." \
  ADMIN_SECRET="..." \
  ALLOWED_ORIGINS="http://localhost:5173"

# 배포
railway up
```

- [ ] **Step 4: 배포 확인**

```bash
railway logs
# 브라우저에서 Railway가 발급한 URL로 접근
curl https://your-app.railway.app/
```

Expected: `{"message": "Instagram Place Mapper API"}`

- [ ] **Step 5: 전체 테스트 스위트 실행**

```bash
cd backend
pytest tests/ -v
```

Expected: 모든 테스트 통과

- [ ] **Step 6: Final Commit**

```bash
git add backend/Dockerfile backend/railway.toml
git commit -m "feat: Railway deployment config with Dockerfile and cron schedule"
```

---

## 전체 검증 체크리스트

- [ ] `GET /api/places/search?region=성수동` → 200, 데이터 반환
- [ ] `GET /api/places/search?region=` (공백) → 200, 빈 배열
- [ ] `GET /api/places/search?region=${'a'.repeat(101)}` → 422
- [ ] `GET /api/places/search?category=카페` → 카페만 반환
- [ ] `GET /api/places/search?country=JP` → 해외 장소만 반환
- [ ] `GET /api/places/trending` → 최근 7일 장소 반환
- [ ] `GET /api/places/{valid_uuid}` → 200
- [ ] `GET /api/places/{invalid_uuid}` → 404
- [ ] `POST /api/admin/pipeline/run` (올바른 secret) → 200
- [ ] `POST /api/admin/pipeline/run` (잘못된 secret) → 403
- [ ] Railway 배포 URL 접근 → 200
