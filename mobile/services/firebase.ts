/**
 * Firebase Web SDK 초기화
 *
 * 사용 방법:
 * 1. https://console.firebase.google.com 에서 프로젝트 생성
 * 2. 프로젝트 설정 > 웹 앱 추가 > SDK 구성 복사
 * 3. 아래 firebaseConfig 값 교체
 * 4. Authentication > Sign-in method > Google 활성화
 * 5. OAuth 2.0 클라이언트 ID 확인 (Google Cloud Console)
 *    → EXPO_PUBLIC_GOOGLE_CLIENT_ID (웹) / EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (iOS) 설정
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
