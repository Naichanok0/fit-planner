// app/menu.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MenuScreen() {
  const router = useRouter();

  const items = [
    { label: 'Home',    href: '/' },
    { label: 'Report',  href: '/report' },
    { label: 'Plan',    href: '/plan' },
    { label: 'Profile', href: '/profile' },
    // { label: 'Settings', href: '/settings' },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={styles.backIcon}>←</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>Menu</ThemedText>
        <View style={{ width: 32 }} />
      </ThemedView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* เมนูแบบกริด */}
        <View style={styles.grid}>
          {items.map((it) => (
            <Link key={it.href} href={it.href} asChild>
              <Pressable style={styles.card}>
                <ThemedText style={styles.cardText}>{it.label}</ThemedText>
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={{ height: 16 }} />

        {/* ปุ่มตัวอย่างอื่น ๆ */}
        <Pressable style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]} onPress={() => {}}>
          <ThemedText style={[styles.actionText, { color: '#0f172a' }]}>Help & Support</ThemedText>
        </Pressable>

        <Pressable style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => { /* TODO: signOut */ }}>
          <ThemedText style={[styles.actionText, { color: '#991b1b' }]}>Log out</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 6, width: 32, alignItems: 'flex-start' },
  backIcon: { fontSize: 18 },
  title: { fontWeight: '700' },

  content: { padding: 16 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    aspectRatio: 1.2,
    borderRadius: 14,
    backgroundColor: '#eef6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  actionBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  actionText: { fontWeight: '700' },
});
