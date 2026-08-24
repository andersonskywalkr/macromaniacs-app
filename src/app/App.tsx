import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { startOfflineSync } from '@/offline/sync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // evitar retries excessivos (seção 96)
    },
  },
});

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Splash mantida até a fonte carregar, evitando flash de fonte do
    // sistema — seção 121.4. Substituir os require() abaixo pelos arquivos
    // reais de assets/fonts/ quando forem adicionados ao projeto.
    Font.loadAsync({
      // 'PlusJakartaSans': require('../../assets/fonts/PlusJakartaSans-Regular.ttf'),
    })
      .catch(() => {
        // Se a fonte falhar ao carregar, segue com a fonte padrão do
        // sistema em vez de travar o boot do app.
      })
      .finally(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    const unsubscribe = startOfflineSync(queryClient);
    return unsubscribe;
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
