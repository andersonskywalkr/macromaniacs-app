import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, radius } from '@/theme/tokens';
import { Button } from '@/components/Button';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/api/ApiError';
import { USE_MOCK } from '@/api/config';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// Credencial sugerida só pra facilitar teste em modo mock — o mock aceita
// qualquer email/senha não vazios, esse valor aqui é só conveniência.
const MOCK_EMAIL = 'teste@macromaniacs.com';
const MOCK_PASSWORD = '12345678';

export function LoginScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [email, setEmail] = useState(USE_MOCK ? MOCK_EMAIL : '');
  const [password, setPassword] = useState(USE_MOCK ? MOCK_PASSWORD : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);

    // Validação básica de campo (seção 126.1, item 1) — o backend ainda
    // valida de novo, isso é só feedback imediato de UI (seção 5.3/RNF-02).
    if (!email.trim() || !password.trim()) {
      setError('Preencha email e senha.');
      return;
    }

    setLoading(true);
    try {
      const tokens = await login(email.trim(), password);
      await useAuthStore.getState().signIn(tokens);
      // RootNavigator troca pra AppTabs automaticamente ao detectar
      // status === 'authenticated' — não precisa navigate() manual aqui.
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <Text style={[styles.title, { color: tokens.text }]}>Entrar</Text>

        {USE_MOCK && (
          <Text style={[styles.mockNotice, { color: tokens.textSecondary, backgroundColor: tokens.card }]}>
            Modo de teste (sem backend): qualquer email e senha funcionam. Já deixamos{'\n'}
            {MOCK_EMAIL} / {MOCK_PASSWORD} preenchidos pra você.
          </Text>
        )}

        <TextInput
          accessibilityLabel="Campo de email"
          placeholder="Email"
          placeholderTextColor={tokens.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { backgroundColor: tokens.card, color: tokens.text }]}
        />

        <TextInput
          accessibilityLabel="Campo de senha"
          placeholder="Senha"
          placeholderTextColor={tokens.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[styles.input, { backgroundColor: tokens.card, color: tokens.text }]}
        />

        {error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}

        <Button label="Entrar" onPress={handleLogin} loading={loading} style={styles.button} />

        <Button
          label="Criar conta"
          variant="secondary"
          onPress={() => navigation.navigate('Register')}
          style={styles.button}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: spacing.sm },
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  error: { color: '#B42338', fontFamily: 'PlusJakartaSans', marginBottom: spacing.md },
  input: {
    borderRadius: radius.card / 2,
    fontFamily: 'PlusJakartaSans',
    marginBottom: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  mockNotice: {
    borderRadius: radius.card / 2,
    fontFamily: 'PlusJakartaSans',
    fontSize: 12,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 28, fontWeight: '800', marginBottom: spacing.lg },
});
