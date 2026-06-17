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
