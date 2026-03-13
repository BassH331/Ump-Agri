import React from 'react';
import { View, Text, Switch, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../contexts/SettingsContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { LinearGradient } from 'expo-linear-gradient';

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
        onPress: () => { resetOnboarding(); },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.header}>
        <Ionicons name="settings-outline" size={32} color="#fff" />
        <Text style={styles.heading}>Settings</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Ionicons name="moon-outline" size={20} color="#2E7D32" />
            <Text style={styles.label}>Dark Mode</Text>
          </View>
          <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: '#4CAF50' }} thumbColor={darkMode ? '#2E7D32' : '#f4f3f4'} />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Ionicons name="text-outline" size={20} color="#2E7D32" />
            <Text style={styles.label}>Show Bin Names</Text>
          </View>
          <Switch value={showBuildingNames} onValueChange={setShowBuildingNames} trackColor={{ true: '#4CAF50' }} thumbColor={showBuildingNames ? '#2E7D32' : '#f4f3f4'} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Map</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Ionicons name="locate-outline" size={20} color="#2E7D32" />
            <Text style={styles.label}>Auto Zoom to Destination</Text>
          </View>
          <Switch value={autoZoom} onValueChange={setAutoZoom} trackColor={{ true: '#4CAF50' }} thumbColor={autoZoom ? '#2E7D32' : '#f4f3f4'} />
        </View>

        <Text style={styles.subLabel}>Map View Type</Text>
        <View style={styles.optionButtons}>
          <TouchableOpacity
            style={[styles.optionButton, mapViewType === 'satellite' && styles.optionButtonSelected]}
            onPress={() => setMapViewType('satellite')}
          >
            <Text style={[styles.optionText, mapViewType === 'satellite' && styles.optionTextSelected]}>Satellite</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, mapViewType === 'hybrid' && styles.optionButtonSelected]}
            onPress={() => setMapViewType('hybrid')}
          >
            <Text style={[styles.optionText, mapViewType === 'hybrid' && styles.optionTextSelected]}>Hybrid</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <TouchableOpacity style={styles.actionButton} onPress={replayOnboarding}>
          <Ionicons name="refresh-outline" size={20} color="#2E7D32" />
          <Text style={styles.actionButtonText}>Replay Onboarding</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={resetSettings}>
          <Ionicons name="trash-outline" size={20} color="#D32F2F" />
          <Text style={styles.dangerButtonText}>Reset to Default</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  header: {
    padding: 30,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginLeft: 12 },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#66BB6A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10, elevation: 1 },
  settingLabel: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 16, marginLeft: 12, color: '#333' },
  subLabel: { fontSize: 14, color: '#666', marginBottom: 8, marginLeft: 4 },
  optionButtons: { flexDirection: 'row', marginBottom: 10 },
  optionButton: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#E8F5E9', borderRadius: 10, marginRight: 10 },
  optionButtonSelected: { backgroundColor: '#2E7D32' },
  optionText: { color: '#2E7D32', fontWeight: 'bold' },
  optionTextSelected: { color: '#fff' },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10, elevation: 1 },
  actionButtonText: { fontSize: 16, marginLeft: 12, color: '#2E7D32', fontWeight: '600' },
  dangerButton: { borderWidth: 1, borderColor: '#FFCDD2' },
  dangerButtonText: { fontSize: 16, marginLeft: 12, color: '#D32F2F', fontWeight: '600' },
});
