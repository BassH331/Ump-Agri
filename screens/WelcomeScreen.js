import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen({ onGetStarted }) {
  return (
    <LinearGradient colors={['#1B5E20', '#2E7D32', '#43A047']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="trash" size={50} color="#fff" />
        </View>
        <Text style={styles.title}>EcoCampus</Text>
        <Text style={styles.subtitle}>Smart Waste Collection</Text>
        <Text style={styles.body}>
          See which bins need collection first, get walking directions to them, and log your completed rounds — all from your phone.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onGetStarted} activeOpacity={0.85}>
        <Text style={styles.buttonLabel}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#1B5E20" style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      <Text style={styles.footer}>EcoCampus • UMP Facilities</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  content: { alignItems: 'center', marginBottom: 48 },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  title: { fontSize: 38, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: 1 },
  subtitle: { fontSize: 18, lineHeight: 26, color: '#C8E6C9', textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 24, color: '#A5D6A7', textAlign: 'center' },
  button: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 30,
    paddingHorizontal: 36, paddingVertical: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  buttonLabel: { color: '#1B5E20', fontSize: 18, fontWeight: '700' },
  footer: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 40 },
});
