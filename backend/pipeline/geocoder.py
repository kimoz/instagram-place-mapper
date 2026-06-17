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
