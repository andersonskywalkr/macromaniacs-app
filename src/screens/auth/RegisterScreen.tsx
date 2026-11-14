import React, { useState } from 'react';
import {
  Text,
  View,
  Pressable,
  StyleSheet,
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
import { register, login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { getAuthErrorMessage } from '@/api/authErrors';
import { validateRegister } from '@/validation/auth';
import { TERMS_VERSION } from '@/api/config';
import { TERMS_OPEN_ERROR_MESSAGE, openTermsDocument } from '@/utils/terms';

import { fontFamily } from '@/theme/fonts';
import { KeyboardAwareScreen, KeyboardAwareScrollView } from '@/components/KeyboardAwareScreen';
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
  const [termsLinkError, setTermsLinkError] = useState(false);
  const checkboxColor = {
    backgroundColor: form.termsAccepted ? tokens.primary : tokens.background,
    borderColor: tokens.primary,
  };

  function setField(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Abre o documento SEM mexer na caixa de aceite. Se não abrir, só avisa.
  async function handleOpenTerms() {
    setTermsLinkError(false);
    const opened = await openTermsDocument();
    if (!opened) setTermsLinkError(true);
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
      const email = form.email.trim().toLowerCase();
      await register({
        email,
        username: form.username.trim().toLowerCase(),
        password: form.password,
        termsAccepted: true,
      });

      // Loga com a credencial recém-criada em vez de devolver pro Login —
      // a pessoa já preencheu tudo, não faz sentido pedir de novo.
      // RootNavigator troca de tela sozinho (onboarding, já que a conta é
      // nova) assim que signIn() atualiza o status — não precisa
      // navigate() manual aqui.
      const { accessToken } = await login({ identifier: email, password: form.password });
      await useAuthStore.getState().signIn(accessToken);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'register'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]} edges={['bottom']}>
      <KeyboardAwareScreen>
        <KeyboardAwareScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
            <View style={styles.terms}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: form.termsAccepted }}
                accessibilityLabel="Aceitar os termos de uso e a política de privacidade"
                accessibilityHint="Toque para marcar. O link abaixo abre o documento."
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
                <Text style={[styles.termsLabel, { color: tokens.text }]}>Li e aceito os</Text>
              </Pressable>

              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Termos de Uso e a Política de Privacidade"
                accessibilityHint="Abre o documento no navegador"
                onPress={handleOpenTerms}
                style={styles.termsLink}
              >
                <Text style={[styles.termsLinkText, { color: tokens.primary }]}>
                  Termos de Uso e a Política de Privacidade
                </Text>
              </Pressable>

              <Text style={[styles.termsVersion, { color: tokens.textSecondary }]}>
                Versão {TERMS_VERSION}
              </Text>

              {termsLinkError && (
                <Text accessibilityRole="alert" style={[styles.termsError, { color: tokens.textSecondary }]}>
                  {TERMS_OPEN_ERROR_MESSAGE}
                </Text>
              )}
            </View>
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
        </KeyboardAwareScrollView>
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

// Alinha o link e a versão ao texto "Li e aceito os" (caixa de 22 + espaço).
const TERMS_INDENT = 22 + spacing.sm;

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkmark: { fontFamily: fontFamily(800), fontSize: 14 },
  container: { flex: 1 },
  dividerLabel: { fontFamily: fontFamily(600), fontSize: 12.5 },
  dividerLine: { flex: 1, height: 1 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm + spacing.xs, marginTop: spacing.lg + 2 },
  error: { fontFamily: fontFamily(400), marginTop: spacing.sm },
  form: { gap: spacing.md, marginTop: spacing.lg },
  // Ver LoginScreen — mesmo motivo pra cancelar o padding da ScrollView
  // só no hero, pro mascote encostar no topo/direita da tela.
  hero: { alignItems: 'flex-end', marginHorizontal: -spacing.lg, marginTop: -spacing.lg },
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
  subtitle: { fontFamily: fontFamily(600), fontSize: 15, marginTop: spacing.xs + 4 },
  terms: { gap: spacing.xs },
  termsError: { fontFamily: fontFamily(600), fontSize: 12.5, marginLeft: TERMS_INDENT },
  termsLabel: { flex: 1, fontFamily: fontFamily(600), fontSize: 14 },
  termsLink: { justifyContent: 'center', marginLeft: TERMS_INDENT, minHeight: 44 },
  termsLinkText: { fontFamily: fontFamily(700), fontSize: 14, textDecorationLine: 'underline' },
  termsRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 44 },
  termsVersion: { fontFamily: fontFamily(600), fontSize: 11.5, marginLeft: TERMS_INDENT },
  title: { fontFamily: fontFamily(800), fontSize: 30, lineHeight: 36 },
});
