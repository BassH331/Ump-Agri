import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import RootStack from './navigation/app_nav';
import LogRocket from '@logrocket/react-native';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WelcomeScreen from './screens/WelcomeScreen';
import OnboardingTourScreen from './screens/OnboardingTourScreen';

// Only enable LogRocket in production
if (!__DEV__) {
  LogRocket.init('nfmlrd/ump-map');
}

function AppNavigator() {
  const { darkMode } = useSettings();
  const { loading, hasCompletedOnboarding, completeOnboarding } = useOnboarding();
  const [showTour, setShowTour] = useState(false);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={darkMode ? DarkTheme : DefaultTheme}>
      {hasCompletedOnboarding ? (
        <RootStack />
      ) : showTour ? (
        <OnboardingTourScreen
          onFinish={completeOnboarding}
          onBack={() => setShowTour(false)}
        />
      ) : (
        <WelcomeScreen onGetStarted={() => setShowTour(true)} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <OnboardingProvider>
          <AppNavigator />
        </OnboardingProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
});
