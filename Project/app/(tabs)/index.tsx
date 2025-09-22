import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Home() {
  const router = useRouter();

  // mock data (ปรับเป็นค่าจริง/ดึงจาก DB ภายหลังได้)
  const metrics = { weight: '170 lbs', height: `5'9"`, bmi: '24.3', body: '22%' };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ===== Header ===== */}
        <ThemedView style={styles.headerRow}>
          <ThemedText type="title" style={styles.appTitle}>HEALTH APP</ThemedText>
          <Pressable style={styles.menuBtn} onPress={() => router.push('/menu')}>
            <ThemedText style={styles.menuIcon}>☰</ThemedText>
          </Pressable>
        </ThemedView>

        {/* ===== Body Image + pose dots ===== */}
        <ThemedView style={styles.heroBox}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200' }}
            style={styles.bodyImg}
            contentFit="cover"
          />
          {POSE_POINTS.map((p, i) => (
            <View key={i} style={[styles.dot, { left: p.x, top: p.y }]} />
          ))}
        </ThemedView>

        {/* ===== Body Analysis ===== */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>BODY ANALYSIS</ThemedText>
        <ThemedView style={styles.analysisBox}>
          <Info label="Weight" value={metrics.weight} />
          <Info label="Height" value={metrics.height} />
          <Info label="BMI" value={metrics.bmi} />
          <Info label="Body" value={metrics.body} />
        </ThemedView>

        {/* ===== Buttons ===== */}
        <Pressable style={[styles.ctaBtn, styles.blue]} onPress={() => router.push('/report')}>
          <ThemedText style={styles.ctaText}>VIEW REPORT</ThemedText>
        </Pressable>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          WORKOUT & NUTRITION PLAN
        </ThemedText>
        <Pressable style={[styles.ctaBtn, styles.green]} onPress={() => router.push('/plan')}>
          <ThemedText style={styles.ctaText}>PERSONALIZED PLAN</ThemedText>
        </Pressable>

        {/* ===== Progress (มินิกราฟ) ===== */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>PROGRESS</ThemedText>
        <ThemedView style={styles.chartBox}>
          <View style={styles.grid} />
          <View style={[styles.lineSeg, { left: 12, top: 42, width: 60, transform: [{ rotateZ: '-10deg' }] }]} />
          <View style={[styles.lineSeg, { left: 72, top: 50, width: 60, transform: [{ rotateZ: '5deg' }] }]} />
          <View style={[styles.lineSeg, { left: 132, top: 46, width: 60, transform: [{ rotateZ: '12deg' }] }]} />
          <View style={[styles.lineSeg, { left: 192, top: 58, width: 60, transform: [{ rotateZ: '-8deg' }] }]} />
        </ThemedView>
      </ScrollView>

      {/* ===== Bottom Nav (fixed) ===== */}
      <ThemedView style={styles.tabBar}>
        <Link href="/" asChild>
          <Pressable style={styles.tabItem}><ThemedText style={[styles.tabIcon, styles.active]}>🏠</ThemedText></Pressable>
        </Link>
        <Link href="/report" asChild>
          <Pressable style={styles.tabItem}><ThemedText style={styles.tabIcon}>📊</ThemedText></Pressable>
        </Link>
        <Link href="/profile" asChild>
          <Pressable style={styles.tabItem}><ThemedText style={styles.tabIcon}>👤</ThemedText></Pressable>
        </Link>
      </ThemedView>
    </View>
  );
}

/* ===== Helpers ===== */
function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

/* ===== Mock จุด Pose ===== */
const POSE_POINTS = [
  { x: 90, y: 10 }, { x: 150, y: 10 }, // ไหล่
  { x: 120, y: 40 },                    // กลางอก
  { x: 85, y: 70 }, { x: 155, y: 70 },  // ศอก
  { x: 70, y: 110 }, { x: 170, y: 110 },// มือ
  { x: 120, y: 100 },                   // สะเอว
  { x: 95, y: 150 }, { x: 145, y: 150 },// เข่า
];

/* ===== Styles ===== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 90 }, // กันชนให้ไม่ทับแท็บล่าง

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  appTitle: { letterSpacing: 1 },
  menuBtn: { padding: 8 },
  menuIcon: { fontSize: 22 },

  heroBox: {
    height: 190, borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#eef6ff', marginBottom: 12, position: 'relative',
  },
  bodyImg: { width: '100%', height: '100%' },
  dot: {
    position: 'absolute', width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#2563eb', borderWidth: 2, borderColor: '#fff',
  },

  sectionTitle: { marginTop: 8 },

  analysisBox: {
    backgroundColor: '#f1f5f9', borderRadius: 14, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', gap: 8,
  },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 12, opacity: 0.7 },
  infoValue: { fontSize: 16, fontWeight: '700' },

  ctaBtn: {
    marginTop: 10, borderRadius: 10, paddingVertical: 12,
    alignItems: 'center',
  },
  blue: { backgroundColor: '#3b82f6' },
  green: { backgroundColor: '#10b981' },
  ctaText: { color: '#fff', fontWeight: '700' },

  chartBox: {
    height: 120, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff',
    marginTop: 8, marginBottom: 16,
  },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  lineSeg: { position: 'absolute', height: 2, backgroundColor: '#0f172a', borderRadius: 2 },

  tabBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  tabItem: { paddingHorizontal: 8 },
  tabIcon: { fontSize: 20, color: '#94a3b8' },
  active: { color: '#2563eb' },
});
