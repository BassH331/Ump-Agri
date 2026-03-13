import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ALERTS = [
    { id: '1', title: 'Urgent Collection Needed', desc: 'Bin at Science Block A is 95% full. Head there first.', time: '2 mins ago', type: 'critical' },
    { id: '2', title: 'New Zone Assigned', desc: 'Your supervisor assigned you the Academic zone for this shift.', time: '15 mins ago', type: 'info' },
    { id: '3', title: 'Sensor Offline', desc: 'Fill sensor at Student Residence 2 is not responding. Check the bin manually.', time: '1 hour ago', type: 'warning' },
    { id: '4', title: 'Zone Cleared', desc: 'All bins in the Residences zone have been collected. Good work!', time: '2 hours ago', type: 'success' },
    { id: '5', title: 'Trolley Maintenance', desc: 'Trolley #3 is due for wheel maintenance. Report to facilities office.', time: '3 hours ago', type: 'warning' },
];

export default function AlertsScreen() {
    const getIcon = (type) => {
        switch (type) {
            case 'critical': return { name: 'alert-circle', color: '#D32F2F' };
            case 'warning': return { name: 'warning', color: '#F9A825' };
            case 'success': return { name: 'checkmark-circle', color: '#4CAF50' };
            default: return { name: 'information-circle', color: '#2196F3' };
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.header}>
                <Text style={styles.headerTitle}>Alerts</Text>
                <Text style={styles.headerSubtitle}>Updates from your supervisor and bin sensors</Text>
            </LinearGradient>
            <FlatList
                data={ALERTS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const icon = getIcon(item.type);
                    return (
                        <View style={styles.alertCard}>
                            <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                                <Ionicons name={icon.name} size={26} color={icon.color} />
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
    container: { flex: 1, backgroundColor: '#F1F8E9' },
    header: { padding: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: '#C8E6C9', marginTop: 4 },
    listContent: { padding: 20 },
    alertCard: {
        flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16,
        marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    },
    iconContainer: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    textContainer: { flex: 1, marginLeft: 14 },
    alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#1B5E20' },
    alertDesc: { fontSize: 14, color: '#555', marginTop: 3, lineHeight: 20 },
    alertTime: { fontSize: 12, color: '#999', marginTop: 6 },
});
