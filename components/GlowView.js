import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * GlowView: Wrap children to display a subtle animated glow around white elements.
 * - Works by rendering an absolutely positioned Animated layer behind the content.
 * - Uses opacity + scale pulsing for a soft glow effect.
 */
export default function GlowView({
  children,
  style,
  glowColor = 'rgba(0,122,255,0.25)', // subtle primary-blue glow
  borderRadius = 16,
  pulseDuration = 2000,
  minOpacity = 0.12,
  maxOpacity = 0.35,
  scaleFrom = 1.02,
  scaleTo = 1.07,
}) {
  const opacityAnim = useRef(new Animated.Value(minOpacity)).current;
  const scaleAnim = useRef(new Animated.Value(scaleFrom)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: maxOpacity,
            duration: pulseDuration,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: scaleTo,
            duration: pulseDuration,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: minOpacity,
            duration: pulseDuration,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: scaleFrom,
            duration: pulseDuration,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [opacityAnim, scaleAnim, pulseDuration, minOpacity, maxOpacity, scaleFrom, scaleTo]);

  return (
    <View style={[style, styles.container]}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius,
            backgroundColor: glowColor,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});