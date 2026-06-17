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
          <BookmarkItem
            place={item}
            onPress={() => router.push(`/place/${item.id}`)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemLeft: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  region: { fontSize: 12, color: '#6b7280' },
  category: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 12,
    color: '#374151',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
