import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const points = 1250;
  const level = "Eco Warrior";

  const REWARDS = [
    { id: '1', title: 'Free Campus Coffee', points: 500, icon: 'cafe-outline' },
    { id: '2', title: 'Printing Voucher (50 pages)', points: 750, icon: 'print-outline' },
    { id: '3', title: 'Sustainable Tote Bag', points: 1200, icon: 'briefcase-outline' },
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#fff" />
          </View>
          <Text style={styles.userName}>Green Champion</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{points}</Text>
            <Text style={styles.statLabel}>Eco Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Items Recycled</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Redeem Rewards</Text>
        {REWARDS.map(reward => (
          <TouchableOpacity key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardIcon}>
              <Ionicons name={reward.icon} size={24} color="#4CAF50" />
            </View>
            <View style={styles.rewardText}>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.rewardPoints}>{reward.points} Points</Text>
            </View>
            <TouchableOpacity style={styles.redeemButton}>
              <Text style={styles.redeemText}>Redeem</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
  profileInfo: { alignItems: 'center', marginBottom: 25 },
  avatarContainer: { marginBottom: 10 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  levelBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 8 },
  levelText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', elevation: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#eee' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2 },
  rewardIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  rewardText: { flex: 1, marginLeft: 15 },
  rewardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  rewardPoints: { fontSize: 14, color: '#4CAF50', marginTop: 2 },
  redeemButton: { backgroundColor: '#4CAF50', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  redeemText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});