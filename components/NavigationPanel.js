import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Accuracy color helper removed; panel no longer displays GPS accuracy

export default function NavigationPanel({
  visible,
  destinationName,
  distance,
  speed,
  etaSeconds,
  travelMode,
  onChangeMode,
  onStop,
  onHide,
  onShow,
  liveBadge = true,
}) {
  const formatEta = (seconds) => {
    if (seconds == null || isNaN(seconds)) return 'Calculating...';
    const s = Math.max(0, Math.round(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const panelPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        panelPosition.setOffset({ x: panelPosition.x._value, y: panelPosition.y._value });
      },
      onPanResponderMove: Animated.event([null, { dx: panelPosition.x, dy: panelPosition.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_evt, gestureState) => {
        panelPosition.flattenOffset();
        let finalX = panelPosition.x._value;
        let finalY = panelPosition.y._value;

        const panelWidth = screenWidth - 40; // match left/right margins
        const panelHeight = 200; // approximate panel height

        if (finalX < -panelWidth / 2) finalX = -panelWidth / 2;
        if (finalX > panelWidth / 2) finalX = panelWidth / 2;
        if (finalY < -screenHeight / 2 + 100) finalY = -screenHeight / 2 + 100;
        if (finalY > screenHeight / 2 - panelHeight) finalY = screenHeight / 2 - panelHeight;

        Animated.spring(panelPosition, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <>
      {visible ? (
        <>
          <Animated.View
            style={[styles.navigationInfo, { transform: panelPosition.getTranslateTransform() }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.panelHeader}>
              <Text style={styles.navigationTitle}>🧭 Navigating to: {destinationName}</Text>
              <TouchableOpacity style={styles.hideButton} onPress={onHide} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, travelMode === 'walk' && styles.modeButtonActive]}
                onPress={() => onChangeMode && onChangeMode('walk')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeButtonText, travelMode === 'walk' && styles.modeButtonTextActive]}>Walk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, travelMode === 'drive' && styles.modeButtonActive]}
                onPress={() => onChangeMode && onChangeMode('drive')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeButtonText, travelMode === 'drive' && styles.modeButtonTextActive]}>Drive</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.navigationStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>
                  {typeof distance === 'number' ? `${Math.round(distance)}m` : distance || 'Calculating...'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Speed</Text>
                <Text style={styles.statValue}>{speed} km/h</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ETA ({travelMode === 'drive' ? 'Drive' : 'Walk'})</Text>
                <Text style={styles.statValue}>{formatEta(etaSeconds)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.stopButton} onPress={onStop} activeOpacity={0.8}>
              <Text style={styles.stopButtonText}>Stop Navigation</Text>
            </TouchableOpacity>
          </Animated.View>

          {liveBadge && (
            <View style={styles.realTimeStatus}>
              <Text style={styles.realTimeText}>🔴 LIVE GPS Tracking</Text>
            </View>
          )}
        </>
      ) : (
        <TouchableOpacity style={styles.showPanelButton} onPress={onShow} activeOpacity={0.8}>
          <Ionicons name="information-circle" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  navigationInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 16,
    borderRadius: 12,
    zIndex: 998,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hideButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showPanelButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'rgba(0,122,255,0.9)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  navigationTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  navigationStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modeButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(0,122,255,0.9)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  modeButtonText: {
    color: '#eee',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statLabel: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#FF4444',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  stopButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  realTimeStatus: {
    position: 'absolute',
    top: 90,
    left: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 997,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  realTimeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
});