import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export default function Menu() {
  return (
    <SafeAreaView style={styles.screen}>
      <ThemedText type="title">Menu</ThemedText>
      <ThemedText>Settings and navigation links ⚙️</ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#fff' },
});
