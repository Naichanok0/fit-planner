import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export default function Profile() {
  return (
    <SafeAreaView style={styles.screen}>
      <ThemedText type="title">Profile</ThemedText>
      <ThemedText>User information will appear here 👤</ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#fff' },
});
