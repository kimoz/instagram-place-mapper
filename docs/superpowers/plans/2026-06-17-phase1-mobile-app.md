# Phase 1 Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React Native + Expo 앱 구축. 지도 탭(실제 핀), 피드 탭(카드 스크롤), 장소 상세, 북마크 탭(로컬 스토리지), 구글 로그인(Firebase Auth)

**Architecture:** Expo Router(파일 기반 라우팅) + 하단 탭 네비게이션. API 클라이언트는 단일 `services/api.ts`로 집중. 상태 관리는 React Context(심플). 북마크는 AsyncStorage → Phase 3에서 서버 동기화.

**Tech Stack:** React Native, Expo SDK 52, Expo Router, react-native-maps, @tanstack/react-query, axios, @react-native-async-storage/async-storage, @react-native-firebase/auth, TypeScript

**전제 조건:** 백엔드 계획(2026-06-17-phase1-backend-pipeline.md) 완료, Railway API URL 확보

---

## 파일 구조

```
mobile/
├── app/
│   ├── _layout.tsx               # (신규) 루트 레이아웃 + QueryClient
│   ├── (tabs)/
│   │   ├── _layout.tsx           # (신규) 하단 탭 정의
│   │   ├── index.tsx             # (신규) 지도 탭
│   │   ├── feed.tsx              # (신규) 피드 탭
│   │   ├── bookmarks.tsx         # (신규) 저장 탭
│   │   └── profile.tsx           # (신규) 프로필 탭
│   └── place/
│       └── [id].tsx              # (신규) 장소 상세 (스택)
├── components/
│   ├── PlacePin.tsx              # (신규) 지도 핀 컴포넌트
│   ├── PlaceCard.tsx             # (신규) 피드 카드 컴포넌트
│   └── LoadingSpinner.tsx        # (신규) 로딩 인디케이터
├── services/
│   └── api.ts                    # (신규) API 클라이언트
├── hooks/
│   ├── usePlaces.ts              # (신규) 장소 데이터 훅
│   └── useBookmarks.ts           # (신규) 북마크 AsyncStorage 훅
├── types/
│   └── index.ts                  # (신규) 공유 타입
├── constants/
│   └── config.ts                 # (신규) API URL 등 설정
├── app.json                      # (수정) Expo 설정
└── .env                          # (신규) 환경 변수
```

---

## Task 1: Expo 프로젝트 세팅

**Files:**
- Create: `mobile/` (전체 디렉토리)

- [ ] **Step 1: Expo 프로젝트 생성**

```bash
cd "c:/Users/KEYMEDI/AI 프로젝트/instagram-place-mapper"
npx create-expo-app mobile --template blank-typescript
cd mobile
```

- [ ] **Step 2: 의존성 설치**

```bash
npx expo install expo-router react-native-maps @tanstack/react-query axios \
  @react-native-async-storage/async-storage expo-linking expo-constants \
  expo-status-bar react-native-safe-area-context react-native-screens

npm install --save-dev @types/react-native-maps
```

- [ ] **Step 3: app.json 업데이트**

```json
{
  "expo": {
    "name": "Instagram Place Mapper",
    "slug": "instagram-place-mapper",
    "version": "1.0.0",
    "scheme": "placemapper",
    "web": { "bundler": "metro" },
    "plugins": [
      "expo-router",
      [
        "react-native-maps",
        { "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY" }
      ]
    ],
    "android": {
      "package": "com.placemapper.app",
      "config": {
        "googleMaps": { "apiKey": "YOUR_GOOGLE_MAPS_API_KEY" }
      }
    },
    "ios": {
      "bundleIdentifier": "com.placemapper.app"
    }
  }
}
```

- [ ] **Step 4: .env 생성**

```
EXPO_PUBLIC_API_BASE_URL=https://your-app.railway.app
```

- [ ] **Step 5: types/index.ts 작성**

```typescript
export interface MapData {
  address: string;
  category: string;
  rating_info: string | null;
  source: string;
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  restaurant_name: string;
  region: string;
  country: string;
  insta_summary: string | null;
  instagram_url: string | null;
  thumbnail_url: string | null;
  map_data: MapData;
}

export interface SearchParams {
  region?: string;
  category?: string;
  country?: string;
}
```

- [ ] **Step 6: constants/config.ts 작성**

```typescript
import Constants from 'expo-constants';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const CATEGORIES = ['전체', '카페', '맛집', '술집', '기타'] as const;
export const COUNTRIES = [
  { label: '전체', value: '' },
  { label: '🇰🇷 국내', value: 'KR' },
  { label: '✈️ 해외', value: '' },
] as const;
```

- [ ] **Step 7: Commit**

```bash
git add mobile/
git commit -m "feat: Expo project scaffold with types and config"
```

---

## Task 2: API 서비스 레이어 + React Query 설정

**Files:**
- Create: `mobile/services/api.ts`
- Create: `mobile/hooks/usePlaces.ts`
- Create: `mobile/app/_layout.tsx`

- [ ] **Step 1: services/api.ts 작성**

```typescript
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { Place } from '../types';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

export async function searchPlaces(params: {
  region?: string;
  category?: string;
  country?: string;
}): Promise<Place[]> {
  const { data } = await client.get('/api/places/search', { params });
  if (!data.success) return [];
  return data.data as Place[];
}

export async function getTrendingPlaces(): Promise<Place[]> {
  const { data } = await client.get('/api/places/trending');
  if (!data.success) return [];
  return data.data as Place[];
}

export async function getPlace(id: string): Promise<Place> {
  const { data } = await client.get(`/api/places/${id}`);
  return data as Place;
}
```

- [ ] **Step 2: hooks/usePlaces.ts 작성**

```typescript
import { useQuery } from '@tanstack/react-query';
import { searchPlaces, getTrendingPlaces, getPlace } from '../services/api';
import { SearchParams } from '../types';

export function usePlaceSearch(params: SearchParams) {
  return useQuery({
    queryKey: ['places', 'search', params],
    queryFn: () => searchPlaces(params),
    enabled: Object.values(params).some(Boolean),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTrendingPlaces() {
  return useQuery({
    queryKey: ['places', 'trending'],
    queryFn: getTrendingPlaces,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePlaceDetail(id: string) {
  return useQuery({
    queryKey: ['places', id],
    queryFn: () => getPlace(id),
    enabled: !!id,
  });
}
```

- [ ] **Step 3: app/_layout.tsx 작성**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="place/[id]"
            options={{ title: '장소 상세', headerBackTitle: '뒤로' }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: 앱 실행 확인**

```bash
cd mobile && npx expo start
```

Expected: Metro 번들러 시작, 앱 실행

- [ ] **Step 5: Commit**

```bash
git add mobile/services/ mobile/hooks/ mobile/app/_layout.tsx
git commit -m "feat: API service layer and React Query hooks"
```

---

## Task 3: 하단 탭 네비게이션 + LoadingSpinner

**Files:**
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/components/LoadingSpinner.tsx`

- [ ] **Step 1: components/LoadingSpinner.tsx 작성**

```tsx
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';

interface Props {
  message?: string;
}

export default function LoadingSpinner({ message = '불러오는 중...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  text: { marginTop: 12, color: '#6b7280', fontSize: 14 },
});
```

- [ ] **Step 2: app/(tabs)/_layout.tsx 작성**

```tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 4 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '지도', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text> }}
      />
      <Tabs.Screen
        name="feed"
        options={{ title: '피드', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📸</Text> }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{ title: '저장', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔖</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '프로필', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text> }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: 임시 탭 화면 생성 (이후 교체)**

`mobile/app/(tabs)/feed.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function FeedScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>피드</Text></View>;
}
```

`mobile/app/(tabs)/bookmarks.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function BookmarksScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>저장</Text></View>;
}
```

`mobile/app/(tabs)/profile.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function ProfileScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>프로필</Text></View>;
}
```

- [ ] **Step 4: 앱 실행 — 탭 4개 확인**

```bash
npx expo start
```

Expected: 하단 탭 4개, 전환 동작

- [ ] **Step 5: Commit**

```bash
git add mobile/app/(tabs)/ mobile/components/LoadingSpinner.tsx
git commit -m "feat: bottom tab navigation with 4 tabs"
```

---

## Task 4: PlacePin + 지도 탭

**Files:**
- Create: `mobile/components/PlacePin.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: components/PlacePin.tsx 작성**

```tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Place } from '../types';

interface Props {
  place: Place;
  isSelected: boolean;
  onPress: () => void;
}

export default function PlacePin({ place, isSelected, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.wrapper}>
      <View style={[styles.bubble, isSelected && styles.bubbleSelected]}>
        <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={1}>
          {place.restaurant_name}
        </Text>
      </View>
      <View style={[styles.dot, isSelected && styles.dotSelected]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  bubble: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    maxWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleSelected: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  label: { fontSize: 11, fontWeight: '600', color: '#111827' },
  labelSelected: { color: 'white' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb', marginTop: 2 },
  dotSelected: { backgroundColor: '#6366f1' },
});
```

- [ ] **Step 2: app/(tabs)/index.tsx 작성**

```tsx
import { useState, useRef } from 'react';
import {
  View, TextInput, TouchableOpacity, Text,
  ScrollView, StyleSheet, Dimensions, Alert,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import PlacePin from '../../components/PlacePin';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePlaceSearch } from '../../hooks/usePlaces';
import { Place } from '../../types';
import { CATEGORIES } from '../../constants/config';

const { width } = Dimensions.get('window');

const DEFAULT_REGION: Region = {
  latitude: 37.542, longitude: 127.056,
  latitudeDelta: 0.02, longitudeDelta: 0.02,
};

export default function MapScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('성수동');
  const [searchRegion, setSearchRegion] = useState('성수동');
  const [category, setCategory] = useState('전체');
  const mapRef = useRef<MapView>(null);

  const { data: places = [], isLoading } = usePlaceSearch({
    region: searchRegion,
    category: category === '전체' ? '' : category,
  });

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchRegion(trimmed);
  };

  const handlePinPress = (place: Place) => {
    mapRef.current?.animateToRegion({
      latitude: place.map_data.lat,
      longitude: place.map_data.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 400);
    router.push(`/place/${place.id}`);
  };

  const mapRegion: Region | undefined =
    places.length > 0
      ? {
          latitude: places[0].map_data.lat,
          longitude: places[0].map_data.lng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }
      : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      {/* 검색 오버레이 */}
      <View style={styles.searchOverlay}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="지역 검색 (예: 연남동)"
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && <LoadingSpinner message="핫플 찾는 중... ✨" />}

      {/* 지도 */}
      {!isLoading && (
        <MapView ref={mapRef} style={StyleSheet.absoluteFill} region={mapRegion}>
          {places.map((place) => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.map_data.lat, longitude: place.map_data.lng }}
              onPress={() => handlePinPress(place)}
            >
              <PlacePin place={place} isSelected={false} onPress={() => handlePinPress(place)} />
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchOverlay: {
    position: 'absolute', top: 60, left: 12, right: 12, zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row', backgroundColor: 'white',
    borderRadius: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15,
    shadowRadius: 4, elevation: 4,
  },
  input: { flex: 1, padding: 12, fontSize: 15 },
  searchBtn: { padding: 12 },
  searchBtnText: { fontSize: 18 },
  chips: { marginTop: 8 },
  chip: {
    backgroundColor: 'white', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 6,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: 'white' },
});
```

- [ ] **Step 3: 앱 실행 — 지도 + 핀 확인**

```bash
npx expo start
```

Expected: 지도 렌더링, 검색하면 핀 표시

- [ ] **Step 4: Commit**

```bash
git add mobile/components/PlacePin.tsx mobile/app/\(tabs\)/index.tsx
git commit -m "feat: map tab with react-native-maps, search, category filter, and place pins"
```

---

## Task 5: 장소 상세 화면

**Files:**
- Create: `mobile/app/place/[id].tsx`

- [ ] **Step 1: app/place/[id].tsx 작성**

```tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePlaceDetail } from '../../hooks/usePlaces';
import { useBookmarks } from '../../hooks/useBookmarks';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: place, isLoading, isError } = usePlaceDetail(id);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  if (isLoading) return <LoadingSpinner />;
  if (isError || !place) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>장소를 불러올 수 없어요</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openMapApp = () => {
    const { lat, lng } = place.map_data;
    const label = encodeURIComponent(place.restaurant_name);
    const url = `https://maps.google.com/?q=${lat},${lng}&label=${label}`;
    Linking.openURL(url).catch(() => Alert.alert('지도 앱을 열 수 없어요'));
  };

  const bookmarked = isBookmarked(place.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{place.restaurant_name}</Text>
          <Text style={styles.address}>🗺️ {place.map_data.address}</Text>
        </View>
        <View style={[styles.countryBadge, place.country === 'KR' ? styles.badgeKR : styles.badgeOverseas]}>
          <Text style={styles.countryText}>
            {place.country === 'KR' ? '🇰🇷 국내' : '✈️ 해외'}
          </Text>
        </View>
      </View>

      {/* 칩 */}
      <View style={styles.chips}>
        {place.map_data.category && (
          <View style={styles.chip}><Text style={styles.chipText}>{place.map_data.category}</Text></View>
        )}
        {place.map_data.rating_info && (
          <View style={[styles.chip, styles.chipYellow]}>
            <Text style={[styles.chipText, styles.chipTextYellow]}>⭐ {place.map_data.rating_info}</Text>
          </View>
        )}
        {place.map_data.source && (
          <View style={[styles.chip, styles.chipPurple]}>
            <Text style={[styles.chipText, styles.chipTextPurple]}>{place.map_data.source}</Text>
          </View>
        )}
      </View>

      {/* 인스타 요약 */}
      {place.insta_summary && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>📸 인스타그램 분석 요약</Text>
          <Text style={styles.summaryText}>"{place.insta_summary}"</Text>
        </View>
      )}

      {/* 버튼 */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.mapBtn} onPress={openMapApp}>
          <Text style={styles.mapBtnText}>🗺️ 지도 앱으로 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
          onPress={() => toggleBookmark(place)}
        >
          <Text style={styles.bookmarkBtnText}>{bookmarked ? '🔖 저장됨' : '🔖 저장'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  backBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: 'white', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerLeft: { flex: 1, marginRight: 8 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  address: { fontSize: 13, color: '#6b7280' },
  countryBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeKR: { backgroundColor: '#ffe4e6' },
  badgeOverseas: { backgroundColor: '#dbeafe' },
  countryText: { fontSize: 12, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: { backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, color: '#374151' },
  chipYellow: { backgroundColor: '#fef3c7' },
  chipTextYellow: { color: '#d97706' },
  chipPurple: { backgroundColor: '#e0e7ff' },
  chipTextPurple: { color: '#4338ca' },
  summaryBox: { backgroundColor: '#fdf2f8', borderRadius: 12, padding: 16, marginBottom: 20 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#db2777', marginBottom: 8 },
  summaryText: { fontSize: 14, color: '#374151', lineHeight: 22, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10 },
  mapBtn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 10, padding: 14, alignItems: 'center' },
  mapBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  bookmarkBtn: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 14, alignItems: 'center', minWidth: 90 },
  bookmarkBtnActive: { backgroundColor: '#e0e7ff' },
  bookmarkBtnText: { fontWeight: '600', fontSize: 14, color: '#374151' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/place/
git commit -m "feat: place detail screen with map link and bookmark button"
```

---

## Task 6: 북마크 훅 (AsyncStorage) + 저장 탭

**Files:**
- Create: `mobile/hooks/useBookmarks.ts`
- Modify: `mobile/app/(tabs)/bookmarks.tsx`

- [ ] **Step 1: hooks/useBookmarks.ts 작성**

```typescript
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place } from '../types';

const STORAGE_KEY = '@bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Place[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setBookmarks(JSON.parse(raw));
    });
  }, []);

  const save = useCallback(async (updated: Place[]) => {
    setBookmarks(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (place: Place) => {
      if (isBookmarked(place.id)) {
        await save(bookmarks.filter((b) => b.id !== place.id));
      } else {
        await save([...bookmarks, place]);
      }
    },
    [bookmarks, isBookmarked, save]
  );

  return { bookmarks, isBookmarked, toggleBookmark };
}
```

- [ ] **Step 2: app/(tabs)/bookmarks.tsx 교체**

```tsx
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useBookmarks } from '../../hooks/useBookmarks';
import { Place } from '../../types';

function BookmarkItem({ place, onPress }: { place: Place; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Text style={styles.name}>{place.restaurant_name}</Text>
        <Text style={styles.region}>
          {place.country === 'KR' ? '🇰🇷' : '✈️'} {place.region}
        </Text>
      </View>
      <Text style={styles.category}>{place.map_data.category}</Text>
    </TouchableOpacity>
  );
}

export default function BookmarksScreen() {
  const { bookmarks } = useBookmarks();
  const router = useRouter();

  if (bookmarks.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🔖</Text>
        <Text style={styles.emptyTitle}>저장한 장소가 없어요</Text>
        <Text style={styles.emptySubtitle}>지도나 피드에서 장소를 저장해보세요</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>저장한 장소 {bookmarks.length}곳</Text>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookmarkItem place={item} onPress={() => router.push(`/place/${item.id}`)} />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { fontSize: 18, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 8 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  itemLeft: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  region: { fontSize: 12, color: '#6b7280' },
  category: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, color: '#374151' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/hooks/useBookmarks.ts mobile/app/\(tabs\)/bookmarks.tsx
git commit -m "feat: bookmark hook with AsyncStorage persistence, bookmarks tab"
```

---

## Task 7: 피드 탭 + PlaceCard 컴포넌트

**Files:**
- Create: `mobile/components/PlaceCard.tsx`
- Modify: `mobile/app/(tabs)/feed.tsx`

- [ ] **Step 1: components/PlaceCard.tsx 작성**

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Place } from '../types';
import { useBookmarks } from '../hooks/useBookmarks';

interface Props {
  place: Place;
  onPress: () => void;
}

export default function PlaceCard({ place, onPress }: Props) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(place.id);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        <View style={[styles.thumbnail, { backgroundColor: place.country === 'KR' ? '#e0e7ff' : '#fce7f3' }]}>
          <Text style={styles.thumbnailEmoji}>{place.country === 'KR' ? '🇰🇷' : '✈️'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{place.restaurant_name}</Text>
          <Text style={styles.region} numberOfLines={1}>{place.region}</Text>
          {place.map_data.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{place.map_data.category}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => toggleBookmark(place)} style={styles.bookmarkBtn}>
          <Text style={styles.bookmarkIcon}>{bookmarked ? '🔖' : '🔗'}</Text>
        </TouchableOpacity>
      </View>
      {place.insta_summary && (
        <Text style={styles.summary} numberOfLines={2}>
          "{place.insta_summary}"
        </Text>
      )}
      {place.map_data.rating_info && (
        <Text style={styles.rating}>⭐ {place.map_data.rating_info}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginHorizontal: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  thumbnail: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  thumbnailEmoji: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  region: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  categoryText: { fontSize: 11, color: '#374151' },
  bookmarkBtn: { padding: 4 },
  bookmarkIcon: { fontSize: 18 },
  summary: { fontSize: 13, color: '#4b5563', lineHeight: 19, fontStyle: 'italic', marginBottom: 6 },
  rating: { fontSize: 12, color: '#d97706' },
});
```

- [ ] **Step 2: app/(tabs)/feed.tsx 교체**

```tsx
import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import PlaceCard from '../../components/PlaceCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTrendingPlaces } from '../../hooks/usePlaces';

export default function FeedScreen() {
  const router = useRouter();
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'KR' | 'OS'>('ALL');
  const { data: places = [], isLoading } = useTrendingPlaces();

  const filtered = places.filter((p) => {
    if (countryFilter === 'KR') return p.country === 'KR';
    if (countryFilter === 'OS') return p.country !== 'KR';
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🔥 핫플 피드</Text>
        <View style={styles.toggle}>
          {(['ALL', 'KR', 'OS'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.toggleBtn, countryFilter === f && styles.toggleBtnActive]}
              onPress={() => setCountryFilter(f)}
            >
              <Text style={[styles.toggleText, countryFilter === f && styles.toggleTextActive]}>
                {f === 'ALL' ? '전체' : f === 'KR' ? '🇰🇷 국내' : '✈️ 해외'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaceCard place={item} onPress={() => router.push(`/place/${item.id}`)} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>아직 피드 데이터가 없어요</Text>
              <Text style={styles.emptySubText}>파이프라인 실행 후 새로 고침해보세요</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerRow: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 10 },
  toggle: { flexDirection: 'row', gap: 6 },
  toggleBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f3f4f6' },
  toggleBtnActive: { backgroundColor: '#6366f1' },
  toggleText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  toggleTextActive: { color: 'white' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 6 },
  emptySubText: { fontSize: 13, color: '#9ca3af' },
});
```

- [ ] **Step 3: 앱 실행 — 피드 탭 확인**

```bash
npx expo start
```

Expected: 피드 탭에 카드 목록, 국내/해외 토글 동작

- [ ] **Step 4: Commit**

```bash
git add mobile/components/PlaceCard.tsx mobile/app/\(tabs\)/feed.tsx
git commit -m "feat: feed tab with PlaceCard, trending places, country filter"
```

---

## Task 8: Firebase Auth (구글 로그인) + 프로필 탭

**Files:**
- Modify: `mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Firebase 프로젝트 생성**

1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성
2. Authentication → Google 로그인 사용 설정
3. 프로젝트 설정 → iOS/Android 앱 추가 → `google-services.json` / `GoogleService-Info.plist` 다운로드

- [ ] **Step 2: Firebase SDK 설치**

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth
npx expo install expo-build-properties
npm install @react-native-google-signin/google-signin
```

- [ ] **Step 3: app.json에 Firebase 플러그인 추가**

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      ["expo-build-properties", {
        "ios": { "useFrameworks": "static" }
      }]
    ]
  }
}
```

- [ ] **Step 4: google-services.json 배치**

```
mobile/android/app/google-services.json
mobile/ios/GoogleService-Info.plist
```

- [ ] **Step 5: app/(tabs)/profile.tsx 작성**

```tsx
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID',  // Firebase 콘솔에서 확인
});

export default function ProfileScreen() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return auth().onAuthStateChanged(setUser);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
    } catch (e) {
      Alert.alert('로그인 실패', '다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth().signOut();
    await GoogleSignin.revokeAccess();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>로그인하면 장소를{'\n'}어디서든 저장할 수 있어요</Text>
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={loading}>
          <Text style={styles.googleBtnText}>{loading ? '로그인 중...' : '🔑 구글로 로그인'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.displayName?.[0] ?? '?'}</Text>
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 32, lineHeight: 30 },
  googleBtn: { backgroundColor: '#4285f4', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  googleBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 30, color: 'white', fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280', marginBottom: 32 },
  logoutBtn: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  logoutBtnText: { color: '#6b7280', fontWeight: '600' },
});
```

- [ ] **Step 6: 개발 빌드 생성 (Firebase는 Expo Go 불가)**

```bash
npx expo run:android
# 또는
npx expo run:ios
```

- [ ] **Step 7: Commit**

```bash
git add mobile/app/\(tabs\)/profile.tsx mobile/app.json
git commit -m "feat: Google sign-in via Firebase Auth, profile tab"
```

---

## 전체 검증 체크리스트

- [ ] 지도 탭 — 검색하면 API 호출, 핀 렌더링
- [ ] 지도 탭 — 카테고리 칩 필터 동작
- [ ] 핀 클릭 → 장소 상세로 이동
- [ ] 장소 상세 — 인스타 요약, 주소, 칩 표시
- [ ] 장소 상세 — "지도 앱으로 보기" → 구글맵 열림
- [ ] 장소 상세 — 북마크 버튼 → 저장 탭에 반영
- [ ] 피드 탭 — 카드 스크롤, 국내/해외 토글
- [ ] 피드 탭 — 카드 탭 → 장소 상세 이동
- [ ] 저장 탭 — 북마크한 장소 목록
- [ ] 저장 탭 — 항목 탭 → 장소 상세 이동
- [ ] 프로필 탭 — 구글 로그인 → 유저 정보 표시
- [ ] 앱 종료 후 재시작 — 북마크 유지됨 (AsyncStorage)
