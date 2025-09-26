import { Text, StyleSheet } from 'react-native';

export function ThemedText({ children, type = "default", style }: any) {
  return <Text style={[styles[type], style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  default: { fontSize: 14, color: '#0f172a' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
});
