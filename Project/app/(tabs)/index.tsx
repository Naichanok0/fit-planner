import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  const plan = {
    title: "BEGINNER PLAN",
    subtitle: "BODYWEIGHT · 30 DAYS",
    duration: "8–15 min/day",
    progress: 0,
    days: [
      { day: 1, time: "08:38", rest: false },
      { day: 2, time: "10:14", rest: false },
      { day: 3, time: "09:14", rest: false },
      { day: 4, time: "Rest Day", rest: true },
      { day: 5, time: "11:05", rest: false },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>{plan.title}</Text>
      <Text style={styles.subHeader}>{plan.subtitle}</Text>
      <Text style={styles.duration}>{plan.duration}</Text>
      <Text style={styles.progress}>{plan.progress}% Finished</Text>

      {/* List Days */}
      <FlatList
        data={plan.days}
        keyExtractor={(item) => String(item.day)}
        renderItem={({ item }) => (
          <View style={styles.dayCard}>
            <View>
              <Text style={styles.dayTitle}>DAY {item.day}</Text>
              <Text style={styles.dayTime}>{item.time}</Text>
            </View>

            {item.rest ? (
              <Text style={styles.restLabel}>REST</Text>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push(`/workout/${item.day}`)}
              >
                <Text style={styles.startText}>START</Text>
              </Pressable>
            )}
          </View>
        )}
      />

      {/* Bottom Navigation */}
      <View style={styles.tabBar}>
        <Pressable style={styles.tabItem}>
          <Text style={[styles.tabText, styles.activeTab]}>30 PLAN</Text>
        </Pressable>
        <Pressable style={styles.tabItem}>
          <Text style={styles.tabText}>WORKOUT</Text>
        </Pressable>
        <Pressable style={styles.tabItem}>
          <Text style={styles.tabText}>REPORT</Text>
        </Pressable>
        <Pressable style={styles.tabItem}>
          <Text style={styles.tabText}>ME</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  header: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subHeader: { color: "#aaa", fontSize: 14, marginBottom: 4 },
  duration: { color: "#ddd", fontSize: 14 },
  progress: { color: "#aaa", fontSize: 12, marginBottom: 16 },

  dayCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  dayTime: { color: "#aaa", fontSize: 14 },
  restLabel: { color: "#f87171", fontSize: 16, fontWeight: "600" },

  startButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  startText: { color: "#fff", fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  tabItem: { alignItems: "center" },
  tabText: { color: "#aaa", fontSize: 12 },
  activeTab: { color: "#3b82f6", fontWeight: "700" },
});
