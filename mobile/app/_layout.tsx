import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BookmarkProvider } from '../contexts/BookmarkContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <BookmarkProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="place/[id]"
              options={{ title: '장소 상세', headerBackTitle: '뒤로' }}
            />
          </Stack>
        </BookmarkProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
