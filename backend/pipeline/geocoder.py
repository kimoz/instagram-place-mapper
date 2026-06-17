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
    client = googlemaps.Client(key=os.environ["GOOGLE_PLACES_API_KEY"])
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
    if not location.get("lat") or not location.get("lng"):
        return None
    return GeoResult(
        address=top.get("formatted_address", ""),
        lat=location["lat"],
        lng=location["lng"],
    )
