/**
 * Web Location Check App
 * @format
 */

import React from 'react';
import {
  StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LocationScreen from './src/screens/LocationScreen';
import MapScreen from './src/components/MapScreen';
import BrowserScreen from './src/screens/BrowserScreen';

export interface Location {
  latitude: number;
  longitude: number;
  timestamp?: number;
}

export type RootStackParamList = {
  Home: undefined;
  Map: { location: Location };
  Browser: { url: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E88E5',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen
          name="Home"
          component={LocationScreen}
          options={{ title: 'Location Services' }}
        />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{ title: 'Interactive Map' }}
        />
        <Stack.Screen
          name="Browser"
          component={BrowserScreen}
          options={{ title: 'Web Location Check' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;