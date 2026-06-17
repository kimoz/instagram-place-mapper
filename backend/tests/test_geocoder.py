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


def test_geocode_returns_none_when_geometry_missing():
    mock_result = [{"formatted_address": "서울 어딘가"}]  # no geometry key
    with patch("pipeline.geocoder.googlemaps.Client") as MockClient:
        MockClient.return_value.places.return_value = {"results": mock_result}
        result = geocode_place("테스트 장소", "어딘가")

    assert result is None


def test_geocode_returns_none_on_api_error():
    with patch("pipeline.geocoder.googlemaps.Client") as MockClient:
        MockClient.return_value.places.side_effect = Exception("API quota exceeded")
        result = geocode_place("테스트 장소", "서울")

    assert result is None
