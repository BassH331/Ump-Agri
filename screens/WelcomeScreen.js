import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen({ onGetStarted }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to EcoCampus</Text>
        <Text style={styles.subtitle}>Smart Waste Management for a Cleaner Campus</Text>
        <Text style={styles.body}>
          Track bin levels, classify waste with AI, and earn rewards for sustainable habits.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onGetStarted} activeOpacity={0.85}>
        <Text style={styles.buttonLabel}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D47A1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  content: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#BBDEFB',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFC107',
    borderRadius: 16,
    paddingHorizontal: 36,
    paddingVertical: 16,
  },
  buttonLabel: {
    color: '#0D47A1',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
