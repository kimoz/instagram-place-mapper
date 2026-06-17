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
              <Text
                style={[
                  styles.toggleText,
                  countryFilter === f && styles.toggleTextActive,
                ]}
              >
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
            <PlaceCard
              place={item}
              onPress={() => router.push(`/place/${item.id}`)}
            />
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
  headerRow: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 10 },
  toggle: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
  },
  toggleBtnActive: { backgroundColor: '#6366f1' },
  toggleText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  toggleTextActive: { color: 'white' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 6 },
  emptySubText: { fontSize: 13, color: '#9ca3af' },
});
