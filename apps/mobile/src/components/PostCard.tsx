import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function PostCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.user}>@creator</Text>
      <View style={styles.media} />
      <Text style={styles.caption}>Demo caption for future post card.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 22, padding: 14, marginBottom: 16 },
  user: { color: colors.text, fontWeight: '700', marginBottom: 10 },
  media: { height: 280, borderRadius: 18, backgroundColor: '#222233', marginBottom: 10 },
  caption: { color: colors.muted }
});
