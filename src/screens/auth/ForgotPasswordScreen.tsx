import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { requestPasswordReset } from '@/api/auth';
import { USE_AUTH_MOCK } from '@/api/config';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TextField } from '@/components/TextField';
import { validateForgotPassword } from '@/validation/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const FORGOT_PASSWORD_SIMULATION_MESSAGE =
  'Simulação: se o e-mail existir, enviaremos as instruções.';
export const FORGOT_PASSWORD_UNAVAILABLE_MESSAGE =
  'A recuperação de senha ainda não está disponível. Fale com a equipe do MacroManiacs.';

// Esqueci a senha (item 4). O backend NÃO tem recuperação de senha, então a
// tela não finge que um e-mail foi enviado: no modo mock (auth) simula o
// fluxo com um aviso visível de demonstração; no modo real não chama nenhuma
// rota e avisa que o recurso ainda não está disponível.
export function ForgotPasswordScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function goToLogin() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
  }

  async function handleSubmit() {
    if (loading) return;

    const validationError = validateForgotPassword(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    setLoading(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError('Não foi possível concluir agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function renderBody() {
    if (!USE_AUTH_MOCK) {
      return (
        <Card style={styles.card}>
          <Text accessibilityRole="alert" style={[styles.message, { color: tokens.text }]}>
            {FORGOT_PASSWORD_UNAVAILABLE_MESSAGE}
          </Text>
          <Button label="Voltar ao Login" onPress={goToLogin} style={styles.button} />
        </Card>
      );
    }

    return (
      <>
        <Card style={[styles.card, styles.demoCard, { borderColor: tokens.primary }]}>
          <Text style={[styles.demoTitle, { color: tokens.primary }]}>Modo demonstração</Text>
          <Text style={[styles.muted, { color: tokens.textSecondary }]}>
            Nenhum e-mail é enviado de verdade. Esta tela só mostra como o fluxo vai funcionar.
          </Text>
        </Card>

        {sent ? (
          <Card style={styles.card}>
            <Text accessibilityRole="alert" style={[styles.message, { color: tokens.text }]}>
              {FORGOT_PASSWORD_SIMULATION_MESSAGE}
            </Text>
            <Button label="Voltar ao Login" onPress={goToLogin} style={styles.button} />
          </Card>
        ) : (
          <View style={styles.form}>
            <TextField
              accessibilityLabel="E-mail"
              placeholder="Seu e-mail"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
            />
            {error && (
              <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
                {error}
              </Text>
            )}
            <Button label="Enviar instruções" onPress={handleSubmit} loading={loading} />
          </View>
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton onPress={goToLogin} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: tokens.text }]}>Esqueci minha senha</Text>
          <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
            Informe o e-mail da sua conta para receber as instruções.
          </Text>
          {renderBody()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: spacing.lg },
  card: { padding: spacing.lg },
  container: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.md, padding: spacing.lg, paddingTop: spacing.md },
  demoCard: { borderWidth: 1.5 },
  demoTitle: { fontFamily: fontFamily(800), fontSize: 14 },
  error: { fontFamily: fontFamily(600), fontSize: 13 },
  flex: { flex: 1 },
  form: { gap: spacing.md, marginTop: spacing.sm },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  message: { fontFamily: fontFamily(700), fontSize: 15, lineHeight: 22 },
  muted: { fontFamily: fontFamily(600), fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  subtitle: { fontFamily: fontFamily(600), fontSize: 15 },
  title: { fontFamily: fontFamily(800), fontSize: 26, lineHeight: 32 },
});
