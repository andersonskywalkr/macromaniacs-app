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
import type { MealsStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { createManualFood } from '@/api/foods';
import {
  buildManualFoodInput,
  INITIAL_MANUAL_FOOD_FORM,
  validateManualFood,
  type ManualFoodForm,
} from '@/validation/food';

type Props = NativeStackScreenProps<MealsStackParamList, 'FoodManual'>;

const NUMBER_FIELDS: { key: keyof ManualFoodForm; label: string }[] = [
  { key: 'calories', label: 'Calorias (kcal por 100 g)' },
  { key: 'protein', label: 'Proteína (g por 100 g)' },
  { key: 'carbohydrates', label: 'Carboidrato (g por 100 g)' },
  { key: 'fat', label: 'Gordura (g por 100 g)' },
];

// Reconstruída a partir de "Novo Alimento.dc.html". Decisões de simplificação:
// só valores por 100 g (sem a opção de 100 ml), e sem peso de 1 unidade,
// favoritos nem leitura de código de barras — nada disso tem suporte na API.
export function FoodManualScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [form, setForm] = useState<ManualFoodForm>(INITIAL_MANUAL_FOOD_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function patch(change: Partial<ManualFoodForm>) {
    setForm((prev) => ({ ...prev, ...change }));
  }

  async function handleSave() {
    if (saving) return;

    const validationError = validateManualFood(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    setSaving(true);
    try {
      const food = await createManualFood(buildManualFoodInput(form));
      // replace: voltar da confirmação não deve reabrir o formulário.
      navigation.replace('FoodConfirm', { food });
    } catch {
      setError('Não foi possível salvar o alimento. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={[styles.title, { color: tokens.text }]}>Novo alimento</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: tokens.textSecondary }]}>Nome do alimento</Text>
          <TextField
            accessibilityLabel="Nome do alimento"
            placeholder="Ex.: Frango à passarinho assado"
            value={form.name}
            onChangeText={(name) => patch({ name })}
            maxLength={80}
          />

          <Text style={[styles.label, { color: tokens.textSecondary }]}>Marca (opcional)</Text>
          <TextField
            accessibilityLabel="Marca, opcional"
            placeholder="Sem marca"
            value={form.brand}
            onChangeText={(brand) => patch({ brand })}
            maxLength={60}
          />

          <Text style={[styles.section, { color: tokens.textSecondary }]}>VALORES POR 100 G</Text>
          {NUMBER_FIELDS.map(({ key, label }) => (
            <View key={key}>
              <Text style={[styles.label, { color: tokens.textSecondary }]}>{label}</Text>
              <TextField
                accessibilityLabel={label}
                placeholder="0"
                value={form[key]}
                onChangeText={(value) => patch({ [key]: value.replace(/[^0-9.,]/g, '') })}
                keyboardType="decimal-pad"
                maxLength={7}
              />
            </View>
          ))}

          {error && (
            <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
              {error}
            </Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Salvar e continuar"
            onPress={handleSave}
            loading={saving}
            accessibilityHint="Cadastra o alimento e abre a confirmação"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  error: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600', marginTop: spacing.md },
  flex: { flex: 1 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  label: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  section: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
  },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 22, fontWeight: '800' },
});
