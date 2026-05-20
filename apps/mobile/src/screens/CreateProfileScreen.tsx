import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function CreateProfileScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>+</Text>
      </View>

      <Text style={styles.title}>Set up profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor={colors.muted}
      />

      <TextInput
        style={styles.input}
        placeholder="Bio"
        placeholderTextColor={colors.muted}
      />

      <Pressable style={styles.button} onPress={() => navigation.replace('MainTabs')}>
        <Text style={styles.buttonText}>Enter App</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center'
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  avatarText: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '900'
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: colors.white,
    fontWeight: '900'
  }
});
