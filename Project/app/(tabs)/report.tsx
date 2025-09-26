import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Report() {
  return (
    <SafeAreaView style={styles.screen}>
      <ThemedText type="title">Progress Report</ThemedText>
      <ThemedView style={styles.box}>
        <ThemedText>Workout summary will appear here 📊</ThemedText>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#fff' },
  box: { marginTop: 20, padding: 20, borderRadius: 12, backgroundColor: '#f1f5f9' },
});
