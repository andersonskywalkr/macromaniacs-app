import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { AuthStackNavigator } from './AuthStack';
import { AppTabsNavigator } from './AppTabs';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Guarda de navegação — seção 118.3.
 *
 *   App boot
 *     -> lê token em secure storage
 *     -> token ausente/expirado -> AuthStack
 *     -> token válido -> AppTabs
 *
 * O estado 'loading' evita renderizar telas autenticadas antes da
 * validação terminar (equivalente ao RNF-01 do backend, aplicado no
 * cliente).
 */
export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const { tokens } = useTheme();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.background }}>
        <ActivityIndicator color={tokens.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {status === 'authenticated' ? <AppTabsNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}
