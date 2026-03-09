import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const AnimatedShape = ({ style }) => {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    const randomX = Math.random() * width;
    const randomY = Math.random() * height;
    position.setValue({ x: randomX, y: randomY });

    const duration = Math.random() * 4000 + 2000; // 2-6 seconds

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(position.y, {
          toValue: randomY - 20,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(position.y, {
          toValue: randomY,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, []);

  return <Animated.View style={[styles.shape, style, position.getLayout()]} />;
};

export default function ExploreScreen() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const fadeAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    fadeAnimation.start();

    return () => {
      pulseAnimation.stop();
      fadeAnimation.stop();
    };
  }, [scaleAnim, opacityAnim]);

  return (
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.container}>
      <AnimatedShape
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: "rgba(255, 255, 255, 0.3)",
        }}
      />
      <AnimatedShape
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          left: -40,
          top: height / 2,
        }}
      />
      <AnimatedShape
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          right: -15,
          top: height / 4,
        }}
      />
      <AnimatedShape
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          right: 20,
          bottom: 20,
        }}
      />

      <View style={styles.content}>
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}
        >
          <Ionicons name="construct-outline" size={100} color="white" />
        </Animated.View>
        <Text style={styles.title}>Coming Soon!</Text>
        <Text style={styles.subtitle}>
          We're working hard to bring you something amazing.
        </Text>
        <Text style={styles.subtitle}>Stay tuned!</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginTop: 20,
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  shape: {
    position: "absolute",
  },
});
