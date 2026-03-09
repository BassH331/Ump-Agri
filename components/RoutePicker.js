import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Platform, ScrollView } from 'react-native';

export default function RoutePicker({ visible, title = 'Choose a campus route', options = [], onSelect, onClose }) {
  const translateY = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
      onPanResponderMove: Animated.event([null, { dy: translateY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 120) {
          hide();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
        }
      },
    })
  ).current;

  const show = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0.4, duration: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 })
    ]).start();
  };
  const hide = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 400, duration: 200, useNativeDriver: true })
    ]).start(({ finished }) => {
      if (finished && onClose) onClose();
    });
  };

  useEffect(() => {
    if (visible) show(); else hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={hide} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 260 }}>
          {options.map((opt, idx) => {
            const name = opt?.name || 'Unnamed Route';
            const points = opt?.coordinates || opt?.pathPoints || opt?.points || [];
            const len = Array.isArray(points) ? points.length : 0;
            return (
              <TouchableOpacity key={idx} style={styles.item} onPress={() => onSelect && onSelect(opt)} activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
                  <Text style={styles.itemMeta}>Cached • {len} points</Text>
                </View>
                <View style={styles.choosePill}><Text style={styles.chooseText}>Choose</Text></View>
              </TouchableOpacity>
            );
          })}
          {options.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No cached routes found</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'web' ? 12 : 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  title: {
    fontSize: 16, fontWeight: '700', color: '#222',
  },
  closeBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#eee',
  },
  closeText: { fontSize: 12, fontWeight: '600', color: '#333' },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomColor: '#eee', borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111' },
  itemMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  choosePill: { backgroundColor: 'rgba(0,122,255,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  chooseText: { color: '#007AFF', fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyText: { color: '#666', fontSize: 13 },
});