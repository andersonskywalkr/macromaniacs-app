import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export function Card({ style, children, ...rest }: ViewProps) {
  const { tokens } = useTheme();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: tokens.card, shadowColor: tokens.shadow },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    elevation: 2,
    padding: spacing.md,
    // Sombra suave conforme seção 121.3 — sem borda de acento
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
});
