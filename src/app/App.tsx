import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { startOfflineSync } from '@/offline/sync';
import { queryClient } from '@/queries/queryClient';

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
      <View style={styles.loading}>
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

const styles = StyleSheet.create({
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
