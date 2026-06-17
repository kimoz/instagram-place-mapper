import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';

interface MockUser {
  displayName: string;
  email: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      Alert.alert(
        '구글 로그인',
        'Firebase Auth 연동 필요\n\n설정 방법:\n1. Firebase Console에서 프로젝트 생성\n2. Google 로그인 사용 설정\n3. google-services.json 배치\n4. @react-native-firebase/auth 설치'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          로그인하면 장소를{'\n'}어디서든 저장할 수 있어요
        </Text>
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Text style={styles.googleBtnText}>
            {loading ? '로그인 중...' : '🔑 구글로 로그인'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.note}>Firebase Auth 설정 후 활성화됩니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.displayName[0]}</Text>
      </View>
      <Text style={styles.name}>{user.displayName}</Text>
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
