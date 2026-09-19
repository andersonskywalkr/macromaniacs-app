import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Button } from '@/components/Button';
import { ChevronRightIcon } from '@/components/icons';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile } from '@/queries/useUpdateProfile';
import { ApiError } from '@/api/ApiError';
import { INITIAL_ONBOARDING_DATA, type OnboardingData } from './types';
import { StepBasicInfo } from './steps/StepBasicInfo';
import { StepSex } from './steps/StepSex';
import { StepGoal } from './steps/StepGoal';
import { StepActivity } from './steps/StepActivity';
import { StepGoalDetails } from './steps/StepGoalDetails';
import { StepSummary } from './steps/StepSummary';

const TOTAL_STEPS = 6;

const STEP_COPY = [
  { title: 'Sobre você', subtitle: 'Dados básicos para calcular suas necessidades.' },
  { title: 'Sexo biológico', subtitle: 'Usado no cálculo de taxa metabólica basal.' },
  { title: 'Qual seu objetivo?', subtitle: 'Escolha a meta principal de agora.' },
  { title: 'Nível de atividade', subtitle: 'Quanto você se movimenta no dia a dia?' },
  { title: 'Últimos detalhes', subtitle: 'Opcional — pode pular se preferir.' },
  { title: 'Revise e confirme', subtitle: 'Confira tudo antes de concluir.' },
];

export function OnboardingScreen() {
  const { tokens } = useTheme();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const updateProfile = useUpdateProfile();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [error, setError] = useState<string | null>(null);

  function patchData(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!data.displayName.trim() || !data.birthDate.trim() || !data.heightCm.trim() || !data.weightKg.trim()) {
        return 'Preencha todos os campos para continuar.';
      }
    }
    if (step === 1 && !data.sex) return 'Selecione uma opção para continuar.';
    if (step === 2 && !data.goal) return 'Selecione uma opção para continuar.';
    if (step === 3 && !data.activityLevel) return 'Selecione uma opção para continuar.';
    return null;
  }

  async function handleContinue() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      return;
    }

    try {
      await updateProfile.mutateAsync({
        displayName: data.displayName.trim(),
        birthDate: data.birthDate.trim(),
        heightCm: Number(data.heightCm) || null,
        currentWeightKg: Number(data.weightKg.replace(',', '.')) || null,
        sex: data.sex,
        goal: data.goal,
        activityLevel: data.activityLevel,
        targetWeightKg: Number(data.targetWeightKg.replace(',', '.')) || null,
        targetTimeframe: data.targetTimeframe.trim() || null,
        dietaryRestrictions: data.dietaryRestrictions.trim() || null,
      });
      await completeOnboarding();
      // Após completeOnboarding(), o RootNavigator troca pra AppTabs
      // automaticamente (mesmo padrão do login) — não precisa navigate().
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível salvar seus dados. Tente novamente.';
      setError(message);
    }
  }

  function handleBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  const copy = STEP_COPY[step];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoiding}>
        <View style={styles.progressRow}>
          {step > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={8}
              onPress={handleBack}
              style={styles.backButton}
            >
              <View style={styles.backIcon}>
                <ChevronRightIcon size={10} color={tokens.text} />
              </View>
            </Pressable>
          )}
          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i <= step ? tokens.primary : tokens.track },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.stepLabel, { color: tokens.primary }]}>
            ETAPA {step + 1} DE {TOTAL_STEPS}
          </Text>
          <Text style={[styles.title, { color: tokens.text }]}>{copy.title}</Text>
          <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>{copy.subtitle}</Text>

          <View style={styles.stepBody}>
            {step === 0 && <StepBasicInfo data={data} onChange={patchData} />}
            {step === 1 && <StepSex data={data} onChange={patchData} />}
            {step === 2 && <StepGoal data={data} onChange={patchData} />}
            {step === 3 && <StepActivity data={data} onChange={patchData} />}
            {step === 4 && <StepGoalDetails data={data} onChange={patchData} />}
            {step === 5 && <StepSummary data={data} />}
          </View>

          {error && (
            <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
              {error}
            </Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={step === TOTAL_STEPS - 1 ? 'Concluir' : 'Continuar'}
            onPress={handleContinue}
            loading={updateProfile.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  backIcon: { transform: [{ rotate: '180deg' }] },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.lg },
  dot: { borderRadius: 999, flex: 1, height: 6 },
  dots: { flex: 1, flexDirection: 'row', gap: 6 },
  error: { fontFamily: 'PlusJakartaSans', marginTop: spacing.md },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  keyboardAvoiding: { flex: 1 },
  progressRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  stepBody: { marginTop: spacing.xl - spacing.xs },
  stepLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '600', marginTop: spacing.sm },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 26, fontWeight: '800', lineHeight: 32 },
});
