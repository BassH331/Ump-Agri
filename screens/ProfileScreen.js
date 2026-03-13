import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#fff" />
          </View>
          <Text style={styles.userName}>Cleaner</Text>
          <Text style={styles.shiftLabel}>Morning Shift • {today}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Bins Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Zones Covered</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2.4 km</Text>
            <Text style={styles.statLabel}>Walked</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Recent Collections</Text>

        {[
          { time: '08:15', location: 'Academic Block A', type: 'General' },
          { time: '08:32', location: 'Science Lab 1', type: 'Recyclable' },
          { time: '08:50', location: 'Cafeteria', type: 'Organic' },
          { time: '09:10', location: 'Student Res 1', type: 'General' },
        ].map((log, i) => (
          <View key={i} style={styles.logCard}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>{log.time}</Text>
            </View>
            <View style={styles.logLine} />
            <View style={styles.logDetails}>
              <Text style={styles.logLocation}>{log.location}</Text>
              <Text style={styles.logType}>{log.type} waste</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>This Week</Text>
        <View style={styles.weekCard}>
          <View style={styles.weekRow}>
            <Ionicons name="trash-outline" size={24} color="#2E7D32" />
            <View style={styles.weekText}>
              <Text style={styles.weekValue}>78 bins</Text>
              <Text style={styles.weekLabel}>Total collected</Text>
            </View>
          </View>
          <View style={styles.weekDivider} />
          <View style={styles.weekRow}>
            <Ionicons name="walk-outline" size={24} color="#2E7D32" />
            <View style={styles.weekText}>
              <Text style={styles.weekValue}>14.2 km</Text>
              <Text style={styles.weekLabel}>Distance walked</Text>
            </View>
          </View>
          <View style={styles.weekDivider} />
          <View style={styles.weekRow}>
            <Ionicons name="time-outline" size={24} color="#2E7D32" />
            <View style={styles.weekText}>
              <Text style={styles.weekValue}>5 shifts</Text>
              <Text style={styles.weekLabel}>Completed</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  header: { padding: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
  profileInfo: { alignItems: 'center', marginBottom: 25 },
  avatarContainer: { marginBottom: 10 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  shiftLabel: { color: '#C8E6C9', fontSize: 14, marginTop: 4 },
  statsContainer: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#E8F5E9' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  logCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 14,
    marginBottom: 8, elevation: 1,
  },
  timeColumn: { width: 50 },
  timeText: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
  logLine: { width: 2, height: 30, backgroundColor: '#C8E6C9', marginHorizontal: 10 },
  logDetails: { flex: 1 },
  logLocation: { fontSize: 15, fontWeight: '600', color: '#333' },
  logType: { fontSize: 12, color: '#777', marginTop: 2 },
  weekCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
  weekRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  weekText: { marginLeft: 14 },
  weekValue: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
  weekLabel: { fontSize: 12, color: '#666' },
  weekDivider: { height: 1, backgroundColor: '#E8F5E9', marginVertical: 4 },
});