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
        <Text
          style={[styles.label, isSelected && styles.labelSelected]}
          numberOfLines={1}
        >
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginTop: 2,
  },
  dotSelected: { backgroundColor: '#6366f1' },
});
