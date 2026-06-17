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
