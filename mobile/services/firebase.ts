import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (apiKey) {
  const firebaseConfig = {
    apiKey,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  };
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

export { auth };
export const isFirebaseConfigured = !!apiKey;
