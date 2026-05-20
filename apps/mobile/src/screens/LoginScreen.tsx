import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { apiPost } from '../api/client';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('demo@vibeloop.com');
  const [password, setPassword] = useState('123456');
  const [message, setMessage] = useState('');

  async function login() {
    setMessage('Connecting...');

    try {
      await apiPost('/api/v1/auth/login', {
        email,
        password
      });

      navigation.replace('MainTabs');
    } catch (error: any) {
      setMessage(error.message || 'Login failed');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>VibeLoop</Text>
      <Text style={styles.title}>Login to your creator world</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={login}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Create new account</Text>
      </Pressable>

      {!!message && <Text style={styles.message}>{message}</Text>}
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
  brand: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 30
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    fontSize: 16
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
    fontWeight: '900',
    fontSize: 16
  },
  link: {
    color: colors.accent,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '800'
  },
  message: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 18
  }
});
