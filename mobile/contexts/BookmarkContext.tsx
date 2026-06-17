import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place } from '../types';

const STORAGE_KEY = '@bookmarks';

interface BookmarkContextValue {
  bookmarks: Place[];
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (place: Place) => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextValue>({
  bookmarks: [],
  isBookmarked: () => false,
  toggleBookmark: async () => {},
});

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Place[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setBookmarks(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  const save = useCallback(async (updated: Place[]) => {
    setBookmarks(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const isBookmarked = useCallback((id: string) => bookmarks.some((b) => b.id === id), [bookmarks]);

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

  return (
    <BookmarkContext.Provider value={{ bookmarks, isBookmarked, toggleBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarkContext() {
  return useContext(BookmarkContext);
}
