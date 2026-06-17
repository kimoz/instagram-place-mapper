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
