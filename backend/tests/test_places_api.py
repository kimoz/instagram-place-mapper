import uuid


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
    res = client.get(f"/api/places/{uuid.uuid4()}")
    assert res.status_code == 404


def test_trending_returns_recent_places(client, db):
    from datetime import datetime, timedelta, timezone
    import models, uuid
    recent = models.Place(
        id=uuid.uuid4(),
        restaurant_name="최신 카페",
        region="홍대",
        country="KR",
        category="카페",
        crawled_at=datetime.now(timezone.utc) - timedelta(days=3),
    )
    db.add(recent)
    db.commit()
    res = client.get("/api/places/trending")
    assert res.status_code == 200
    names = [p["restaurant_name"] for p in res.json()["data"]]
    assert "최신 카페" in names


def test_trending_excludes_old_places(client, db):
    from datetime import datetime, timedelta, timezone
    import models, uuid
    old = models.Place(
        id=uuid.uuid4(),
        restaurant_name="옛날 카페",
        region="강남",
        country="KR",
        category="카페",
        crawled_at=datetime.now(timezone.utc) - timedelta(days=35),
    )
    db.add(old)
    db.commit()
    res = client.get("/api/places/trending")
    assert res.status_code == 200
    names = [p["restaurant_name"] for p in res.json()["data"]]
    assert "옛날 카페" not in names


def test_whitespace_region_guard_is_not_vacuous(client, db):
    import models, uuid
    # Insert a place whose region IS whitespace — if the guard were absent,
    # the LIKE query would match this and return a result
    p = models.Place(
        id=uuid.uuid4(),
        restaurant_name="스페이스 테스트",
        region="   ",
        country="KR",
        category="기타",
    )
    db.add(p)
    db.commit()
    res = client.get("/api/places/search?region=   ")
    assert res.status_code == 200
    assert res.json()["data"] == []


def test_search_country_case_insensitive(client, sample_places):
    res = client.get("/api/places/search?country=jp")
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1
    assert res.json()["data"][0]["country"] == "JP"


def test_get_place_invalid_uuid_returns_422(client):
    res = client.get("/api/places/not-a-uuid")
    assert res.status_code == 422
