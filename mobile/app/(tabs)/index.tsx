import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import PlacePin from '../../components/PlacePin';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePlaceSearch } from '../../hooks/usePlaces';
import { Place } from '../../types';
import { CATEGORIES } from '../../constants/config';

const DEFAULT_REGION: Region = {
  latitude: 37.542,
  longitude: 127.056,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
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
    mapRef.current?.animateToRegion(
      {
        latitude: place.map_data.lat,
        longitude: place.map_data.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      400
    );
    router.push(`/place/${place.id}`);
  };

  const mapRegion: Region =
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[styles.chipText, category === cat && styles.chipTextActive]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && <LoadingSpinner message="핫플 찾는 중... ✨" />}

      {!isLoading && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          region={mapRegion}
        >
          {places.map((place) => (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.map_data.lat,
                longitude: place.map_data.lng,
              }}
              onPress={() => handlePinPress(place)}
            >
              <PlacePin
                place={place}
                isSelected={false}
                onPress={() => handlePinPress(place)}
              />
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
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  input: { flex: 1, padding: 12, fontSize: 15 },
  searchBtn: { padding: 12 },
  searchBtnText: { fontSize: 18 },
  chips: { marginTop: 8 },
  chip: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: 'white' },
});
