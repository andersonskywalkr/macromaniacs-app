import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from './types';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { MealsStackNavigator } from './MealsStack';
import { GroupStackNavigator } from './GroupStack';
import { ProfileStackNavigator } from './ProfileStack';
import { useTheme } from '@/theme/ThemeProvider';

const Tab = createBottomTabNavigator<AppTabsParamList>();

// 4 abas conforme a NavBar do protótipo (navbar.dc.html): Home, Refeições,
// Grupos, Perfil. Ícones reais devem vir de assets/icons/ do zip do
// protótipo — usando tabBarLabel por enquanto como placeholder visual.
export function AppTabsNavigator() {
  const { tokens } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.textSecondary,
        tabBarStyle: { backgroundColor: tokens.background },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen
        name="MealsTab"
        component={MealsStackNavigator}
        options={{ tabBarLabel: 'Refeições' }}
      />
      <Tab.Screen
        name="GroupTab"
        component={GroupStackNavigator}
        options={{ tabBarLabel: 'Grupo' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
