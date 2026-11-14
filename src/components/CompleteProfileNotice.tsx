import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';
import { Button } from './Button';

interface CompleteProfileNoticeProps {
  onPress: () => void;
}

// Aviso curto para conta antiga sem sexo no perfil: sem ele o backend não
// calcula a meta de calorias. Leva ao Editar perfil.
export function CompleteProfileNotice({ onPress }: CompleteProfileNoticeProps) {
  const { tokens } = useTheme();

  return (
    <View style={styles.container}>
      <Text accessibilityRole="alert" style={[styles.text, { color: tokens.text }]}>
        Falta informar o seu sexo para calcular a sua meta de calorias.
      </Text>
      <Button
        label="Completar perfil"
        onPress={onPress}
        accessibilityHint="Abre o Editar perfil para escolher feminino ou masculino"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  text: { fontFamily: fontFamily(700), fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
