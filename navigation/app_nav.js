import * as React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerTab from './drawer_nav';
import DirectionsScreen from '../screens/DirectionsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator initialRouteName="Main" screenOptions={{
      headerTitleAlign: 'center'
    }}>
      <Stack.Screen name="Main" component={DrawerTab} options={{
        title: "",
        headerShown: false,
      }} />
      <Stack.Screen name="Directions" component={DirectionsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{
        headerShown: false
      }} />
    </Stack.Navigator>
  );
}
export default RootStack;