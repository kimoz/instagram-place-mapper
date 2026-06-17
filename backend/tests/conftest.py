import os

# Set DATABASE_URL to SQLite BEFORE any app imports to prevent Postgres connection at import time
SQLITE_TEST_URL = "sqlite:///:memory:"
os.environ["DATABASE_URL"] = SQLITE_TEST_URL

import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base
from main import app
from dependencies import get_db
import models

engine_test = create_engine(
    SQLITE_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


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
            lat=37.5441,
            lng=127.0573,
            insta_summary="인더스트리얼 감성의 폐공장 카페",
        ),
        models.Place(
            id=uuid.uuid4(),
            restaurant_name="쿠시카츠 다루마",
            region="도톤보리",
            country="JP",
            category="맛집",
            address="1 Chome-6-4 Dotonbori, Osaka",
            lat=34.6685,
            lng=135.5016,
            insta_summary="오사카 필수 코스 쿠시카츠",
        ),
    ]
    for p in places:
        db.add(p)
    db.commit()
    return places
