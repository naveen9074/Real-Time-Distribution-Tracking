import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import SaleScreen from '../screens/SaleScreen';
import ReceiptScreen from '../screens/ReceiptScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0d0f1a' },
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Sale" component={SaleScreen} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
