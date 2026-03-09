import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import theme from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import tutorialBus from '../utils/tutorialBus';

export default function TutorialOverlay({ visible, steps = [], initialStep = 0, onSkip, onDone, highlights = {}, validation = {} }) {
  const [index, setIndex] = useState(initialStep);
  const [canProceed, setCanProceed] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 30, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    setIndex(Math.min(Math.max(index, 0), steps.length - 1));
  }, [steps.length]);

  useEffect(() => {
    // reset proceed gating on step change and when validation changes
    const step = steps[index] || {};
    const requires = !!step.requireEvent || !!step.validateKey || typeof step.completePredicate === 'function';
    let doneFromBus = false;

    const updateProceed = () => {
      const validated = step.validateKey ? !!validation?.[step.validateKey] : false;
      const predicate = typeof step.completePredicate === 'function' ? !!step.completePredicate(validation) : false;
      setCanProceed(!requires || validated || predicate || doneFromBus);
    };

    updateProceed();

    let unsubscribe;
    if (step.requireEvent) {
      unsubscribe = tutorialBus.on(step.requireEvent, () => {
        doneFromBus = true;
        updateProceed();
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [index, steps, validation]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!visible) return null;

  const step = steps[index] || {};
  const isLast = index === steps.length - 1;
  const rect = step.highlightKey && highlights[step.highlightKey];
  const nextDisabled = !!step.requireEvent && !canProceed;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.dim} pointerEvents="none" />
  
      {rect ? (
        <View style={[styles.highlight, { left: rect.x, top: rect.y, width: rect.width, height: rect.height }]} pointerEvents="none"> 
          <Animated.View
            style={[
              styles.highlightPulse,
              {
                transform: [
                  { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
                ],
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] }),
              },
            ]}
          />
        </View>
      ) : null}
  
      {rect ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.callout,
            {
              left: Math.max(10, rect.x),
              top:
                rect.y > Dimensions.get('window').height * 0.3
                  ? Math.max(10, rect.y - 64)
                  : Math.min(rect.y + rect.height + 8, Dimensions.get('window').height - 80),
            },
          ]}
          onPress={() => {
            if (step.requireEvent) tutorialBus.emit(step.requireEvent);
          }}
          pointerEvents="auto"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={rect.y > Dimensions.get('window').height * 0.3 ? 'caret-down' : 'caret-up'}
              size={16}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.calloutText}>{step.callout || step.description || ''}</Text>
          </View>
        </TouchableOpacity>
      ) : null}
  
      <Animated.View style={[styles.popup, { opacity, transform: [{ translateY }] }]} pointerEvents="auto"> 
        <View style={styles.titleRow}>
          <Ionicons name={step.icon || 'information-circle-outline'} size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.title}>{step.title || 'Welcome'}</Text>
        </View>
        <Text style={styles.body}>{step.description || 'Follow the steps below to get familiar with the app.'}</Text>
  
        <View style={styles.controls}>
          <TouchableOpacity onPress={onSkip} style={[styles.controlBtn, styles.skipBtn]} activeOpacity={0.85}>
            <Text style={styles.controlText}>Skip</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={() => setIndex(prev => Math.max(prev - 1, 0))}
              style={[styles.controlBtn, { marginRight: theme.spacing.sm }]}
              activeOpacity={0.85}
            >
              <Text style={styles.controlText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={nextDisabled}
              onPress={() => (isLast ? onDone && onDone() : setIndex(prev => Math.min(prev + 1, steps.length - 1)))}
              style={[styles.controlBtn, styles.primaryBtn, nextDisabled ? { opacity: 0.6 } : null]}
              activeOpacity={0.85}
            >
              <Text style={[styles.controlText, { color: '#fff' }]}>{isLast ? 'Done' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
  
        <View style={styles.stepBar}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === index ? styles.dotActive : null]} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    zIndex: 10000,
  },
  dim: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: theme.colors.overlay,
  },
  highlight: {
    position: 'absolute',
    borderRadius: theme.radii.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(0,0,0,0.0)',
  },
  highlightPulse: {
    position: 'absolute', left: -8, right: -8, top: -8, bottom: -8,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  callout: {
    position: 'absolute',
    maxWidth: Dimensions.get('window').width - 40,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  calloutText: {
    color: theme.colors.text,
    fontSize: 13,
  },
  popup: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'web' ? 30 : 60,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  title: {
    fontSize: 18, fontWeight: '700', color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontSize: 14, color: theme.colors.muted,
  },
  controls: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  controlBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: '#F0F0F3',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  skipBtn: {
    backgroundColor: '#F3F3F7',
  },
  controlText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  stepBar: {
    marginTop: theme.spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
  }
});