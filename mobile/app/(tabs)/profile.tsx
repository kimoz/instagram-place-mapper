import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../services/firebase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response?.type !== 'success' || !auth) return;
    const { id_token } = response.params;
    const credential = GoogleAuthProvider.credential(id_token);
    signInWithCredential(auth, credential).catch((err) => {
      Alert.alert('로그인 실패', err.message);
    });
  }, [response]);

  const handleLogin = () => {
    if (!isFirebaseConfigured) {
      Alert.alert(
        'Firebase 설정 필요',
        'mobile/.env 파일에 EXPO_PUBLIC_FIREBASE_API_KEY 등 Firebase 환경변수를 설정해주세요.\n\nREADME.md > Firebase Auth 연동 참고'
      );
      return;
    }
    promptAsync();
  };

  const handleLogout = () => {
    if (!auth) return;
    signOut(auth).catch((err) => Alert.alert('로그아웃 실패', err.message));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.title}>
          로그인하면 장소를{'\n'}어디서든 저장할 수 있어요
        </Text>
        <TouchableOpacity style={styles.googleBtn} onPress={handleLogin}>
          <Text style={styles.googleBtnText}>🔑 구글로 로그인</Text>
        </TouchableOpacity>
        {!isFirebaseConfigured && (
          <Text style={styles.note}>Firebase 설정 후 활성화됩니다</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.displayName ? user.displayName[0].toUpperCase() : '?'}
        </Text>
      </View>
      <Text style={styles.name}>{user.displayName ?? '사용자'}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  icon: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 30,
  },
  googleBtn: {
    backgroundColor: '#4285f4',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 12,
  },
  googleBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  note: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 30, color: 'white', fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 32 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  logoutBtnText: { color: '#6b7280', fontWeight: '600' },
});
