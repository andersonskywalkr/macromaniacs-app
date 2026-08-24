import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, radius } from '@/theme/tokens';
import { Button } from '@/components/Button';
import { register } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/api/ApiError';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    setError(null);

    if (!form.email.trim() || !form.username.trim() || !form.password.trim() || !form.displayName.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    // Regra de senha real (tamanho mínimo etc.) deve ser confirmada com o
    // backend e validada lá também — o frontend nunca é a única barreira
    // (seção 5.3 do documento).
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const tokens = await register(form);
      await useAuthStore.getState().signIn(tokens);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível criar a conta. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: tokens.text }]}>Criar conta</Text>

          <TextInput
            accessibilityLabel="Nome de exibição"
            placeholder="Nome"
            placeholderTextColor={tokens.textSecondary}
            value={form.displayName}
            onChangeText={(v) => setField('displayName', v)}
            style={[styles.input, { backgroundColor: tokens.card, color: tokens.text }]}
          />
          <TextInput
            accessibilityLabel="Nome de usuário"
            placeholder="Username"
            placeholderTextColor={tokens.textSecondary}
            value={form.username}
            onChangeText={(v) => setField('username', v)}
            autoCapitalize="none"
            style={[styles.input, { backgroundColor: tokens.card, color: tokens.text }]}
          />
          <TextInput
            accessibilityLabel="Campo de email"
            placeholder="Email"
            placeholderTextColor={tokens.textSecondary}
            value={form.email}
            onChangeText={(v) => setField('email', v)}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { backgroundColor: tokens.card, color: tokens.text }]}
          />
          <TextInput
            accessibilityLabel="Campo de senha"
            placeholder="Senha"
            placeholderTextColor={tokens.textSecondary}
            value={form.password}
            onChangeText={(v) => setField('password', v)}
            secureTextEntry
            style={[styles.input, { backgroundColor: tokens.card, color: tokens.text }]}
          />

          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}

          <Button label="Criar conta" onPress={handleRegister} loading={loading} style={styles.button} />

          <Button
            label="Já tenho conta"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: spacing.sm },
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  error: { color: '#B42338', fontFamily: 'PlusJakartaSans', marginBottom: spacing.md },
  input: {
    borderRadius: radius.card / 2,
    fontFamily: 'PlusJakartaSans',
    marginBottom: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 28, fontWeight: '800', marginBottom: spacing.lg },
});
