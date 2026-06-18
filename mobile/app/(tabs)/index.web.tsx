import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import LoadingSpinner from '../../components/LoadingSpinner';
import PlaceCard from '../../components/PlaceCard';
import { usePlaceSearch } from '../../hooks/usePlaces';
import { CATEGORIES } from '../../constants/config';

export default function MapScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('성수동');
  const [searchRegion, setSearchRegion] = useState('성수동');
  const [category, setCategory] = useState('전체');

  const { data: places = [], isLoading, isError, refetch } = usePlaceSearch({
    region: searchRegion,
    category: category === '전체' ? '' : category,
  });

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchRegion(trimmed);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ 지도 검색</Text>
        <Text style={styles.webNote}>지도는 모바일 앱에서 확인하세요</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="지역 검색 (예: 연남동)"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>🔍 검색</Text>
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

      {isLoading ? (
        <LoadingSpinner message="핫플 찾는 중... ✨" />
      ) : isError ? (
        <View style={styles.error}>
          <Text style={styles.errorIcon}>📡</Text>
          <Text style={styles.errorText}>서버에 연결할 수 없어요</Text>
          <Text style={styles.errorSub}>백엔드가 실행 중인지 확인해주세요</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaceCard place={item} onPress={() => router.push(`/place/${item.id}`)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>검색 결과가 없어요</Text>
              <Text style={styles.emptySubText}>다른 지역이나 카테고리로 검색해보세요</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  webNote: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  searchBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },
  chips: {},
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 6,
    backgroundColor: '#f3f4f6',
  },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: 'white' },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 6 },
  emptySubText: { fontSize: 13, color: '#9ca3af' },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorText: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  errorSub: { fontSize: 13, color: '#9ca3af', marginBottom: 20 },
  retryBtn: { backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: 'white', fontWeight: '700' },
});
