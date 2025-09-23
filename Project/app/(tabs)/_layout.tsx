// app/_layout.tsx
import { Slot } from 'expo-router';

export default function RootLayout() {
  // ไม่สร้าง Tabs/Stack เพื่อเลี่ยง error level undefined
  return <Slot />;
}
