import os
from dataclasses import dataclass
from typing import Optional
import googlemaps
import googlemaps.exceptions


@dataclass
class GeoResult:
    address: str
    lat: float
    lng: float


def geocode_place(restaurant_name: str, region: str) -> Optional[GeoResult]:
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not api_key:
        return None
    client = googlemaps.Client(key=api_key)
    query = f"{restaurant_name} {region}"
    try:
        response = client.places(query=query, language="ko")
    except Exception:
        return None
    results = response.get("results", [])
    if not results:
        return None
    top = results[0]
    geometry = top.get("geometry", {})
    location = geometry.get("location", {})
    if location.get("lat") is None or location.get("lng") is None:
        return None
    return GeoResult(
        address=top.get("formatted_address", ""),
        lat=location["lat"],
        lng=location["lng"],
    )
