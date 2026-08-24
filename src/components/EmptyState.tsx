import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

interface EmptyStateProps {
  title: string;
  description?: string;
  // Caminho do asset do mascote — apontar para assets/mascote/ depois de
  // copiar os arquivos do zip do protótipo (mascote.png, mascote-v2.svg).
  mascoteSource?: number;
}

export function EmptyState({ title, description, mascoteSource }: EmptyStateProps) {
  const { tokens } = useTheme();

  return (
    <View style={styles.container} accessible accessibilityRole="text">
      {mascoteSource && (
        <Image source={mascoteSource} style={styles.mascote} accessibilityLabel="" />
      )}
      <Text style={[styles.title, { color: tokens.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: tokens.textSecondary }]}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  mascote: {
    width: 120,
    height: 120,
    marginBottom: spacing.md,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: 'PlusJakartaSans',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'PlusJakartaSans',
    fontWeight: '500',
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
