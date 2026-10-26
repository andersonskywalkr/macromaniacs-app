import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from './types';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { MealsStackNavigator } from './MealsStack';
import { GroupStackNavigator } from './GroupStack';
import { ProfileStackNavigator } from './ProfileStack';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { HomeIcon, MealsIcon, GroupIcon, ProfileIcon } from '@/components/icons';
import { MAINTENANCE_TABS } from '@/api/config';
import { MaintenanceScreen } from '@/screens/MaintenanceScreen';

const Tab = createBottomTabNavigator<AppTabsParamList>();

// Pílula de destaque atrás do ícone da aba ativa — mesmo visual nos 4
// prints enviados (claro/escuro, selecionado/não selecionado).
function TabIcon({
  focused,
  pillColor,
  children,
}: {
  focused: boolean;
  pillColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: pillColor }]}>{children}</View>
  );
}

// 4 abas conforme a NavBar do protótipo (navbar.dc.html): Home, Refeições,
// Grupos, Perfil.
export function AppTabsNavigator() {
  const { tokens } = useTheme();
  // Fundo suave da pílula ativa — derivado da cor primária com opacidade,
  // sem precisar de um token novo só pra esse único uso.
  const pillColor = `${tokens.primary}1F`;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.textSecondary,
        tabBarStyle: { backgroundColor: tokens.background },
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={MAINTENANCE_TABS.has('home') ? MaintenanceScreen : HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} pillColor={pillColor}>
              <HomeIcon color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="MealsTab"
        component={MealsStackNavigator}
        options={{
          tabBarLabel: 'Refeições',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} pillColor={pillColor}>
              <MealsIcon color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="GroupTab"
        component={MAINTENANCE_TABS.has('group') ? MaintenanceScreen : GroupStackNavigator}
        options={{
          tabBarLabel: 'Grupo',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} pillColor={pillColor}>
              <GroupIcon color={color} />
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} pillColor={pillColor}>
              <ProfileIcon color={color} />
            </TabIcon>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  label: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 11,
    fontWeight: '600',
  },
});
