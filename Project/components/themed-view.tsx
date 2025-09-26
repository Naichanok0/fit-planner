import { View, StyleSheet } from 'react-native';

export function ThemedView({ children, style }: any) {
  return <View style={[styles.default, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  default: { backgroundColor: '#fff' },
});
