import * as React from 'react';
import { View, Text, Button } from 'react-native';
import { NavigationContainer, Navigation} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import ExploreScreen from '../screens/ExploreScreen'; 


export default function ProfileScreen() {

  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>
        Home Screen
      </Text>
      <Button
        onPress={() => navigation.navigate('Explore')}
        title = {"Explore"}> Explore </Button>
    </View>
  );
}