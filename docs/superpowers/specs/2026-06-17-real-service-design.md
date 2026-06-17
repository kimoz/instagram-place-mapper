# Instagram Place Mapper — 실서비스 전환 설계

**작성일:** 2026-06-17  
**목표:** MVP 검증용 실제 모바일 앱 서비스 출시  
**플랫폼:** React Native (Expo) iOS + Android

---

## 1. 서비스 개요

인스타그램에서 실시간으로 화제가 되는 맛집·카페·핫플을 수집하고, Claude AI로 요약해 지도 위에 보여주는 모바일 앱. 국내(서울 등)와 해외(오사카 등) 장소를 모두 커버한다.

**핵심 가치:** "인스타에서 뭐가 핫한지" 를 지도로 한눈에 탐색

---

## 2. 기술 스택

| 레이어 | 기술 | 역할 |
|--------|------|------|
| 모바일 앱 | React Native + Expo | iOS / Android |
| 지도 | react-native-maps | 핀 렌더링 |
| 백엔드 API | FastAPI (Python) | REST API |
| DB | PostgreSQL | Railway 관리형 |
| 인증 | Firebase Auth | 구글 소셜 로그인 (카카오는 Phase 3+ 별도 검토) |
| 크롤링 | Playwright (Python) | 인스타 게시물 수집 |
| AI 요약 | Claude API (Haiku) | 장소명·요약 추출 |
| 좌표 변환 | Google Places API | 주소 → 위경도 (국내/해외 통합) |
| 호스팅 | Railway | API + DB + Cron |
| 스케줄 | Railway Cron | 주 2~3회 자동 파이프라인 |

---

## 3. 시스템 아키텍처

```
[ Expo 앱 ]
    │ HTTPS
    ├──→ [ FastAPI / Railway ]
    │         │
    │         ├── [ PostgreSQL / Railway ]
    │         └── [ Claude API ] (파이프라인 전용)
    │
    └──→ [ Firebase Auth ] (토큰 발급)

[ Railway Cron — 주 2~3회 ]
    → Playwright → Instagram 수집
    → Claude API → 장소명/요약 추출
    → Google Places API → 주소/좌표 확인
    → PostgreSQL Upsert
    → crawl_logs 기록
```

---

## 4. DB 스키마

### places
```sql
id              UUID PRIMARY KEY
restaurant_name VARCHAR(200) NOT NULL
region          VARCHAR(100)          -- 성수동, 도톤보리
country         CHAR(2)               -- KR, JP, US ...
category        VARCHAR(50)           -- 카페 / 맛집 / 술집 / 기타
address         TEXT
lat             DOUBLE PRECISION
lng             DOUBLE PRECISION
insta_summary   TEXT                  -- Claude API 생성 요약
instagram_url   TEXT                  -- 원본 포스트 링크
thumbnail_url   TEXT
rating_info     VARCHAR(100)
source          VARCHAR(50)           -- Instagram
crawled_at      TIMESTAMP
created_at      TIMESTAMP DEFAULT now()

INDEX (region)
INDEX (country, category)
UNIQUE (restaurant_name, region)   -- Upsert 기준키
```

### users
```sql
id            UUID PRIMARY KEY
firebase_uid  VARCHAR UNIQUE NOT NULL
email         VARCHAR(200)
display_name  VARCHAR(100)
created_at    TIMESTAMP DEFAULT now()
```

### bookmarks
```sql
id         UUID PRIMARY KEY
user_id    UUID REFERENCES users(id) ON DELETE CASCADE
place_id   UUID REFERENCES places(id) ON DELETE CASCADE
created_at TIMESTAMP DEFAULT now()

UNIQUE (user_id, place_id)
```

### crawl_logs
```sql
id             UUID PRIMARY KEY
started_at     TIMESTAMP
finished_at    TIMESTAMP
places_added   INTEGER
status         VARCHAR(20)   -- success / failed
error_message  TEXT
```

---

## 5. API 엔드포인트

### 공개 (인증 불필요)
```
GET  /api/places/search?region=&category=&country=
GET  /api/places/trending          -- 최근 7일 신규 핫플
GET  /api/places/{id}
```

### 인증 필요 (Firebase ID Token → Authorization: Bearer)
```
GET    /api/bookmarks              -- 내 저장 목록
POST   /api/bookmarks/{place_id}   -- 저장
DELETE /api/bookmarks/{place_id}   -- 저장 취소
POST   /api/users/sync             -- 첫 로그인 시 유저 생성
```

### 관리자 전용
```
POST /api/admin/pipeline/run       -- 크롤링 수동 트리거
GET  /api/admin/pipeline/logs      -- 크롤링 기록
```

---

## 6. 크롤링 파이프라인

**트리거:** Railway Cron (주 2~3회, 예: 화/목/토 새벽 3시)

**수집 대상 해시태그 예시**
- 국내: `#성수동맛집`, `#홍대카페`, `#연남동`, `#압구정로데오`
- 해외: `#오사카맛집`, `#도쿄카페`, `#방콕맛집`

**처리 흐름**
1. Playwright로 해시태그 피드 크롤링 (게시물 캡션 + 이미지 URL 수집)
2. Claude API(Haiku)에 캡션 전달 → JSON 형식으로 장소명, 지역, 카테고리, 요약 추출
3. Google Places API로 장소명+지역 검색 → 주소, 위경도 확인
4. PostgreSQL Upsert (restaurant_name + region 기준 중복 제거)
5. crawl_logs에 결과 기록

**Claude 프롬프트 (요약)**
```
아래 인스타그램 게시물 캡션에서 맛집/카페 정보를 추출해줘.
없으면 null 반환.

캡션: {caption}

JSON 형식:
{
  "restaurant_name": "",
  "region": "",
  "country": "KR",
  "category": "카페|맛집|술집|기타",
  "summary": ""
}
```

---

## 7. 앱 화면 구성

### 하단 탭 네비게이션
| 탭 | 화면 | 설명 |
|----|------|------|
| 🗺️ 지도 | MapScreen | 메인. 검색바 + 카테고리 필터 + 핀 |
| 📸 피드 | FeedScreen | 카드 스크롤. 국내/해외 토글 |
| 🔖 저장 | BookmarkScreen | 내 북마크 목록 (로그인 필요) |
| 👤 프로필 | ProfileScreen | 소셜 로그인 / 로그아웃 |

### 상세 화면 (탭 없음, 모달/스택)
- **PlaceDetailScreen** — 인스타 요약, 주소, 카테고리, 북마크 버튼, 지도앱 열기

### 화면 전환 흐름
```
MapScreen → 핀 클릭 → PlaceDetailScreen → 북마크 → BookmarkScreen
FeedScreen → 카드 탭 → PlaceDetailScreen → 지도앱 열기
BookmarkScreen → 항목 탭 → PlaceDetailScreen
```

---

## 8. 인증 흐름

1. 앱 실행 → Firebase Auth로 구글/카카오 소셜 로그인
2. Firebase ID Token 발급
3. `/api/users/sync` 호출 → DB에 유저 생성 (없으면) 
4. 이후 모든 인증 API는 `Authorization: Bearer {firebase_id_token}` 헤더 전송
5. FastAPI에서 firebase-admin SDK로 토큰 검증 → user_id 추출

---

## 9. 개발 우선순위 (Phase)

### Phase 1 — 코어 (지도 + 데이터)
- [ ] React Native + Expo 프로젝트 세팅
- [ ] FastAPI → PostgreSQL 마이그레이션 (SQLite 제거)
- [ ] react-native-maps 실제 지도 연동
- [ ] Playwright 크롤링 파이프라인 구현
- [ ] Claude API 요약 추출 연동
- [ ] Google Places API 좌표 변환
- [ ] Railway 배포 (API + DB + Cron)

### Phase 2 — 탐색 강화
- [ ] 피드 탭 (카드 스크롤 UI)
- [ ] 카테고리 필터
- [ ] 국내/해외 토글
- [ ] 트렌딩 엔드포인트

### Phase 3 — 개인화
- [ ] Firebase Auth 연동
- [ ] 북마크 기능 (저장/삭제/목록)
- [ ] 프로필 탭
- [ ] 지도앱 연결 (카카오맵/구글맵 딥링크)

---

## 10. 비용 추정 (월)

| 항목 | 예상 비용 |
|------|-----------|
| Railway (API + DB) | ~$10 |
| 프록시 (인스타 차단 대비) | ~$10–20 |
| Claude API (Haiku, 200개/회 × 3회) | ~$0.50 |
| Google Places API | 무료 (월 $200 크레딧 이내) |
| Firebase Auth | 무료 |
| **합계** | **~$20–30/월** |
