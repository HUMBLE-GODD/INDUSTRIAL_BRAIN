import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { colors } from '../theme';

// In the future, this will include auth check:
// - If user is NOT logged in → show LoginScreen
// - If user IS logged in → show TabNavigator

export type RootStackParamList = {
  MainTabs: undefined;
  // Future: Login, Register screens will go here
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
    </Stack.Navigator>
  );
}
