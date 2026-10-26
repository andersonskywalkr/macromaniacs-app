import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { getProfileErrorMessage } from '@/api/authErrors';
import type { UserProfile } from '@/api/types/domain';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile } from '@/queries/useUpdateProfile';
import { buildOnboardingRequest, validateOnboarding } from '@/validation/onboarding';
import { hasFormChanges, profileToFormData } from '@/validation/profileForm';
import type { OnboardingData } from '@/screens/onboarding/types';
import { StepBasicInfo } from '@/screens/onboarding/steps/StepBasicInfo';
import { StepSex } from '@/screens/onboarding/steps/StepSex';
import { StepGoal } from '@/screens/onboarding/steps/StepGoal';
import { StepActivity } from '@/screens/onboarding/steps/StepActivity';
import { StepGoalDetails } from '@/screens/onboarding/steps/StepGoalDetails';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

// UC-03 — Editar perfil. Usa os mesmos campos, componentes e validação do
// Onboarding (screens/onboarding/steps e validation/onboarding), já
// preenchidos com o perfil atual. Não inclui troca de senha nem de e-mail
// (o backend não tem isso confirmado).
export function EditProfileScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.completeOnboarding);
  const updateProfile = useUpdateProfile();

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando perfil" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <EditProfileForm
      navigation={navigation}
      initial={profileToFormData(user)}
      onSaved={setUser}
      mutateAsync={updateProfile.mutateAsync}
      isSaving={updateProfile.isPending}
    />
  );
}

interface FormProps {
  navigation: Props['navigation'];
  initial: OnboardingData;
  onSaved: (profile: UserProfile) => void;
  mutateAsync: ReturnType<typeof useUpdateProfile>['mutateAsync'];
  isSaving: boolean;
}

function EditProfileForm({ navigation, initial, onSaved, mutateAsync, isSaving }: FormProps) {
  const { tokens } = useTheme();
  // Foto do perfil na hora de abrir a tela: "alterado" é comparado a ela.
  const [snapshot] = useState(initial);
  const [form, setForm] = useState<OnboardingData>(initial);
  const [saveError, setSaveError] = useState<string | null>(null);
  const allowLeave = useRef(false);

  const dirty = hasFormChanges(snapshot, form);
  const validationError = dirty ? validateOnboarding(form) : null;
  const canSave = dirty && validationError === null && !isSaving;

  function patch(change: Partial<OnboardingData>) {
    setSaveError(null);
    setForm((prev) => ({ ...prev, ...change }));
  }

  // Sair com alterações não salvas pede confirmação — vale para o botão
  // voltar da tela, o gesto e o botão voltar do Android.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (!dirty || allowLeave.current) return;
      event.preventDefault();
      Alert.alert('Descartar alterações?', 'As mudanças não salvas serão perdidas.', [
        { text: 'Continuar editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });
  }, [navigation, dirty]);

  async function handleSave() {
    if (!canSave) return;
    setSaveError(null);

    try {
      const profile = await mutateAsync(buildOnboardingRequest(form));
      onSaved(profile);
      allowLeave.current = true;
      navigation.popTo('ProfileHome', { saved: true });
    } catch (err) {
      // Mantém o que foi digitado.
      setSaveError(getProfileErrorMessage(err));
    }
  }

  const sectionStyle = [styles.section, { color: tokens.textSecondary }];
  const message = validationError ?? saveError;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={[styles.title, { color: tokens.text }]}>Editar perfil</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={sectionStyle}>SOBRE VOCÊ</Text>
          <StepBasicInfo data={form} onChange={patch} />

          <Text style={sectionStyle}>SEXO</Text>
          <StepSex data={form} onChange={patch} />

          <Text style={sectionStyle}>OBJETIVO</Text>
          <StepGoal data={form} onChange={patch} />

          <Text style={sectionStyle}>NÍVEL DE ATIVIDADE</Text>
          <StepActivity data={form} onChange={patch} />

          <Text style={sectionStyle}>METAS (OPCIONAL)</Text>
          <StepGoalDetails data={form} onChange={patch} />
        </ScrollView>

        <View style={styles.footer}>
          {message && (
            <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
              {message}
            </Text>
          )}
          <Button
            label="Salvar alterações"
            onPress={handleSave}
            disabled={!canSave}
            loading={isSaving}
            accessibilityHint="Atualiza seus dados e recalcula sua meta calórica"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingTop: spacing.md },
  error: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
  flex: { flex: 1 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  section: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: spacing.md,
  },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 22, fontWeight: '800' },
});
