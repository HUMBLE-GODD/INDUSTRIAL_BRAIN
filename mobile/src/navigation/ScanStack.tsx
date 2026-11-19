import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScanScreen from '../screens/scan/ScanScreen';
import EquipmentDetailScreen from '../screens/equipment/EquipmentDetailScreen';
import { colors, typography } from '../theme';

export type ScanStackParamList = {
  ScanMain: undefined;
  EquipmentDetail: { equipmentId: string; name: string };
};

const Stack = createNativeStackNavigator<ScanStackParamList>();

export function ScanStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { ...typography.h3, color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="ScanMain"
        component={ScanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EquipmentDetail"
        component={EquipmentDetailScreen}
        options={({ route }) => ({
          title: route.params.name,
          headerShown: true,
        })}
      />
    </Stack.Navigator>
  );
}
