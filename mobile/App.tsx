import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SessionProvider } from './src/auth/SessionContext';
import { colors } from './src/theme';

// Custom dark theme for React Navigation
const IndustrialDarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export default function App() {
  return (
    <SessionProvider>
      <SafeAreaProvider>
        <NavigationContainer theme={IndustrialDarkTheme}>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </SessionProvider>
  );
}
