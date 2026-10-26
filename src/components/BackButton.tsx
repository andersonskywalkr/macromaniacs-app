import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { touchTarget } from '@/theme/tokens';
import { ChevronRightIcon } from './icons';

interface BackButtonProps {
  onPress: () => void;
}

// Botão redondo de voltar do protótipo (44x44). O ícone é a seta "próximo"
// girada, como já feito no Onboarding.
export function BackButton({ onPress }: BackButtonProps) {
  const { tokens } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
      onPress={onPress}
      style={[styles.base, { backgroundColor: tokens.card }]}
    >
      <View style={styles.icon}>
        <ChevronRightIcon size={10} color={tokens.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 999,
    height: touchTarget.minSize,
    justifyContent: 'center',
    width: touchTarget.minSize,
  },
  icon: { transform: [{ rotate: '180deg' }] },
});
