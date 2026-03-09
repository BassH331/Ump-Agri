import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ALERTS = [
    { id: '1', title: 'Critical Fill Level', desc: 'Bin at Science Block A is 95% full.', time: '2 mins ago', type: 'critical' },
    { id: '2', title: 'Collection Route Started', desc: 'Truck #4 is currently clearing Academic zone.', time: '15 mins ago', type: 'info' },
    { id: '3', title: 'Maintenance Required', desc: 'Sensor issue reported at Student Res 2.', time: '1 hour ago', type: 'warning' },
];

export default function AlertsScreen() {
    const getIcon = (type) => {
        switch (type) {
            case 'critical': return { name: 'alert-circle', color: '#F44336' };
            case 'warning': return { name: 'warning', color: '#FF9800' };
            default: return { name: 'information-circle', color: '#2196F3' };
        };
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Smart Alerts</Text>
            <FlatList
                data={ALERTS}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                    const icon = getIcon(item.type);
                    return (
                        <View style={styles.alertCard}>
                            <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                                <Ionicons name={icon.name} size={24} color={icon.color} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.alertTitle}>{item.title}</Text>
                                <Text style={styles.alertDesc}>{item.desc}</Text>
                                <Text style={styles.alertTime}>{item.time}</Text>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    alertCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, elevation: 2 },
    iconContainer: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
    textContainer: { flex: 1, marginLeft: 15 },
    alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    alertDesc: { fontSize: 14, color: '#666', marginTop: 2 },
    alertTime: { fontSize: 12, color: '#999', marginTop: 5 }
});
