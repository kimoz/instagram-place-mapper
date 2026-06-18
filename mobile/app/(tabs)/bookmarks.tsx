import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useBookmarks } from '../../hooks/useBookmarks';
import { Place } from '../../types';

function BookmarkItem({
  place,
  onPress,
  onDelete,
}: {
  place: Place;
  onPress: () => void;
  onDelete: () => void;
}) {
  const confirmDelete = () => {
    Alert.alert('저장 취소', `"${place.restaurant_name}"을(를) 저장 목록에서 제거할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '제거', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemLeft}>
        <Text style={styles.name}>{place.restaurant_name}</Text>
        <Text style={styles.region}>
          {place.country === 'KR' ? '🇰🇷' : '✈️'} {place.region}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{place.map_data.category}</Text>
        </View>
        <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function BookmarksScreen() {
  const { bookmarks, toggleBookmark } = useBookmarks();
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
            onDelete={() => toggleBookmark(item)}
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
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  region: { fontSize: 12, color: '#6b7280' },
  categoryBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: { fontSize: 12, color: '#374151' },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 14, color: '#9ca3af', fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
