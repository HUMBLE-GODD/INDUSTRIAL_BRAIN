import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { colors } from '../theme';
import { API_IS_CONFIGURED } from '../lib/api/client';
import { useSession } from '../auth/SessionContext';
import AuthScreen from '../screens/auth/AuthScreen';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export type RootStackParamList = {
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isReady, token } = useSession();

  if (!isReady) return <LoadingSpinner message="Restoring your session…" />;
  if (API_IS_CONFIGURED && !token) return <AuthScreen />;

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
