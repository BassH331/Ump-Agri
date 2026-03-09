import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ClassificationScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Smart Waste Classification</Text>
            <View style={styles.cameraPlaceholder}>
                <Ionicons name="camera-outline" size={100} color="#ccc" />
                <Text style={styles.placeholderText}>AI Scan coming soon...</Text>
            </View>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Scan Item</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    cameraPlaceholder: { width: '100%', height: 300, backgroundColor: '#f0f0f0', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
    placeholderText: { marginTop: 10, color: '#999' },
    button: { backgroundColor: '#4CAF50', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
