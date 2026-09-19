import React, { useState } from 'react';
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { MascotIllustration } from '@/components/MascotIllustration';
import { GoogleIcon } from '@/components/icons';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/api/ApiError';
import { USE_MOCK } from '@/api/config';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// Credencial sugerida só pra facilitar teste em modo mock — o mock aceita
// qualquer usuário/senha não vazios, esse valor aqui é só conveniência.
const MOCK_USER = 'teste@macromaniacs.com';
const MOCK_PASSWORD = '12345678';

// Login social (Google/Apple/Facebook) — nenhum SDK de OAuth está nas
// dependências do projeto ainda, e adicionar um está fora do escopo desta
// tela. Os botões seguem o visual do protótipo, mas ficam inertes (avisam
// que não está disponível) em vez de simular uma sessão autenticada falsa.
function handleSocialLogin(provider: string) {
  Alert.alert('Em breve', `Login com ${provider} ainda não está disponível.`);
}

export function LoginScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [identifier, setIdentifier] = useState(USE_MOCK ? MOCK_USER : '');
  const [password, setPassword] = useState(USE_MOCK ? MOCK_PASSWORD : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);

    // Validação básica de campo (seção 126.1, item 1) — o backend ainda
    // valida de novo, isso é só feedback imediato de UI (seção 5.3/RNF-02).
    if (!identifier.trim() || !password.trim()) {
      setError('Preencha usuário e senha.');
      return;
    }

    setLoading(true);
    try {
      const tokens = await login(identifier.trim(), password);
      await useAuthStore.getState().signIn(tokens);
      // RootNavigator troca de tela automaticamente ao detectar
      // status === 'authenticated' — não precisa navigate() manual aqui.
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoiding}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <MascotIllustration width={200} />
          </View>

          <Text style={[styles.title, { color: tokens.text }]}>Bem-vindo!</Text>
          <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
            Continue sua jornada com o MacroManiacs.
          </Text>

          <View style={styles.form}>
            <TextField
              accessibilityLabel="Usuário"
              placeholder="Usuário"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
            <TextField
              accessibilityLabel="Senha"
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Esqueceu a senha?"
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPassword}
          >
            <Text style={[styles.forgotPasswordLabel, { color: tokens.primary }]}>Esqueceu a senha?</Text>
          </Pressable>

          {error && (
            <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
              {error}
            </Text>
          )}

          <Button label="Entrar" onPress={handleLogin} loading={loading} style={styles.primaryButton} />

          <Button
            label="Criar conta"
            variant="secondary"
            onPress={() => navigation.navigate('Register')}
            style={styles.secondaryButton}
          />

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: tokens.track }]} />
            <Text style={[styles.dividerLabel, { color: tokens.textSecondary }]}>ou continue com</Text>
            <View style={[styles.dividerLine, { backgroundColor: tokens.track }]} />
          </View>

          <View style={styles.socialRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continuar com Google"
              onPress={() => handleSocialLogin('Google')}
              style={[styles.socialButton, { backgroundColor: tokens.card }]}
            >
              <GoogleIcon size={20} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dividerLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '600' },
  dividerLine: { flex: 1, height: 1 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm + spacing.xs, marginTop: spacing.lg + 2 },
  error: { fontFamily: 'PlusJakartaSans', marginTop: spacing.sm },
  forgotPassword: { alignSelf: 'flex-end', marginTop: spacing.sm + 2 },
  forgotPasswordLabel: { fontFamily: 'PlusJakartaSans', fontSize: 13.5, fontWeight: '700' },
  form: { gap: spacing.md, marginTop: spacing.lg },
  // A ScrollView tem padding: spacing.lg em toda a volta (pro conteúdo de
  // texto/form) — cancelamos isso só no hero pra o mascote encostar bem no
  // topo/direita da tela, igual ao protótipo (top: -4px; right: 10px).
  hero: { alignItems: 'flex-end', marginHorizontal: -spacing.lg, marginTop: -spacing.lg },
  keyboardAvoiding: { flex: 1 },
  primaryButton: { marginTop: spacing.lg + 2 },
  scroll: { flexGrow: 1, padding: spacing.lg },
  secondaryButton: { marginTop: spacing.sm + 4 },
  socialButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  socialRow: { flexDirection: 'row', gap: spacing.md - 2, justifyContent: 'center', marginTop: spacing.lg - 2 },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '600', marginTop: spacing.xs + 4 },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 30, fontWeight: '800', lineHeight: 36 },
});
