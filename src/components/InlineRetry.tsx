import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touchTarget } from '@/theme/tokens';

interface InlineRetryProps {
  message: string;
  onRetry: () => void;
}

// Aviso discreto de falha parcial: mensagem curta + "Tentar de novo", sem
// derrubar o resto da tela.
export function InlineRetry({ message, onRetry }: InlineRetryProps) {
  const { tokens } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.message, { color: tokens.textSecondary }]}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tentar de novo"
        hitSlop={8}
        onPress={onRetry}
        style={styles.button}
      >
        <Text style={[styles.buttonLabel, { color: tokens.primary }]}>Tentar de novo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { justifyContent: 'center', minHeight: touchTarget.minSize, paddingHorizontal: spacing.sm },
  buttonLabel: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '800' },
  message: { flex: 1, fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '600' },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
});
