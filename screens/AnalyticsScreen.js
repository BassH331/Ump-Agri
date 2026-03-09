import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AnalyticsScreen() {
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Recycling Analytics</Text>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Total Waste Diverted</Text>
                <Text style={styles.cardValue}>1,240 kg</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Recycling Rate</Text>
                <Text style={styles.cardValue}>68%</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Recycling Zone</Text>
                <Text style={styles.cardValue}>Science Block</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 2 },
    cardTitle: { fontSize: 16, color: '#666' },
    cardValue: { fontSize: 28, fontWeight: 'bold', color: '#4CAF50', marginTop: 5 }
});
