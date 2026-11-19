import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QueryScreen from '../screens/query/QueryScreen';
import { colors } from '../theme';

export type QueryStackParamList = {
  QueryMain: undefined;
};

const Stack = createNativeStackNavigator<QueryStackParamList>();

export function QueryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="QueryMain" component={QueryScreen} />
    </Stack.Navigator>
  );
}
