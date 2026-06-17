# Instagram Place Mapper

인스타그램 맛집/카페 게시물을 자동 크롤링하여 지도로 보여주는 모바일 앱.

## 구성

```
instagram-place-mapper/
├── backend/          # FastAPI + PostgreSQL (Railway 배포)
│   ├── routers/      # places, admin API
│   ├── pipeline/     # Playwright 크롤러 + Claude AI 추출 + Google Places 지오코딩
│   └── tests/        # pytest (SQLite in-memory)
├── mobile/           # React Native + Expo Router
│   ├── app/          # 파일 기반 라우팅
│   │   ├── (tabs)/   # 지도 / 피드 / 저장 / 프로필
│   │   └── place/    # 장소 상세
│   ├── components/   # PlaceCard, PlacePin, LoadingSpinner
│   ├── hooks/        # usePlaces, useBookmarks
│   ├── contexts/     # BookmarkContext (싱글톤 상태)
│   └── services/     # axios API 클라이언트
├── railway.toml      # Railway 배포 설정 (Cron 포함)
└── README.md
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | FastAPI + SQLAlchemy 2.x + PostgreSQL |
| 호스팅 | Railway (Docker + Cron 스케줄) |
| AI 추출 | Claude Haiku (`claude-haiku-4-5-20251001`) |
| 지오코딩 | Google Places API |
| 크롤링 | Playwright (Chromium headless) |
| 모바일 | React Native + Expo SDK 56 + Expo Router |
| 지도 | react-native-maps |
| 상태 | @tanstack/react-query + AsyncStorage |

## 로컬 개발

### 백엔드

```bash
cd backend
cp .env.example .env       # 환경변수 채우기
pip install -r requirements-dev.txt
python -m pytest tests/ -v  # 테스트 실행

# 개발 서버 (SQLite로 빠른 시작 가능)
DATABASE_URL=sqlite:///./dev.db uvicorn main:app --reload
```

### 모바일

```bash
cd mobile
cp .env.example .env
npm install
npx expo start             # Expo Go 앱으로 스캔
```

## Railway 배포

1. [Railway](https://railway.app) 프로젝트 생성
2. PostgreSQL 플러그인 추가 → `DATABASE_URL` 자동 설정
3. 환경변수 설정 (Railway Dashboard > Variables):
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_PLACES_API_KEY`
   - `INSTAGRAM_USERNAME` / `INSTAGRAM_PASSWORD`
   - `ADMIN_SECRET`
   - `ALLOWED_ORIGINS` (Expo 앱 origin 포함)
4. 레포 연결 → `railway.toml` 자동 인식 → 배포

크롤링 Cron은 매주 화/목/토 오전 3시 자동 실행됨 (`railway.toml` 참고).

### 파이프라인 수동 실행

```bash
curl -X POST https://<your-railway-domain>/pipeline/run \
  -H "X-Admin-Secret: <ADMIN_SECRET>"
```

## 환경변수 목록

| 변수 | 설명 | 필수 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | ✅ |
| `ANTHROPIC_API_KEY` | Claude API 키 | ✅ |
| `GOOGLE_PLACES_API_KEY` | Google Places API 키 | ✅ |
| `INSTAGRAM_USERNAME` | 인스타그램 계정 | ✅ |
| `INSTAGRAM_PASSWORD` | 인스타그램 비밀번호 | ✅ |
| `ADMIN_SECRET` | 파이프라인 엔드포인트 보호 | ✅ |
| `ALLOWED_ORIGINS` | CORS 허용 출처 (쉼표 구분) | ✅ |
| `CRAWL_HASHTAGS` | 크롤링 해시태그 (쉼표 구분) | 선택 |

모바일:

| 변수 | 설명 |
|------|------|
| `EXPO_PUBLIC_API_BASE_URL` | Railway 배포 URL |

## Firebase Auth 연동 (프로필 탭)

현재 프로필 탭은 UI만 구현된 상태. 실제 구글 로그인 활성화:

1. [Firebase Console](https://console.firebase.google.com) 프로젝트 생성
2. Authentication > Sign-in method > Google 활성화
3. Android: `google-services.json` → `mobile/android/app/` 배치
4. iOS: `GoogleService-Info.plist` → `mobile/ios/` 배치
5. 패키지 설치:
   ```bash
   npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin
   ```
6. `mobile/app/(tabs)/profile.tsx`의 `handleGoogleLogin` 구현 교체

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/places/search?region=&category=&country=` | 장소 검색 |
| GET | `/api/places/trending` | 최근 30일 핫플 |
| GET | `/api/places/{id}` | 장소 상세 |
| POST | `/pipeline/run` | 파이프라인 수동 실행 (Admin) |
| GET | `/` | 헬스체크 |
