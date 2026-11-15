import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from './ThemeProvider';
import { getSystemBarsStyle } from './systemBars';

// Barra de status com o estilo EXPLÍCITO do tema do app (light/dark), nunca
// "auto". Um lugar só, no layout raiz: reage à troca de tema na hora.
export function AppSystemBars() {
  const { mode } = useTheme();
  const { statusBarStyle } = getSystemBarsStyle(mode);
  return <StatusBar style={statusBarStyle} />;
}

// Raiz do app: a cor do tema ocupa a tela toda (inclusive por trás das barras do
// sistema, que no Android edge-to-edge são transparentes). Evita faixa clara
// no tema escuro (ou escura no claro) durante transições.
export function ThemedRoot({ children }: { children: React.ReactNode }) {
  const { mode } = useTheme();
  const { backgroundColor } = getSystemBarsStyle(mode);
  return (
    <View style={[styles.root, { backgroundColor }]}>
      <AppSystemBars />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
