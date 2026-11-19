import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeStack } from './HomeStack';
import { EquipmentStack } from './EquipmentStack';
import { ScanStack } from './ScanStack';
import { QueryStack } from './QueryStack';
import { SettingsStack } from './SettingsStack';
import { colors, typography } from '../theme';

export type TabParamList = {
  HomeTab: undefined;
  EquipmentTab: undefined;
  ScanTab: undefined;
  QueryTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function getTabIcon(routeName: string, focused: boolean): string {
  switch (routeName) {
    case 'HomeTab':
      return '🏠';
    case 'EquipmentTab':
      return '⚙️';
    case 'ScanTab':
      return '📷';
    case 'QueryTab':
      return '🤖';
    case 'SettingsTab':
      return '⚡';
    default:
      return '●';
  }
}

function getTabLabel(routeName: string): string {
  switch (routeName) {
    case 'HomeTab':
      return 'Home';
    case 'EquipmentTab':
      return 'Equipment';
    case 'ScanTab':
      return 'Scan';
    case 'QueryTab':
      return 'Ask AI';
    case 'SettingsTab':
      return 'Settings';
    default:
      return '';
  }
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icon = getTabIcon(route.name, focused);
          return <Text style={{ fontSize: 22 }}>{icon}</Text>;
        },
        tabBarLabel: getTabLabel(route.name),
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          ...typography.tabLabel,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          elevation: 0,
          shadowOpacity: 0,
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="EquipmentTab" component={EquipmentStack} />
      <Tab.Screen name="ScanTab" component={ScanStack} />
      <Tab.Screen name="QueryTab" component={QueryStack} />
      <Tab.Screen name="SettingsTab" component={SettingsStack} />
    </Tab.Navigator>
  );
}
