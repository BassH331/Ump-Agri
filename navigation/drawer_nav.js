import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ClassificationScreen from '../screens/ClassificationScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import AlertsScreen from '../screens/AlertsScreen';
import CustomMenuIcon from '../components/CustomMenuIcon';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Image } from 'react-native';
import SettingsScreen from '../screens/SettingsScreen';
import { SearchProvider, useSearch } from '../contexts/SearchContext';

// Function to create the search bar for the header
function SearchBar({ navigation }) {
  const { searchQuery, setSearchQuery } = useSearch();

  return (
    <View style={styles.headerContainerDynamic}>
      <View style={[styles.searchBarCustom, {
        left: "7%",
        ...Platform.select({
          ios: {
            left: "-7%"
          }
        })
      }]}>
        <TextInput
          style={styles.searchInputCustom}
          placeholder="Search buildings..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons
          name="search-outline"
          size={20}
          color="darkblue"
          left={20}
          style={{ ...Platform.select({ ios: { left: '39%' } }) }}
        />
      </View>
    </View>
  );
}

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => props.navigation.closeDrawer()}>
          <Image
            source={require('../assets/return.png')}
            style={{
              width: 30,
              height: 30,
              marginRight: 'auto',
              marginTop: 6,
              tintColor: 'white',
            }}
            resizeMode="contain"></Image>
        </TouchableOpacity>
        <Image
          source={require('../assets/ump_logo.png')}
          style={{
            width: 71,
            height: 42,
            borderRadius: 26,
            marginLeft: 'auto',
          }}
          resizeMode="stretch"
        />
      </View>
      <View style={styles.headerSection}>
        <Text style={styles.headerText}>EcoCampus</Text>
      </View>
      <View style={styles.spacer} />
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function DrawerTabNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerTitleAlign: 'center',
        headerLeft: () => <CustomMenuIcon />,
        drawerStyle: styles.drawer,
        drawerLabelStyle: styles.drawerLabel,
        drawerActiveTintColor: 'darkblue',
        drawerInactiveTintColor: 'white',
        drawerActiveBackgroundColor: 'white',
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen
        name="WasteMap"
        component={HomeScreen}
        options={{
          title: 'Campus Waste Map',
          headerTitle: (props) => <SearchBar {...props} />,
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="map-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="BinStatus"
        component={ExploreScreen}
        options={{
          title: 'Bin Monitoring',
          headerTitle: (props) => <SearchBar {...props} />,
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="trash-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Classification"
        component={ClassificationScreen}
        options={{
          title: 'Smart Classification',
          headerTitle: (props) => <SearchBar {...props} />,
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="scan-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Eco Analytics',
          headerTitle: (props) => <SearchBar {...props} />,
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="stats-chart-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          title: 'Smart Alerts',
          headerTitle: (props) => <SearchBar {...props} />,
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="notifications-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Eco Rewards',
          headerTitle: (props) => <SearchBar {...props} />,
          drawerIcon: ({ focused, color, size }) => (
            <Ionicons name="trophy-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ focused, color, size }) => (
            <View style={styles.drawerIcons}>
              <Image
                source={require('../assets/settings.png')}
                style={{ width: 21, height: 21, tintColor: color }}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

// Main component that wraps the navigator with the search provider
export default function DrawerTab() {
  return (
    <SearchProvider>
      <DrawerTabNavigator />
    </SearchProvider>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    backgroundColor: 'darkblue',
  },
  drawer: {
    backgroundColor: 'darkblue',
    width: 250,
  },
  drawerLabel: {
    fontSize: 16,
  },
  drawerIcons: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    width: '100%',
    borderRadius: 12,
  },
  headerText: {
    fontSize: 40,
    letterSpacing: 0.4,
    lineHeight: 34,
    fontFamily: 'Questrial-Regular',
    color: '#fff',
    textAlign: 'left',
    width: 164,
    height: 70,
    marginTop: 20,
  },
  spacer: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  searchBarCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 5,
    height: 45,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        height: 35,
        bottom: 4,
        width: '120%'
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchInputCustom: {
    fontSize: 16,
    color: '#333',
    paddingRight: 10,
    ...Platform.select({
      android: {
        width: '81%',
        left: 10,
        right: 0
      },
      ios: {
        width: '70%',
        left: 10,
        right: 0
      }
    })
  },
});