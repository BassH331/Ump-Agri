import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MOCK_BINS = [
  { id: '1', location: 'Academic Block A', type: 'General', fill: 85, zone: 'Academic' },
  { id: '2', location: 'Science Lab 1', type: 'Recyclable', fill: 42, zone: 'Academic' },
  { id: '3', location: 'Student Residence 1', type: 'Organic', fill: 15, zone: 'Residences' },
  { id: '4', location: 'Sports Center', type: 'General', fill: 92, zone: 'Sports' },
  { id: '5', location: 'Cafeteria', type: 'Organic', fill: 65, zone: 'Food' },
  { id: '6', location: 'Main Admin', type: 'Recyclable', fill: 10, zone: 'Admin' },
];

const BinCard = ({ item }) => {
  const getStatusColor = (fill) => {
    if (fill > 80) return '#F44336';
    if (fill > 50) return '#FFEB3B';
    return '#4CAF50';
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getStatusColor(item.fill) + '20' }]}>
          <Ionicons name="trash-outline" size={24} color={getStatusColor(item.fill)} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.locationText}>{item.location}</Text>
          <Text style={styles.zoneText}>{item.zone} Zone</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>

      <View style={styles.fillSection}>
        <View style={styles.fillBarContainer}>
          <View style={[styles.fillBar, { width: `${item.fill}%`, backgroundColor: getStatusColor(item.fill) }]} />
        </View>
        <Text style={[styles.fillText, { color: getStatusColor(item.fill) }]}>{item.fill}% Full</Text>
      </View>

      {item.fill > 80 && (
        <View style={styles.alertContainer}>
          <Ionicons name="alert-circle" size={16} color="#F44336" />
          <Text style={styles.alertText}>Needs Collection Soon</Text>
        </View>
      )}
    </View>
  );
};

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.header}>
        <Text style={styles.headerTitle}>Bin Monitoring</Text>
        <Text style={styles.headerSubtitle}>Real-time status of campus waste bins</Text>
      </LinearGradient>

      <FlatList
        data={MOCK_BINS}
        renderItem={({ item }) => <BinCard item={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  header: { padding: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#C8E6C9', marginTop: 5 },
  listContent: { padding: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconContainer: { width: 45, height: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, marginLeft: 15 },
  locationText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  zoneText: { fontSize: 12, color: '#777', marginTop: 2 },
  typeBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '600', color: '#555' },
  fillSection: { flexDirection: 'row', alignItems: 'center' },
  fillBarContainer: { flex: 1, height: 8, backgroundColor: '#eee', borderRadius: 4, marginRight: 15 },
  fillBar: { height: '100%', borderRadius: 4 },
  fillText: { fontSize: 16, fontWeight: 'bold' },
  alertContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: '#FFEBEE', padding: 8, borderRadius: 8 },
  alertText: { marginLeft: 8, color: '#B71C1C', fontSize: 12, fontWeight: '600' }
});
