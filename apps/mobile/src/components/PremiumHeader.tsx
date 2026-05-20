import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { responsiveFont } from '../utils/responsive';

type Props = {
  title?: string;
  subtitle?: string;
  onNotifications?: () => void;
  onMessages?: () => void;
};

export default function PremiumHeader({
  title = 'VibeLoop',
  subtitle = 'Premium creator feed',
  onNotifications,
  onMessages
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.brandWrap}>
        <Text style={styles.logo}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={onNotifications}>
          <Text style={styles.icon}>♡</Text>
        </Pressable>

        <Pressable style={styles.iconButton} onPress={onMessages}>
          <Text style={styles.icon}>✉</Text>
          <View style={styles.badge} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  brandWrap: {
    flex: 1
  },
  logo: {
    color: colors.text,
    fontSize: responsiveFont(34),
    fontWeight: '900',
    letterSpacing: -1
  },
  subtitle: {
    color: colors.muted,
    marginTop: 2,
    fontSize: responsiveFont(12),
    fontWeight: '700'
  },
  actions: {
    flexDirection: 'row',
    gap: 10
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900'
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary
  }
});
