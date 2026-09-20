import React from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Button } from '@/components/Button';
import { MascotIllustration } from '@/components/MascotIllustration';
import { LANDING_PAGE_URL } from '@/api/config';

// Cor de destaque decorativa (barra no topo) — fixa, igual ao gradiente do
// FireIcon: não é uma cor semântica do design system, é só um acento de
// marca, então não precisa vir de um token de tema.
const ACCENT_COLOR = '#F5A623';

async function handleOpenLandingPage() {
  if (!LANDING_PAGE_URL) {
    Alert.alert('Link não configurado', 'A URL da landing page ainda não foi definida.');
    return;
  }
  try {
    await Linking.openURL(LANDING_PAGE_URL);
  } catch {
    Alert.alert('Não foi possível abrir o link', 'Tente novamente mais tarde.');
  }
}

// Tela temporária mostrada no lugar do AppTabs depois do login/onboarding
// (ver SHOW_MAINTENANCE_SCREEN em api/config.ts) — usada pra apresentação
// enquanto Home/Refeições/Grupo/Perfil ainda são telas com dado mock.
export function MaintenanceScreen() {
  const { tokens } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.content}>
        <View style={styles.accentBar} />

        <MascotIllustration variant="maintenance" width={180} style={styles.mascot} />

        <Text style={[styles.title, { color: tokens.text }]}>O app está em construção</Text>
        <Text style={[styles.subtitle, { color: tokens.textSecondary }]}>
          Enquanto isso, conheça mais sobre o MacroManiacs na nossa página oficial.
        </Text>

        <Button label="Ver a landing page" onPress={handleOpenLandingPage} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accentBar: { backgroundColor: ACCENT_COLOR, borderRadius: 999, height: 5, marginBottom: spacing.xl, width: 64 },
  button: { marginTop: spacing.xl, width: '100%' },
  container: { flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  mascot: { marginBottom: spacing.lg },
  subtitle: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 14.5,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
});
