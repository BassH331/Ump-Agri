import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

export default function RouteToggle({ mode = 'campus', onChange }) {
  const knob = useRef(new Animated.Value(mode === 'campus' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(knob, {
      toValue: mode === 'campus' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [mode]);

  const translateX = knob.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 112], // knob positions for wider container
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      <TouchableOpacity style={styles.option} activeOpacity={0.8} onPress={() => onChange && onChange('campus')}>
        <Text style={[styles.optionText, mode === 'campus' && styles.activeText]}>Campus Cache</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} activeOpacity={0.8} onPress={() => onChange && onChange('ors')}>
        <Text style={[styles.optionText, mode === 'ors' && styles.activeText]}>Open Route</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    overflow: 'hidden',
    width: 226,
    height: 36,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  knob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 112,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
  },
  option: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.2,
    fontSize: 12,
  },
  activeText: {
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});