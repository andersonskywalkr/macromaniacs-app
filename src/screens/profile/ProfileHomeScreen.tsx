import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';

// TODO: reconstruir a partir de "Perfil Minimalista.dc.html". Por enquanto
// só o essencial pra encerrar sessão (sem isso não havia como sair da conta
// autenticada pra testar Login/Cadastro de novo).
export function ProfileHomeScreen() {
  const { tokens } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: tokens.text }]}>Perfil</Text>
        <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
          Tela ainda não implementada
        </Text>
        <Button
          label="Sair"
          variant="secondary"
          onPress={() => useAuthStore.getState().signOut()}
          style={styles.signOutButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.lg },
  signOutButton: { marginTop: spacing.lg, minWidth: 160 },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 14, marginTop: spacing.xs },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 20, fontWeight: '700' },
});
