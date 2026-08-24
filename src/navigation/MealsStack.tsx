import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MealsStackParamList } from './types';
import { MealsHomeScreen } from '@/screens/meals/MealsHomeScreen';
import { FoodSearchScreen } from '@/screens/foods/FoodSearchScreen';
import { FoodConfirmScreen } from '@/screens/foods/FoodConfirmScreen';
import { MealBuilderScreen } from '@/screens/meals/MealBuilderScreen';
import { MealReviewScreen } from '@/screens/meals/MealReviewScreen';

const Stack = createNativeStackNavigator<MealsStackParamList>();

export function MealsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MealsHome" component={MealsHomeScreen} />
      <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
      <Stack.Screen name="FoodConfirm" component={FoodConfirmScreen} />
      <Stack.Screen name="MealBuilder" component={MealBuilderScreen} />
      <Stack.Screen name="MealReview" component={MealReviewScreen} />
    </Stack.Navigator>
  );
}
