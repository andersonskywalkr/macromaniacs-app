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
import { register } from '@/api/auth';
import { getAuthErrorMessage } from '@/api/authErrors';
import { validateRegister } from '@/validation/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Ver LoginScreen — mesmo motivo pros botões sociais ficarem inertes aqui.
function handleSocialLogin(provider: string) {
  Alert.alert('Em breve', `Cadastro com ${provider} ainda não está disponível.`);
}

export function RegisterScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkboxColor = {
    backgroundColor: form.termsAccepted ? tokens.primary : tokens.background,
    borderColor: tokens.primary,
  };

  function setField(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    if (loading) return;

    setError(null);

    const validationError = validateRegister(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email.trim().toLowerCase(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        termsAccepted: true,
      });
      Alert.alert(
        'Conta criada',
        'Cadastro concluído. Agora entre com seu usuário ou e-mail.',
        [{ text: 'Entrar', onPress: () => navigation.replace('Login') }],
      );
    } catch (err) {
      setError(getAuthErrorMessage(err, 'register'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoiding}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <MascotIllustration width={130} />
          </View>

          <Text style={[styles.title, { color: tokens.text }]}>Crie sua conta</Text>
          <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
            Comece sua jornada com o MacroManiacs.
          </Text>

          <View style={styles.form}>
            <TextField
              accessibilityLabel="Nome de usuário"
              placeholder="Usuário"
              value={form.username}
              onChangeText={(v) => setField('username', v)}
              autoCapitalize="none"
            />
            <TextField
              accessibilityLabel="Email"
              placeholder="Email"
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextField
              accessibilityLabel="Senha"
              placeholder="Senha"
              value={form.password}
              onChangeText={(v) => setField('password', v)}
              secureTextEntry
            />
            <TextField
              accessibilityLabel="Confirmar senha"
              placeholder="Confirmar senha"
              value={form.confirmPassword}
              onChangeText={(v) => setField('confirmPassword', v)}
              secureTextEntry
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: form.termsAccepted }}
              accessibilityLabel="Aceitar os termos de uso"
              onPress={() => setField('termsAccepted', !form.termsAccepted)}
              style={styles.termsRow}
            >
              <View
                style={[
                  styles.checkbox,
                  checkboxColor,
                ]}
              >
                {form.termsAccepted && (
                  <Text style={[styles.checkmark, { color: tokens.background }]}>✓</Text>
                )}
              </View>
              <Text style={[styles.termsLabel, { color: tokens.text }]}>Aceito os termos de uso</Text>
            </Pressable>
          </View>

          {error && (
            <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
              {error}
            </Text>
          )}

          <Button label="Criar conta" onPress={handleRegister} loading={loading} style={styles.primaryButton} />

          <Button
            label="Já tenho conta"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
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
  checkbox: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkmark: { fontSize: 14, fontWeight: '800' },
  container: { flex: 1 },
  dividerLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '600' },
  dividerLine: { flex: 1, height: 1 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm + spacing.xs, marginTop: spacing.lg + 2 },
  error: { fontFamily: 'PlusJakartaSans', marginTop: spacing.sm },
  form: { gap: spacing.md, marginTop: spacing.lg },
  // Ver LoginScreen — mesmo motivo pra cancelar o padding da ScrollView
  // só no hero, pro mascote encostar no topo/direita da tela.
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
  termsLabel: { flex: 1, fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '600' },
  termsRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 44 },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 30, fontWeight: '800', lineHeight: 36 },
});
