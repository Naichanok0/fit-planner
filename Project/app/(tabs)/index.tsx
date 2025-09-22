// =============================
// FitLife Planner – Expo Router Starter (TypeScript)
// Multi-screen app with tabs: Home, Upload, Analysis, Program, Progress, Profile
// Minimal, mock-data-driven; ready to hook to API/DB later.
// =============================


// ===== FILE: app/_layout.tsx =====
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";


export default function RootLayout() {
useEffect(() => {
// Any global bootstrap if needed
}, []);


return (
<GestureHandlerRootView style={{ flex: 1 }}>
<SafeAreaProvider>
<Tabs screenOptions={{
headerShown: true,
tabBarLabelStyle: { fontSize: 12 },
tabBarStyle: { paddingVertical: Platform.OS === "ios" ? 8 : 4, height: 60 },
}}>
<Tabs.Screen name="index" options={{ title: "Home" }} />
<Tabs.Screen name="upload" options={{ title: "Upload" }} />
<Tabs.Screen name="analysis" options={{ title: "Analysis" }} />
<Tabs.Screen name="program/index" options={{ title: "Program" }} />
<Tabs.Screen name="progress" options={{ title: "Progress" }} />
<Tabs.Screen name="profile" options={{ title: "Profile" }} />
</Tabs>
</SafeAreaProvider>
</GestureHandlerRootView>
);
}


// ===== FILE: app/index.tsx (Home/Dashboard) =====
import { Link } from "expo-router";
import { ScrollView, View } from "react-native";
import { ThemedText, ThemedView } from "../components/Themed";
import HealthSummaryCard from "../components/HealthSummaryCard";
import TodayPlanCard from "../components/TodayPlanCard";
import QuickActions from "../components/QuickActions";


export default function HomeScreen() {
return (
<ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
<ThemedView style={{ gap: 12 }}>
<ThemedText type="title">FitLife Planner</ThemedText>
<ThemedText type="muted">ภาพรวมสุขภาพวันนี้</ThemedText>
</ThemedView>


<HealthSummaryCard
weightKg={83}
heightCm={173}
bodyFatPct={26}
lastUpdated="2025-09-21"
targetWeightKg={76}
/>


<TodayPlanCard
workoutTitle="HIIT 20 นาที + ดัมเบล"
meals={["ข้าวกล้องอกไก่ย่าง", "สเต็กปลา + ผักย่าง"]}
/>


<QuickActions />


<ThemedView style={{ gap: 8 }}>
<ThemedText type="subtitle">ไปยังเมนูหลัก</ThemedText>
<View style={{ gap: 8 }}>
<Link href="/upload"><ThemedText type="link">อัปโหลดภาพใหม่</ThemedText></Link>