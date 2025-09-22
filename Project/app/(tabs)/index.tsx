import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { Button, Platform, StyleSheet, View } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const router = useRouter();

  // --- MOCK ข้อมูลผู้ใช้ (เชื่อมต่อ API/DB ภายหลังได้) ---
  const user = {
    name: 'ธัชพล',
    weightKg: 83,
    heightCm: 173,
    bodyFatPct: 26,
    targetWeightKg: 76,
    lastUpdated: '2025-09-21',
    today: {
      workout: 'HIIT 20 นาที + ดัมเบล',
      meals: ['ข้าวกล้องอกไก่ย่าง', 'สเต็กปลา + ผักย่าง'],
    },
    progress: [
      { date: '2025-09-15', weight: 83.5 },
      { date: '2025-09-18', weight: 83.0 },
      { date: '2025-09-21', weight: 82.7 },
    ],
  };

  const bmi = Number((user.weightKg / Math.pow(user.heightCm / 100, 2)).toFixed(1));
  const remain = Math.max(0, user.weightKg - user.targetWeightKg);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      {/* Header / Greeting */}
      <ThemedView style={styles.titleContainer}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title">FitLife Planner</ThemedText>
          <ThemedText type="default">
            สวัสดี {user.name} <ThemedText type="defaultSemiBold">👋</ThemedText>
          </ThemedText>
        </View>
        <HelloWave />
      </ThemedView>

      {/* Health Summary */}
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">สรุปสุขภาพวันนี้</ThemedText>
        <View style={styles.rowBetween}>
          <Stat label="น้ำหนัก" value={`${user.weightKg} kg`} />
          <Stat label="ส่วนสูง" value={`${user.heightCm} cm`} />
        </View>
        <View style={styles.rowBetween}>
          <Stat label="BMI" value={String(bmi)} />
          <Stat label="ไขมัน" value={`${user.bodyFatPct}%`} />
        </View>
        <ThemedText style={styles.muted}>อัปเดตล่าสุด: {user.lastUpdated}</ThemedText>
        <ThemedText>เหลืออีก ~{remain.toFixed(1)} kg ถึงเป้าหมาย</ThemedText>
      </ThemedView>

      {/* Progress Snapshot (แบบย่อ) */}
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">ความคืบหน้า</ThemedText>
        {user.progress.map((p, i) => (
          <View key={i} style={styles.rowBetween}>
            <ThemedText>{p.date}</ThemedText>
            <ThemedText>{p.weight} kg</ThemedText>
          </View>
        ))}
        <ThemedText style={styles.muted}>
          เคล็ดลับ: {Platform.select({ ios: 'เปิดแอปสุขภาพซิงค์ข้อมูลอัตโนมัติ', android: 'เชื่อม Google Fit เพื่อซิงค์ข้อมูล' })}
        </ThemedText>
      </ThemedView>

      {/* Today's Plan */}
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">แผนวันนี้</ThemedText>
        <ThemedText>ออกกำลังกาย: {user.today.workout}</ThemedText>
        <View style={{ gap: 4, marginTop: 8 }}>
          <ThemedText>อาหารแนะนำ:</ThemedText>
          {user.today.meals.map((m, i) => (
            <ThemedText key={i}>• {m}</ThemedText>
          ))}
        </View>
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">ทางลัด</ThemedText>
        <View style={styles.actionsRow}>
          <Button title="อัปโหลดภาพ" onPress={() => router.push('/upload')} />
          <Button title="บันทึกน้ำหนัก" onPress={() => router.push('/progress')} />
          <Button title="โปรแกรมวันนี้" onPress={() => router.push('/program')} />
        </View>
      </ThemedView>

      {/* Navigation / Links */}
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">ไปยังเมนูหลัก</ThemedText>
        <View style={{ gap: 8 }}>
          <Link href="/upload"><ThemedText type="link">อัปโหลดภาพใหม่</ThemedText></Link>
          <Link href="/analysis"><ThemedText type="link">ดูผลวิเคราะห์ร่างกาย</ThemedText></Link>
          <Link href="/program"><ThemedText type="link">โปรแกรมสุขภาพ</ThemedText></Link>
          <Link href="/progress"><ThemedText type="link">ติดตามความคืบหน้า</ThemedText></Link>
          <Link href="/profile"><ThemedText type="link">โปรไฟล์/การตั้งค่า</ThemedText></Link>
        </View>
      </ThemedView>

      {/* Developer hint (คงสไตล์เดิมของเทมเพลตไว้เผื่อดีบัก) */}
      <ThemedView style={styles.hintCard}>
        <ThemedText type="subtitle">Dev Hint</ThemedText>
        <ThemedText>
          แก้ไฟล์ <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> แล้วรีเฟรช.
          เปิด DevTools ด้วย{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({ ios: 'cmd + d', android: 'cmd + m', web: 'F12' })}
          </ThemedText>
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

/** ==== Helpers ==== */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <ThemedText style={styles.muted}>{label}</ThemedText>
      <ThemedText type="defaultSemiBold">{value}</ThemedText>
    </View>
  );
}

/** ==== Styles ==== */
const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#11111110',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  hintCard: {
    gap: 8,
    padding: 16,
    borderRadius: 16,
  },
  muted: {
    color: '#666',
  },
});
