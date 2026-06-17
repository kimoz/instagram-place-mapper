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
    mock_response.content[0].text = "null"

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


def test_extract_handles_empty_caption():
    mock_response = MagicMock()
    mock_response.content[0].text = "null"

    with patch("pipeline.ai_extractor.anthropic.Anthropic") as MockClient:
        MockClient.return_value.messages.create.return_value = mock_response
        result = extract_place_from_caption("")

    assert result is None


def test_extract_truncates_long_caption():
    """Caption is truncated to 1500 chars before sending to API."""
    mock_response = MagicMock()
    mock_response.content[0].text = "null"
    long_caption = "x" * 3000

    with patch("pipeline.ai_extractor.anthropic.Anthropic") as MockClient:
        MockClient.return_value.messages.create.return_value = mock_response
        extract_place_from_caption(long_caption)
        call_args = MockClient.return_value.messages.create.call_args
        sent_content = call_args[1]["messages"][0]["content"]
        assert len(sent_content) <= 1800  # prompt overhead + 1500 cap


def test_extract_handles_incomplete_json_fields():
    """JSON with only restaurant_name should still produce a result with defaults."""
    mock_response = MagicMock()
    mock_response.content[0].text = '{"restaurant_name": "카페 미니멀"}'

    with patch("pipeline.ai_extractor.anthropic.Anthropic") as MockClient:
        MockClient.return_value.messages.create.return_value = mock_response
        result = extract_place_from_caption("카페 미니멀 방문 #카페")

    assert result is not None
    assert result.restaurant_name == "카페 미니멀"
    assert result.region == ""
    assert result.country == "KR"
    assert result.category == "기타"
