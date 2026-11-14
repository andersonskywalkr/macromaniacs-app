import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { ProfileHomeScreen } from '@/screens/profile/ProfileHomeScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { HistoryScreen } from '@/screens/progress/HistoryScreen';
import { AvatarPickerScreen } from '@/screens/profile/AvatarPickerScreen';
import { GamificationRewardsScreen } from '@/screens/profile/GamificationRewardsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AvatarPicker" component={AvatarPickerScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="GamificationRewards" component={GamificationRewardsScreen} />
    </Stack.Navigator>
  );
}
