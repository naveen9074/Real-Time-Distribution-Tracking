import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import our beautiful animated screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SaleScreen from './src/screens/SaleScreen';
import ReceiptScreen from './src/screens/ReceiptScreen';
import COLORS from './src/theme/colors';

const Stack = createStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false, // We use our own custom animated headers in the screens
              cardStyle: { backgroundColor: COLORS.bg },
              // Enable smooth modern transitions
              presentation: 'card',
              animationEnabled: true,
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Sale" component={SaleScreen} />
            <Stack.Screen 
              name="Receipt" 
              component={ReceiptScreen} 
              // The receipt pops up from the bottom for a nice reveal effect
              options={{ 
                presentation: 'modal',
                animationEnabled: true
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
