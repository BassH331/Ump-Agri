import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const STEPS = [
  {
    key: 'map_overview',
    icon: 'map-outline',
    title: 'Explore the Campus Map',
    description:
      'Pan and zoom across an interactive campus map. Your location appears as a blue dot so you always know where you are.',
  },
  {
    key: 'browse_categories',
    icon: 'grid-outline',
    title: 'Browse Key Facilities',
    description:
      'Use the category chips to quickly jump to popular spots like lecture halls, labs, dining spaces, and residences.',
  },
  {
    key: 'search_favorites',
    icon: 'search-outline',
    title: 'Search',
    description:
      'Find any venue by name.',
  },
  {
    key: 'smart_directions',
    icon: 'navigate-outline',
    title: 'Get Smart Directions',
    description:
      'Choose a destination to see the best walking routes, distance, and estimated travel time right on the map.',
  },
];

export default function OnboardingTourScreen({ onFinish, onBack }) {
  const [index, setIndex] = useState(0);
  const step = useMemo(() => STEPS[index] ?? STEPS[0], [index]);
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Back to welcome"
        onPress={onBack}
        style={styles.backButton}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={22} color="#0D47A1" />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name={step.icon} size={48} color="#0D47A1" />
        </View>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressRow}>
          {STEPS.map((item, i) => (
            <View
              key={item.key}
              style={[styles.dot, i === index && styles.dotActive]}
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
            <Text style={styles.primaryLabel}>{isLast ? 'Start exploring' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7FD',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backLabel: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#0D47A1',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0D47A1',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    color: '#3A4A5A',
    textAlign: 'center',
  },
  footer: {
    paddingTop: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#BBDEFB',
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: '#0D47A1',
    width: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0D47A1',
  },
  disabledButton: {
    borderColor: '#90A4AE',
  },
  secondaryLabel: {
    color: '#0D47A1',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledLabel: {
    color: '#90A4AE',
  },
  primaryButton: {
    backgroundColor: '#0D47A1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
