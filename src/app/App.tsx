import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { FONT_FILES, FONT_LOAD_TIMEOUT_MS } from '@/theme/fonts';
import { RootNavigator } from '@/navigation/RootNavigator';
import { startOfflineSync } from '@/offline/sync';
import { queryClient } from '@/queries/queryClient';

// Segura a tela de abertura (splash) até a fonte carregar, evitando o flash
// de fonte do sistema — seção 121.4.
SplashScreen.preventAutoHideAsync().catch(() => {
  // sem splash nativa (ex.: ambiente de teste): segue sem ela
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  const [timedOut, setTimedOut] = useState(false);

  // Se a fonte demorar mais que o limite (ou falhar), o app abre com a fonte
  // do sistema — nunca fica preso na abertura nem em tela em branco.
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  const ready = fontsLoaded || Boolean(fontError) || timedOut;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  useEffect(() => {
    const unsubscribe = startOfflineSync(queryClient);
    return unsubscribe;
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {/* Teclado: lê a altura real direto do sistema (Android e iOS). */}
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </ThemeProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
