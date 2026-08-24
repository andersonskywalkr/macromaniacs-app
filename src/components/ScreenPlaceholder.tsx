import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/**
 * Placeholder temporário para telas que ainda não foram implementadas.
 * Cada tela real deve substituir o conteúdo mantendo a navegação já
 * conectada (ver navigation/) — não apagar os arquivos, só preencher.
 */
export function ScreenPlaceholder({ title }: { title: string }) {
  const { tokens } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: tokens.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
          Tela ainda não implementada
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.lg },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 14, marginTop: spacing.xs },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 20, fontWeight: '700' },
});
