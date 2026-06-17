from database import engine, SessionLocal, Base
import models

# 1. DB 스키마 초기화
Base.metadata.create_all(bind=engine)

def crawl_and_analyze_instagram():
    return [
        {
            "restaurant_name": "소문난성수감자탕",
            "region": "성수동",
            "country": "KR",
            "insta_summary": "웨이팅이 길지만 국물이 진하고 고기 양이 엄청나다는 반응이 압도적. 볶음밥 필수라는 해시태그 많음.",
            "address": "서울 성동구 연무장길 45",
            "category": "한식>감자탕",
            "rating_info": "네이버 방문자 리뷰 15,420+",
            "source": "Naver Place",
            "lat": 37.542981,
            "lng": 127.056064
        },
        {
            "restaurant_name": "대림국수 성수",
            "region": "성수동",
            "country": "KR",
            "insta_summary": "쫄깃한 온면과 숯불 꼬치의 조합이 훌륭하다는 인증샷 다수. 힙한 성수동 감성 술집.",
            "address": "서울 성동구 연무장7가길 5-1",
            "category": "일식>우동,소바",
            "rating_info": "네이버 방문자 리뷰 2,100+",
            "source": "Naver Place",
            "lat": 37.543500,
            "lng": 127.054200
        },
        {
            "restaurant_name": "어니언 성수",
            "region": "성수동",
            "country": "KR",
            "insta_summary": "인더스트리얼 감성의 폐공장 카페, 빵 종류가 다양하고 하얀 가루 듬뿍 팡도르가 가장 인기.",
            "address": "서울 성동구 아차산로9길 8",
            "category": "카페",
            "rating_info": "네이버 방문자 리뷰 8,900+",
            "source": "Naver Place",
            "lat": 37.544100,
            "lng": 127.057300
        },
        {
            "restaurant_name": "쿠시카츠 다루마",
            "region": "오사카 도톤보리",
            "country": "JP",
            "insta_summary": "오사카 필수 코스! 바삭한 쿠시카츠에 나마비루(생맥주) 한 잔 하기 완벽하다는 릴스 폭발.",
            "address": "1 Chome-6-4 Dotonbori, Chuo Ward, Osaka",
            "category": "Restaurant",
            "rating_info": "구글 평점 4.3 (4,210명)",
            "source": "Google Places",
            "lat": 34.668470,
            "lng": 135.501574
        },
        {
            "restaurant_name": "이치란 도톤보리점",
            "region": "오사카 도톤보리",
            "country": "JP",
            "insta_summary": "한국인 입맛에 딱 맞는 돈코츠 라멘. 비밀 소스 추가 필수라는 꿀팁 레시피 공유 활발.",
            "address": "7-18 Souemoncho, Chuo Ward, Osaka",
            "category": "Ramen Restaurant",
            "rating_info": "구글 평점 4.2 (15,300명)",
            "source": "Google Places",
            "lat": 34.669300,
            "lng": 135.503200
        }
    ]

def run_pipeline():
    db = SessionLocal()
    try:
        print("🧹 기존 데이터 삭제 중 (Mock Pipeline)...")
        db.query(models.Place).delete()
        
        print("🌐 인스타그램 자동화 크롤링 및 AI 요약 중 (시뮬레이션)...")
        new_data = crawl_and_analyze_instagram()
        
        for item in new_data:
            place = models.Place(**item)
            db.add(place)
            
        db.commit()
        print(f"✅ 파이프라인 성공! 총 {len(new_data)}개의 인스타 핫플이 DB에 저장되었습니다.")
    finally:
        db.close()

if __name__ == "__main__":
    run_pipeline()
