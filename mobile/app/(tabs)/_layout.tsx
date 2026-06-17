import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { paddingBottom: 4 },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '지도',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text>,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: '피드',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📸</Text>,
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: '저장',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔖</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
