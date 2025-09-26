import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export default function Plan() {
  return (
    <SafeAreaView style={styles.screen}>
      <ThemedText type="title">Personalized Plan</ThemedText>
      <ThemedText>Workout and Nutrition plans will go here 🥗🏋️</ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#fff' },
});
