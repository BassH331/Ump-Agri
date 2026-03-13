import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const STEPS = [
  {
    key: 'waste_map',
    icon: 'map-outline',
    title: 'Find Bins on the Map',
    description:
      'All campus bins appear on the map with colors showing how full they are. Red bins need to be collected first. Tap any bin to get walking directions to it.',
  },
  {
    key: 'bin_monitoring',
    icon: 'trash-outline',
    title: 'Check Bin Fill Levels',
    description:
      'Open Bin Monitoring to see a list of all bins sorted by how full they are. Each bin shows its location, waste type (General, Recyclable, or Organic), and fill percentage.',
  },
  {
    key: 'collection_log',
    icon: 'clipboard-outline',
    title: 'Log Your Collections',
    description:
      'After you empty a bin, mark it as collected in the app. This helps your supervisor track which areas have been serviced and plan routes for the next shift.',
  },
  {
    key: 'alerts',
    icon: 'notifications-outline',
    title: 'Get Notified',
    description:
      'You\'ll receive alerts when a bin reaches critical level and needs urgent attention, or when your supervisor assigns you a new collection zone.',
  },
  {
    key: 'directions',
    icon: 'navigate-outline',
    title: 'Walking Directions',
    description:
      'Tap any bin on the map, then press "Directions" to get step-by-step walking navigation. The app shows you the distance and estimated walking time with your trolley.',
  },
];

export default function OnboardingTourScreen({ onFinish, onBack }) {
  const [index, setIndex] = useState(0);
  const step = useMemo(() => STEPS[index] ?? STEPS[0], [index]);
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;

  return (
    <LinearGradient colors={['#E8F5E9', '#F1F8E9']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to welcome"
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color="#2E7D32" />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name={step.icon} size={48} color="#2E7D32" />
          </View>
          <Text style={styles.stepCounter}>Step {index + 1} of {STEPS.length}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.progressRow}>
            {STEPS.map((item, i) => (
              <View
                key={item.key}
                style={[styles.dot, i === index && styles.dotActive, i < index && styles.dotCompleted]}
              />
            ))}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => setIndex((prev) => (isFirst ? prev : prev - 1))}
              style={[styles.secondaryButton, isFirst && styles.disabledButton]}
              disabled={isFirst}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryLabel, isFirst && styles.disabledLabel]}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (isLast) {
                  onFinish?.();
                } else {
                  setIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
                }
              }}
              style={styles.primaryButton}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryLabel}>{isLast ? 'Start Working' : 'Next'}</Text>
              {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 32, paddingVertical: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backLabel: { marginLeft: 4, fontSize: 16, fontWeight: '600', color: '#2E7D32' },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#C8E6C9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 3, borderColor: '#A5D6A7',
  },
  stepCounter: { fontSize: 13, fontWeight: '600', color: '#66BB6A', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1B5E20', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 16, lineHeight: 26, color: '#3A4A3A', textAlign: 'center' },
  footer: { paddingTop: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C8E6C9', marginHorizontal: 6 },
  dotActive: { backgroundColor: '#2E7D32', width: 24 },
  dotCompleted: { backgroundColor: '#66BB6A' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secondaryButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#2E7D32' },
  disabledButton: { borderColor: '#A5D6A7' },
  secondaryLabel: { color: '#2E7D32', fontSize: 16, fontWeight: '600' },
  disabledLabel: { color: '#A5D6A7' },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
  },
  primaryLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
