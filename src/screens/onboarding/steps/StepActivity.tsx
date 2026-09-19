import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { ACTIVITY_OPTIONS, type OnboardingData } from '../types';

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

const CRITERIA_TEXT_COLOR = 'rgba(255,255,255,0.85)';

// Cards de nível de atividade — ao selecionar, o card expande mostrando o
// "critério" (descrição mais detalhada), igual ao protótipo
// (makeAtividadeChoice: expandido = sel === item.rotulo).
export function StepActivity({ data, onChange }: Props) {
  const { tokens } = useTheme();

  return (
    <>
      {ACTIVITY_OPTIONS.map((option) => {
        const selected = data.activityLevel === option.value;
        const backgroundColor = selected ? tokens.primary : tokens.card;
        const labelColor = selected ? '#FFFFFF' : tokens.text;
        const descriptionColor = selected ? '#FFFFFF' : tokens.textSecondary;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange({ activityLevel: option.value })}
            style={[styles.card, { backgroundColor }]}
          >
            <Text style={[styles.label, { color: labelColor }]}>{option.label}</Text>
            <Text style={[styles.description, { color: descriptionColor }]}>{option.description}</Text>
            {selected && (
              <Text style={[styles.criteria, { color: CRITERIA_TEXT_COLOR }]} numberOfLines={2}>
                {option.criteria}
              </Text>
            )}
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card / 2,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  criteria: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  description: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  label: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    fontWeight: '700',
  },
});
