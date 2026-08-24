import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GroupStackParamList } from './types';
import { GroupsListScreen } from '@/screens/groups/GroupsListScreen';
import { GroupProfileScreen } from '@/screens/groups/GroupProfileScreen';
import { RankingFullScreen } from '@/screens/groups/RankingFullScreen';

const Stack = createNativeStackNavigator<GroupStackParamList>();

export function GroupStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GroupsList" component={GroupsListScreen} />
      <Stack.Screen name="GroupProfile" component={GroupProfileScreen} />
      <Stack.Screen name="RankingFull" component={RankingFullScreen} />
    </Stack.Navigator>
  );
}
