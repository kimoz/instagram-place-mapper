import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{place.restaurant_name}</Text>
          <Text style={styles.address}>🗺️ {place.map_data.address}</Text>
        </View>
        <View
          style={[
            styles.countryBadge,
            place.country === 'KR' ? styles.badgeKR : styles.badgeOverseas,
          ]}
        >
          <Text style={styles.countryText}>
            {place.country === 'KR' ? '🇰🇷 국내' : '✈️ 해외'}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        {place.map_data.category && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{place.map_data.category}</Text>
          </View>
        )}
        {place.map_data.rating_info && (
          <View style={[styles.chip, styles.chipYellow]}>
            <Text style={[styles.chipText, styles.chipTextYellow]}>
              ⭐ {place.map_data.rating_info}
            </Text>
          </View>
        )}
        {place.map_data.source && (
          <View style={[styles.chip, styles.chipPurple]}>
            <Text style={[styles.chipText, styles.chipTextPurple]}>
              {place.map_data.source}
            </Text>
          </View>
        )}
      </View>

      {place.insta_summary && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>📸 인스타그램 분석 요약</Text>
          <Text style={styles.summaryText}>"{place.insta_summary}"</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.mapBtn} onPress={openMapApp}>
          <Text style={styles.mapBtnText}>🗺️ 지도 앱으로 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
          onPress={() => toggleBookmark(place)}
        >
          <Text style={styles.bookmarkBtnText}>
            {bookmarked ? '🔖 저장됨' : '🔖 저장'}
          </Text>
        </TouchableOpacity>
      </View>

      {place.instagram_url && (
        <TouchableOpacity
          style={styles.instaBtn}
          onPress={() => Linking.openURL(place.instagram_url!).catch(() => Alert.alert('링크를 열 수 없어요'))}
        >
          <Text style={styles.instaBtnText}>📸 인스타그램 원본 보기</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  backBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: { color: 'white', fontWeight: '600' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: { flex: 1, marginRight: 8 },
  name: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  address: { fontSize: 13, color: '#6b7280' },
  countryBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeKR: { backgroundColor: '#ffe4e6' },
  badgeOverseas: { backgroundColor: '#dbeafe' },
  countryText: { fontSize: 12, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 12, color: '#374151' },
  chipYellow: { backgroundColor: '#fef3c7' },
  chipTextYellow: { color: '#d97706' },
  chipPurple: { backgroundColor: '#e0e7ff' },
  chipTextPurple: { color: '#4338ca' },
  summaryBox: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#db2777', marginBottom: 8 },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actions: { flexDirection: 'row', gap: 10 },
  mapBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  mapBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  bookmarkBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    minWidth: 90,
  },
  bookmarkBtnActive: { backgroundColor: '#e0e7ff' },
  bookmarkBtnText: { fontWeight: '600', fontSize: 14, color: '#374151' },
  instaBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  instaBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
});
