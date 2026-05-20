import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>V</Text>
      </View>

      <Text style={styles.title}>VibeLoop</Text>
      <Text style={styles.subtitle}>Share moments. Discover people.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  logoText: {
    color: colors.white,
    fontSize: 70,
    fontWeight: '900'
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.muted,
    marginTop: 10,
    fontSize: 16
  }
});
