"""
Railway 환경에서 GCP 서비스 계정 JSON을 환경변수로 주입받아
GOOGLE_APPLICATION_CREDENTIALS 파일로 변환합니다.

Railway Variables에 GOOGLE_APPLICATION_CREDENTIALS_JSON 으로
서비스 계정 JSON 전체 내용을 붙여넣으면 자동으로 처리됩니다.
"""
import json
import os
import tempfile


def setup():
    creds_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if not creds_json:
        return  # 로컬 개발: ADC 또는 GOOGLE_APPLICATION_CREDENTIALS 파일 사용
    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        return  # 이미 파일 경로가 설정됨

    try:
        json.loads(creds_json)  # JSON 유효성 검사
    except json.JSONDecodeError as e:
        raise ValueError("GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON") from e

    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False)
    tmp.write(creds_json)
    tmp.flush()
    tmp.close()
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = tmp.name
