import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touchTarget } from '@/theme/tokens';

interface ChoicePillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  // 'inverted': selecionada = fundo com a cor do texto e texto com a cor do
  // fundo (filtros do protótipo) — mantém bom contraste nos dois temas.
  variant?: 'primary' | 'inverted';
}

// Pílula de escolha única — usada nos passos "Sexo" e "Objetivo" do
// onboarding (mesmo componente, o protótipo trata os dois com a mesma lógica
// de seleção única por lista de rótulos).
export function ChoicePill({ label, selected, onPress, variant = 'primary' }: ChoicePillProps) {
  const { tokens } = useTheme();
  const selectedBackground = variant === 'inverted' ? tokens.text : tokens.primary;
  const selectedText = variant === 'inverted' ? tokens.background : '#FFFFFF';
  const backgroundColor = selected ? selectedBackground : tokens.card;
  const textColor = selected ? selectedText : tokens.text;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={[styles.base, { backgroundColor }]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: touchTarget.minSize,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    fontWeight: '700',
  },
});
