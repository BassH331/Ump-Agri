import React from 'react';
import { View, Text, Switch, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';
import { useOnboarding } from '../contexts/OnboardingContext';

const defaultSettings = {
  darkMode: false,
  autoZoom: true,
  showBuildingNames: true,
  mapViewType: 'satellite', // default value
};

export default function SettingsScreen() {
  const { 
    darkMode, setDarkMode,
    autoZoom, setAutoZoom,
    showBuildingNames, setShowBuildingNames,
    mapViewType, setMapViewType,
    resetSettings: resetSettingsContext,
  } = useSettings();
  const { resetOnboarding } = useOnboarding();

  const resetSettings = () => {
    Alert.alert('Reset Settings', 'Are you sure you want to reset to default settings?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { resetSettingsContext(); } },
    ]);
  };

  const replayOnboarding = () => {
    Alert.alert('Replay Onboarding', 'Show the welcome and tutorial screens again?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Replay',
        style: 'default',
        onPress: () => {
          resetOnboarding();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={setDarkMode} />
      </View>

      {/* Map View Type Buttons */}
      <View style={styles.settingRowColumn}>
        <Text style={styles.label}>Map View Type</Text>
        <View style={styles.optionButtons}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              mapViewType === 'satellite' && styles.optionButtonSelected,
            ]}
            onPress={() => setMapViewType('satellite')}
          >
            <Text style={styles.optionText}>Satellite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              mapViewType === 'hybrid' && styles.optionButtonSelected,
            ]}
            onPress={() => setMapViewType('hybrid')}
          >
            <Text style={styles.optionText}>Hybrid</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Auto Zoom to Destination</Text>
        <Switch value={autoZoom} onValueChange={setAutoZoom} />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.label}>Show Building Names</Text>
        <Switch value={showBuildingNames} onValueChange={setShowBuildingNames} />
      </View>

      <View style={styles.resetButton}>
        <Button title="Reset to Default" color="blue" onPress={resetSettings} />
      </View>

      <View style={styles.resetButton}>
        <Button title="Replay Onboarding" color="#6C63FF" onPress={replayOnboarding} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  settingRowColumn: {
    marginVertical: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  optionButtons: {
    flexDirection: 'row',
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ddd',
    borderRadius: 10,
    marginRight: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#4287f5',
  },
  optionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resetButton: {
    marginTop: 40,
  },
});
