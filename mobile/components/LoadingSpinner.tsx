import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';

interface Props {
  message?: string;
}

export default function LoadingSpinner({ message = '불러오는 중...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366f1" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  text: { marginTop: 12, color: '#6b7280', fontSize: 14 },
});
