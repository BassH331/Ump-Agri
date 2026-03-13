import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ZONE_STATS = [
    { zone: 'Academic Block', bins: 18, collected: 14, percent: 78 },
    { zone: 'Residences', bins: 24, collected: 20, percent: 83 },
    { zone: 'Sports Complex', bins: 8, collected: 8, percent: 100 },
    { zone: 'Food Courts', bins: 12, collected: 7, percent: 58 },
    { zone: 'Admin Block', bins: 6, collected: 6, percent: 100 },
];

export default function AnalyticsScreen() {
    const totalBins = ZONE_STATS.reduce((sum, z) => sum + z.bins, 0);
    const totalCollected = ZONE_STATS.reduce((sum, z) => sum + z.collected, 0);
    const overallPercent = Math.round((totalCollected / totalBins) * 100);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.header}>
                <Text style={styles.headerTitle}>Collection Stats</Text>
                <Text style={styles.headerSubtitle}>Today's campus collection progress</Text>
            </LinearGradient>

            <View style={styles.overviewRow}>
                <View style={styles.overviewCard}>
                    <Text style={styles.overviewValue}>{totalCollected}</Text>
                    <Text style={styles.overviewLabel}>Bins Collected</Text>
                </View>
                <View style={styles.overviewCard}>
                    <Text style={styles.overviewValue}>{totalBins - totalCollected}</Text>
                    <Text style={styles.overviewLabel}>Remaining</Text>
                </View>
                <View style={styles.overviewCard}>
                    <Text style={styles.overviewValue}>{overallPercent}%</Text>
                    <Text style={styles.overviewLabel}>Complete</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Collection by Zone</Text>
                {ZONE_STATS.map((zone, i) => (
                    <View key={i} style={styles.zoneCard}>
                        <View style={styles.zoneHeader}>
                            <Text style={styles.zoneName}>{zone.zone}</Text>
                            <Text style={styles.zoneCount}>{zone.collected}/{zone.bins}</Text>
                        </View>
                        <View style={styles.barContainer}>
                            <View style={[
                                styles.bar,
                                { width: `${zone.percent}%`, backgroundColor: zone.percent === 100 ? '#4CAF50' : zone.percent >= 70 ? '#66BB6A' : '#FFB300' }
                            ]} />
                        </View>
                        {zone.percent === 100 && (
                            <View style={styles.completeBadge}>
                                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                                <Text style={styles.completeText}>Zone cleared</Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shift Summary</Text>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Ionicons name="walk-outline" size={26} color="#2E7D32" />
                        <View style={styles.summaryText}>
                            <Text style={styles.summaryValue}>3.8 km</Text>
                            <Text style={styles.summaryLabel}>Distance walked today</Text>
                        </View>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Ionicons name="time-outline" size={26} color="#2E7D32" />
                        <View style={styles.summaryText}>
                            <Text style={styles.summaryValue}>2h 35m</Text>
                            <Text style={styles.summaryLabel}>Time on shift</Text>
                        </View>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Ionicons name="speedometer-outline" size={26} color="#2E7D32" />
                        <View style={styles.summaryText}>
                            <Text style={styles.summaryValue}>4.2 min</Text>
                            <Text style={styles.summaryLabel}>Avg. time per bin</Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F8E9' },
    header: { padding: 25, paddingTop: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: '#C8E6C9', marginTop: 4 },
    overviewRow: { flexDirection: 'row', padding: 15, marginTop: -10 },
    overviewCard: {
        flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 16, marginHorizontal: 5,
        alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    },
    overviewValue: { fontSize: 24, fontWeight: 'bold', color: '#1B5E20' },
    overviewLabel: { fontSize: 11, color: '#666', marginTop: 4 },
    section: { padding: 20, paddingTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
    zoneCard: { backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 10, elevation: 1 },
    zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    zoneName: { fontSize: 16, fontWeight: '600', color: '#333' },
    zoneCount: { fontSize: 14, color: '#666' },
    barContainer: { height: 8, backgroundColor: '#E8F5E9', borderRadius: 4 },
    bar: { height: '100%', borderRadius: 4 },
    completeBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    completeText: { fontSize: 12, color: '#4CAF50', marginLeft: 4, fontWeight: '600' },
    summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    summaryText: { marginLeft: 14 },
    summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20' },
    summaryLabel: { fontSize: 13, color: '#666' },
    summaryDivider: { height: 1, backgroundColor: '#E8F5E9', marginVertical: 4 },
});
