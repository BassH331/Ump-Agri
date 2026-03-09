import * as React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DrawerTab from './drawer_nav';
import FoodScreen from '../screens/Explore/FoodScreen';
import AdminScreen from '../screens/Explore/AdminScreen';
import EducationScreen from '../screens/Explore/EducationScreen';
import DirectionsScreen from '../screens/DirectionsScreen';
import LibrariesScreen from '../screens/Explore/LibrariesScreen';
import ResidenceScreen from '../screens/Explore/ResidenceScreen';
import ComputerLabsScreen from '../screens/Explore/ComputerLabsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator initialRouteName="Main" screenOptions={{
      headerTitleAlign: 'center'
    }}>
      <Stack.Screen name="Main" component={DrawerTab} options = {{
          title: "",
          headerShown: false,
        }}/>
      <Stack.Screen name="Explore" component={ExploreScreen} options = {{
        headerShown: false,
      }}/>
      <Stack.Screen name="Profile" component={ProfileScreen} options = {{
        headerShown: false
      }}/>
      <Stack.Screen name="Settings" component={SettingsScreen} options = {{
        headerShown: false
      }}/>
      <Stack.Screen name="Food" component={FoodScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="Education" component={EducationScreen} />
      <Stack.Screen name="Directions" component={DirectionsScreen} />
      <Stack.Screen name="Libraries" component={LibrariesScreen} />
      <Stack.Screen name="Residence" component={ResidenceScreen} />
      <Stack.Screen name="ComputerLabs" component={ComputerLabsScreen} />
    </Stack.Navigator>
  );
}
export default RootStack;