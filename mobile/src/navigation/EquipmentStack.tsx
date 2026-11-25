import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EquipmentListScreen from '../screens/equipment/EquipmentListScreen';
import EquipmentDetailScreen from '../screens/equipment/EquipmentDetailScreen';
import { colors, typography } from '../theme';

export type EquipmentStackParamList = {
  EquipmentList: undefined;
  EquipmentDetail: { equipmentId: string; name?: string };
};

const Stack = createNativeStackNavigator<EquipmentStackParamList>();

export function EquipmentStack() {
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
        name="EquipmentList"
        component={EquipmentListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EquipmentDetail"
        component={EquipmentDetailScreen}
        options={({ route }) => ({
          title: route.params.name || route.params.equipmentId,
          headerShown: true,
        })}
      />
    </Stack.Navigator>
  );
}
