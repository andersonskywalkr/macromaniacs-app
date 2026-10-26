import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MealsStackParamList } from './types';
import { MealsHomeScreen } from '@/screens/meals/MealsHomeScreen';
import { FoodSearchScreen } from '@/screens/foods/FoodSearchScreen';
import { FoodConfirmScreen } from '@/screens/foods/FoodConfirmScreen';
import { MealBuilderScreen } from '@/screens/meals/MealBuilderScreen';
import { MealReviewScreen } from '@/screens/meals/MealReviewScreen';
import { FoodManualScreen } from '@/screens/foods/FoodManualScreen';
import { MaintenanceScreen } from '@/screens/MaintenanceScreen';
import { MAINTENANCE_TABS } from '@/api/config';

const Stack = createNativeStackNavigator<MealsStackParamList>();

// A pilha de Refeições fica sempre montada — o botão "Adicionar refeição" da
// Home abre a Busca de alimento direto nela. Enquanto a lista de refeições
// não fica pronta, a tela inicial da aba (MealsHome) segue em manutenção.
const MealsHomeComponent = MAINTENANCE_TABS.has('meals') ? MaintenanceScreen : MealsHomeScreen;

export function MealsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MealsHome" component={MealsHomeComponent} />
      <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
      <Stack.Screen name="FoodConfirm" component={FoodConfirmScreen} />
      <Stack.Screen name="FoodManual" component={FoodManualScreen} />
      <Stack.Screen name="MealBuilder" component={MealBuilderScreen} />
      <Stack.Screen name="MealReview" component={MealReviewScreen} />
    </Stack.Navigator>
  );
}
