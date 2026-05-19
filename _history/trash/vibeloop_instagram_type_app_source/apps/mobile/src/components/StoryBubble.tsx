import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function StoryBubble() {
  return <View style={styles.bubble}><Text style={styles.text}>Story</Text></View>;
}

const styles = StyleSheet.create({
  bubble: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.text, fontSize: 12 }
});
