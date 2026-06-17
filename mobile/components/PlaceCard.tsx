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
        <View
          style={[
            styles.thumbnail,
            { backgroundColor: place.country === 'KR' ? '#e0e7ff' : '#fce7f3' },
          ]}
        >
          <Text style={styles.thumbnailEmoji}>
            {place.country === 'KR' ? '🇰🇷' : '✈️'}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {place.restaurant_name}
          </Text>
          <Text style={styles.region} numberOfLines={1}>
            {place.region}
          </Text>
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
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  thumbnailEmoji: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  region: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: { fontSize: 11, color: '#374151' },
  bookmarkBtn: { padding: 4 },
  bookmarkIcon: { fontSize: 18 },
  summary: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  rating: { fontSize: 12, color: '#d97706' },
});
