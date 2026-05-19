import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';

export default function NotificationsScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Likes, comments, follows, mentions and system alerts.</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 16, textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 18 },
  buttonText: { color: colors.text, fontWeight: '700' }
});
