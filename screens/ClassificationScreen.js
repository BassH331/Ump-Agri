import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const INITIAL_TASKS = [
    { id: '1', location: 'Academic Block A', type: 'General', status: 'pending' },
    { id: '2', location: 'Science Lab 1', type: 'Recyclable', status: 'pending' },
    { id: '3', location: 'Student Residence 1', type: 'Organic', status: 'pending' },
    { id: '4', location: 'Sports Center', type: 'General', status: 'pending' },
    { id: '5', location: 'Cafeteria', type: 'Organic', status: 'pending' },
    { id: '6', location: 'Main Admin', type: 'Recyclable', status: 'pending' },
];

export default function ClassificationScreen() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);

    const toggleTask = (id) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, status: t.status === 'pending' ? 'collected' : 'pending' } : t
        ));
    };

    const collected = tasks.filter(t => t.status === 'collected').length;
    const total = tasks.length;

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#2E7D32', '#1B5E20']} style={styles.header}>
                <Text style={styles.headerTitle}>Collection Checklist</Text>
                <Text style={styles.headerSubtitle}>Today's assigned bins</Text>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(collected / total) * 100}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{collected}/{total} collected</Text>
                </View>
            </LinearGradient>

            <FlatList
                data={tasks}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const isDone = item.status === 'collected';
                    return (
                        <TouchableOpacity
                            style={[styles.taskCard, isDone && styles.taskCardDone]}
                            onPress={() => toggleTask(item.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                                {isDone && <Ionicons name="checkmark" size={18} color="#fff" />}
                            </View>
                            <View style={styles.taskText}>
                                <Text style={[styles.taskLocation, isDone && styles.taskTextDone]}>{item.location}</Text>
                                <Text style={styles.taskType}>{item.type} waste</Text>
                            </View>
                            {isDone ? (
                                <View style={styles.doneBadge}>
                                    <Text style={styles.doneBadgeText}>Done</Text>
                                </View>
                            ) : (
                                <Ionicons name="trash-outline" size={22} color="#F44336" />
                            )}
                        </TouchableOpacity>
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
    progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
    progressBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4 },
    progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
    progressText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginLeft: 12 },
    listContent: { padding: 20 },
    taskCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16,
        marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    },
    taskCardDone: { backgroundColor: '#E8F5E9', elevation: 0 },
    checkbox: {
        width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: '#C8E6C9',
        alignItems: 'center', justifyContent: 'center',
    },
    checkboxDone: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
    taskText: { flex: 1, marginLeft: 14 },
    taskLocation: { fontSize: 16, fontWeight: '600', color: '#333' },
    taskTextDone: { textDecorationLine: 'line-through', color: '#999' },
    taskType: { fontSize: 13, color: '#777', marginTop: 2 },
    doneBadge: { backgroundColor: '#C8E6C9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    doneBadgeText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
});
