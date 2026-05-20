import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { apiPost } from '../api/client';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('new@vibeloop.com');
  const [username, setUsername] = useState('newcreator');
  const [password, setPassword] = useState('123456');
  const [message, setMessage] = useState('');

  async function register() {
    setMessage('Creating account...');

    try {
      await apiPost('/api/v1/auth/register', {
        email,
        username,
        password
      });

      navigation.replace('CreateProfile');
    } catch (error: any) {
      setMessage(error.message || 'Register failed');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

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
        placeholder="Username"
        placeholderTextColor={colors.muted}
        value={username}
        onChangeText={setUsername}
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

      <Pressable style={styles.button} onPress={register}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to login</Text>
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
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 28
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
