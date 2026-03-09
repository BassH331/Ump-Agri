// components/MapComponents.js (Web fallback)
import React from 'react';
import { View, Text } from 'react-native';

// Web fallback components
const MapView = ({ children, style, ...props }) => (
  <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
    <Text style={{ fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 20 }}>
      🗺️ Map View
    </Text>
    <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
      Maps are not available on web platform.{'\n'}
      Please use the mobile app for full map features.
    </Text>
    {children}
  </View>
);

const Marker = () => null;
const Polyline = () => null;
const Circle = () => null;

export { MapView, Marker, Polyline, Circle };