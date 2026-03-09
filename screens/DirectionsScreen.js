// screens/DirectionsScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Text,
  Platform,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchCoordinateByName } from '../api/coordinates';
import * as Location from 'expo-location';
import { MapView, Marker, Polyline, Circle } from '../components/MapComponents';
import { getAccuracyRadius } from '../utils/geoVisuals';
import { useSettings } from '../contexts/SettingsContext';
// Campus routing removed: enforce OpenRouteService-only
import theme from '../utils/theme';
import { routeBetween } from '../utils/osmRouter';

class KalmanFilter {
  constructor(initialPos = 0, processNoise = 1e-8, measurementNoise = 1e-7) {
    this.x = [initialPos, 0];
    this.P = [[1e-6, 0], [0, 1e-6]];
    this.Q = [[processNoise / 2, 0], [0, processNoise]];
    this.R = measurementNoise;
    this.H = [1, 0];
  }
  predict(dt) {
    const F = [[1, dt], [0, 1]];
    const newX0 = this.x[0] + this.x[1] * dt;
    const newX1 = this.x[1];
    this.x = [newX0, newX1];
    const Ft = [[1, 0], [dt, 1]];
    const P00 = F[0][0] * (this.P[0][0] * F[0][0] + this.P[0][1] * F[1][0]) + F[0][1] * (this.P[1][0] * F[0][0] + this.P[1][1] * F[1][0]) + this.Q[0][0];
    const P01 = F[0][0] * (this.P[0][0] * Ft[0][1] + this.P[0][1] * Ft[1][1]) + F[0][1] * (this.P[1][0] * Ft[0][1] + this.P[1][1] * Ft[1][1]) + this.Q[0][1];
    const P10 = P01;
    const P11 = F[1][0] * (this.P[0][0] * Ft[0][1] + this.P[0][1] * Ft[1][1]) + F[1][1] * (this.P[1][0] * Ft[0][1] + this.P[1][1] * Ft[1][1]) + this.Q[1][1];
    this.P = [[P00, P01], [P10, P11]];
  }
  update(z, dt = 0.1) {
    this.predict(dt);
    const Hx = this.H[0] * this.x[0] + this.H[1] * this.x[1];
    const y = z - Hx;
    const S = this.P[0][0] * this.H[0]**2 + 2 * this.P[0][1] * this.H[0] * this.H[1] + this.P[1][1] * this.H[1]**2 + this.R;
    const K0 = (this.P[0][0] * this.H[0] + this.P[1][0] * this.H[1]) / S;
    const K1 = (this.P[0][1] * this.H[0] + this.P[1][1] * this.H[1]) / S;
    const K = [K0, K1];
    this.x[0] += K[0] * y;
    this.x[1] += K[1] * y;
    const KH0 = K[0] * this.H[0];
    const KH1 = K[0] * this.H[1];
    const IKH00 = 1 - KH0;
    const IKH01 = -KH1;
    const IKH10 = 0;
    const IKH11 = 1;
    const newP00 = IKH00 * this.P[0][0] + IKH01 * this.P[1][0];
    const newP01 = IKH00 * this.P[0][1] + IKH01 * this.P[1][1];
    const newP10 = IKH10 * this.P[0][0] + IKH11 * this.P[1][0];
    const newP11 = IKH10 * this.P[0][1] + IKH11 * this.P[1][1];
    this.P = [[newP00, newP01], [newP10, newP11]];
  }
  getPosition() { return this.x[0]; }
  getVelocity() { return this.x[1]; }
}

export default function DirectionsScreen({ route }) {
  const navigation = useNavigation();
  const { destination } = route.params;
  const parseNum = (v) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return typeof n === 'number' && !isNaN(n) ? n : null;
  };
  const latNum = parseNum(destination?.latitude);
  const lngNum = parseNum(destination?.longitude);
  const destCoords = (latNum != null && lngNum != null)
    ? { latitude: latNum, longitude: lngNum }
    : null;
  const mapRef = useRef(null);
  const apiTimeout = useRef(null);
  const speedAvgRef = useRef(0);
  const lastLocRef = useRef({ lat: null, lon: null, t: 0 });
  const { autoZoom, mapViewType, showBuildingNames } = useSettings();

  // Get screen dimensions
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Animation values for draggable panel
  const panelPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [panelVisible, setPanelVisible] = useState(true);

  // Combined state for better performance
  const [state, setState] = useState({
    isNavigating: false,
    isFollowingUser: false,
    userLocation: null,
    stableUserLocation: null,
    coords: destCoords,
    routingSource: null,
    routingStatus: null,
    routingError: null,
    routeCoordinates: [],
    routeTotalDistance: null,
    routeTotalDuration: null,
    etaSeconds: null,
    destinationLock: true,
    heading: 0,
    isCompassMode: false,
    region: destCoords
      ? { latitude: destCoords.latitude, longitude: destCoords.longitude, latitudeDelta: 0.002, longitudeDelta: 0.002 }
      : null,
    // Selected travel mode; route geometry remains the same
    travelMode: 'walk',
    notice: null,
    // Campus options removed
  });

  const routeCacheRef = useRef([]);
  const kfLat = useRef(null);
  const kfLon = useRef(null);
  const kfAlt = useRef(null);
  const prevTimestampRef = useRef(0);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  useEffect(() => {
    if (state.coords && state.destinationLock) {
      isProgrammaticRegionChange.current = true;
      lastProgrammaticRegionChangeAt.current = Date.now();
      setState(prev => ({
        ...prev,
        region: {
          latitude: state.coords.latitude,
          longitude: state.coords.longitude,
          latitudeDelta: prev.region?.latitudeDelta ?? 0.002,
          longitudeDelta: prev.region?.longitudeDelta ?? 0.002,
        }
      }));
    }
  }, [state.coords, state.destinationLock]);

  // Guard to avoid recursive region updates
  const isProgrammaticRegionChange = useRef(false);
  const lastProgrammaticRegionChangeAt = useRef(0);
  const accuracyWarnAt = useRef(0);
  const isRegionDifferent = (a, b) => {
    if (!a || !b) return true;
    const eps = 1e-6;
    return (
      Math.abs(a.latitude - b.latitude) > eps ||
      Math.abs(a.longitude - b.longitude) > eps ||
      Math.abs(a.latitudeDelta - b.latitudeDelta) > eps ||
      Math.abs(a.longitudeDelta - b.longitudeDelta) > eps
    );
  };
  // Memoized distance calculation
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1000);
  }, []);

  const formatEta = (seconds) => {
    if (seconds == null) return 'Calculating...';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hours}h ${rem}m`;
  };

  // Removed auto-start; user must press Start to draw the route

  // Polyline decoder for Google Directions API
  const decodePolyline = useCallback((encoded) => {
    if (!encoded || typeof encoded !== 'string') return [];
    let points = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;
      shift = 0; result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }, []);

  // Helpers to work with the route polyline for accurate remaining distance
  const haversineMeters = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const findNearestIndexOnRoute = useCallback((routePts, lat, lon) => {
    if (!routePts || routePts.length === 0) return -1;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < routePts.length; i++) {
      const d = haversineMeters(lat, lon, routePts[i].latitude, routePts[i].longitude);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, [haversineMeters]);

  const bearingDegrees = useCallback((lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => deg * Math.PI / 180;
    const toDeg = (rad) => rad * 180 / Math.PI;
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
              Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  }, []);

  const sumPolylineDistanceFrom = useCallback((routePts, startIdx) => {
    if (!routePts || routePts.length <= 1 || startIdx < 0) return 0;
    let sum = 0;
    for (let i = startIdx; i < routePts.length - 1; i++) {
      const a = routePts[i];
      const b = routePts[i + 1];
      sum += haversineMeters(a.latitude, a.longitude, b.latitude, b.longitude);
    }
    return sum;
  }, [haversineMeters]);



  // PanResponder for draggable navigation panel
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        panelPosition.setOffset({
          x: panelPosition.x._value,
          y: panelPosition.y._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: panelPosition.x, dy: panelPosition.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        panelPosition.flattenOffset();
        
        // Snap to edges if dragged too far
        const { x, y } = gestureState;
        let finalX = panelPosition.x._value;
        let finalY = panelPosition.y._value;
        
        // Keep panel within screen bounds
        const panelWidth = screenWidth - 40; // Account for margins
        const panelHeight = 200; // Approximate panel height
        
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

  useFocusEffect(
  useCallback(() => {
    let isActive = true;
    
    const loadData = async () => {
      try {
        // Prefer provided destination coordinates; otherwise fetch by name
        let coords = null;
        if (destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number') {
          coords = { latitude: destination.latitude, longitude: destination.longitude };
        } else {
          coords = await fetchCoordinateByName(destination.name);
        }

        if (isActive) {
          setState(prev => ({
            ...prev,
            coords,
            loading: false,
            region: coords
              ? {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.002,
                  longitudeDelta: 0.002,
                }
              : prev.region, // Keep previous region if coords not found
            notice: coords ? null : `Coordinates not found for ${destination.name}`,
          }));
        }

        if (!coords) {
          console.log(`Coordinates not found for ${destination.name}`);
        }

      } catch (err) {
        if (isActive) {
          setState(prev => ({ ...prev, loading: false }));
          console.error('❌ Failed to load coordinates:', err);
          Alert.alert('Error', 'Failed to load destination coordinates. Please try again.');
        }
      }
    };

    loadData();
    
    // Cleanup function for this effect
    return () => { 
      isActive = false; 
    };
  }, [destination.name])
);


  // Location handling with optimized updates and proper cleanup
  useEffect(() => {
    let watcher;
    let headingSub;
    let isMounted = true;
    
    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Less aggressive than BestForNavigation
          timeout: 10000, // 10 second timeout
        });

        if (!isMounted) return;

        const degToMeters = 111000;
        const initialR = (location.coords.accuracy / degToMeters) ** 2;
        kfLat.current = new KalmanFilter(location.coords.latitude, 1e-8, initialR);
        kfLon.current = new KalmanFilter(location.coords.longitude, 1e-8, initialR);
        kfAlt.current = new KalmanFilter(location.coords.altitude || 0, 1e-8, initialR * 10);
        prevTimestampRef.current = location.timestamp || Date.now();
        const smLat0 = kfLat.current.getPosition();
        const smLon0 = kfLon.current.getPosition();
        const smAlt0 = kfAlt.current.getPosition();
        const smAcc0 = Math.max(location.coords.accuracy, Math.sqrt(kfLat.current.P[0][0]) * degToMeters);
        // Mark programmatic change before updating region
        isProgrammaticRegionChange.current = true;
        lastProgrammaticRegionChangeAt.current = Date.now();
        setState(prev => ({
          ...prev,
          userLocation: { latitude: smLat0, longitude: smLon0, altitude: smAlt0 },
          accuracy: smAcc0,
          stableUserLocation: { latitude: smLat0, longitude: smLon0, altitude: smAlt0 },
          region: (prev.isFollowingUser && !prev.destinationLock)
            ? {
                latitude: smLat0,
                longitude: smLon0,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
              }
            : prev.region,
        }));

        // Start heading sensor; fallback to movement-derived heading
        try {
          headingSub = await Location.watchHeadingAsync((h) => {
            if (!isMounted) return;
            const deg = typeof h.trueHeading === 'number' && !isNaN(h.trueHeading)
              ? h.trueHeading
              : (typeof h.magHeading === 'number' ? h.magHeading : null);
            if (deg != null && typeof deg === 'number' && isFinite(deg)) {
              setState(prev => ({ ...prev, heading: Math.round(deg) }));
            }
          });
        } catch {}

        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 10,
          },
          (newLocation) => {
            if (!isMounted) return;
            
            try {
              const { coords } = newLocation;
              const dt = prevTimestampRef.current ? ((newLocation.timestamp || Date.now()) - prevTimestampRef.current) / 1000 : 0.1;
              prevTimestampRef.current = newLocation.timestamp || Date.now();
              const rawAcc = typeof coords.accuracy === 'number' ? coords.accuracy : 25;
              const degToMeters2 = 111000;
              const currentR = (rawAcc / degToMeters2) ** 2;
              if (kfLat.current && kfLon.current && kfAlt.current) {
                kfLat.current.R = currentR;
                kfLon.current.R = currentR;
                kfAlt.current.R = currentR * 10;
                kfLat.current.update(coords.latitude, dt);
                kfLon.current.update(coords.longitude, dt);
                kfAlt.current.update(coords.altitude || 0, dt);
              }
              const smLat = kfLat.current ? kfLat.current.getPosition() : coords.latitude;
              const smLon = kfLon.current ? kfLon.current.getPosition() : coords.longitude;
              const smAlt = kfAlt.current ? kfAlt.current.getPosition() : (coords.altitude || 0);
              const kfUnc = kfLat.current ? Math.sqrt(kfLat.current.P[0][0]) * degToMeters2 : rawAcc;
              const smAcc = Math.max(rawAcc, kfUnc);
              setState(prev => {
                if (!prev.coords || !prev.userLocation) return prev;
                
                const movementDistance = calculateDistance(
                  smLat,
                  smLon,
                  prev.userLocation.latitude,
                  prev.userLocation.longitude
                );

                const isStationary = !coords.speed || coords.speed < 0.5;
                const jitter = Math.max((rawAcc || 20) * 2, 30);
                if (isStationary && movementDistance < jitter) {
                  return prev;
                }
                
                const distance = calculateDistance(
                  smLat,
                  smLon,
                  prev.coords.latitude,
                  prev.coords.longitude
                );

                // Compute remaining distance along the fetched route polyline for accuracy
                let remainingMeters = distance;
                if (prev.routeCoordinates && prev.routeCoordinates.length > 1) {
                  const nearestIdx = findNearestIndexOnRoute(prev.routeCoordinates, smLat, smLon);
                  if (nearestIdx >= 0) {
                    const nearestPt = prev.routeCoordinates[nearestIdx];
                    const toPolyline = haversineMeters(smLat, smLon, nearestPt.latitude, nearestPt.longitude);
                    const alongRoute = sumPolylineDistanceFrom(prev.routeCoordinates, nearestIdx);
                    remainingMeters = Math.round(toPolyline + alongRoute);
                  }
                }

                const now = Date.now();
                let derivedKmh = 0;
                if (lastLocRef.current && lastLocRef.current.t) {
                  const dt = (now - lastLocRef.current.t) / 1000;
                  const dist = calculateDistance(
                    smLat,
                    smLon,
                    lastLocRef.current.lat ?? coords.latitude,
                    lastLocRef.current.lon ?? coords.longitude
                  );
                  const mps = dt > 0 ? dist / dt : 0;
                  derivedKmh = mps * 3.6;
                }
                lastLocRef.current = { lat: smLat, lon: smLon, t: now };
                const rawKmh = coords.speed ? coords.speed * 3.6 : 0;
                const trustedKmh = (rawAcc && rawAcc <= 20 && movementDistance >= jitter && rawKmh >= 0.5)
                  ? rawKmh
                  : 0;
                const speedKmh = Math.max(trustedKmh, derivedKmh >= 0.5 ? derivedKmh : 0);
                speedAvgRef.current = 0.7 * speedAvgRef.current + 0.3 * speedKmh;
                const next = {
                  ...prev,
                  userLocation: { latitude: smLat, longitude: smLon, altitude: smAlt },
                  accuracy: smAcc,
                  speed: Math.round(speedAvgRef.current),
                  distance: remainingMeters,
                };

                // Update heading from movement if sensor unavailable
                if (lastLocRef.current && lastLocRef.current.lat != null && lastLocRef.current.lon != null) {
                  const brng = bearingDegrees(lastLocRef.current.lat, lastLocRef.current.lon, smLat, smLon);
                  if (!isNaN(brng)) {
                    next.heading = Math.round(brng);
                  }
                }

                const isWalking = (!isStationary && movementDistance > jitter) || (speedAvgRef.current >= 1.0);
                const hasGoodAccuracy = rawAcc && rawAcc <= 20;
                if (isWalking && hasGoodAccuracy) {
                  next.stableUserLocation = { latitude: smLat, longitude: smLon, altitude: smAlt };
                }

                // Compute ETA using current speed (m/s) with mode-based fallback
                const speedMps = coords.speed || 0;
                const isDriving = prev.travelMode === 'drive';
                const WALK_MPS = 1.389; // ~5 km/h
                const CAR_MPS = 13.9;   // ~50 km/h fallback
                const threshold = isDriving ? 6 : 0.5; // require higher speed to trust GPS for driving
                const effectiveSpeedMps = speedMps >= threshold ? speedMps : (isDriving ? CAR_MPS : WALK_MPS);
                let etaSec = null;
                if (remainingMeters > 0) {
                  if (prev.routeTotalDistance && prev.routeTotalDuration && prev.routeTotalDistance > 0) {
                    // Scale official route duration by remaining distance ratio
                    const ratio = Math.min(1, remainingMeters / prev.routeTotalDistance);
                    etaSec = Math.round(prev.routeTotalDuration * ratio);
                  } else if (effectiveSpeedMps > 0) {
                    etaSec = Math.round(remainingMeters / effectiveSpeedMps);
                  }
                } else if (prev.routeTotalDuration) {
                  etaSec = Math.round(prev.routeTotalDuration);
                }
                next.etaSeconds = etaSec;

                const ARRIVAL_THRESHOLD_METERS = 20;
                if (
                  prev.isNavigating &&
                  typeof remainingMeters === 'number' &&
                  remainingMeters <= ARRIVAL_THRESHOLD_METERS &&
                  hasGoodAccuracy
                ) {
                  next.isNavigating = false;
                  next.routeCoordinates = [];
                  next.etaSeconds = null;
                  Alert.alert(
                    '🎉 Destination Reached!',
                    `You have arrived at ${destination.name}`,
                    [{ text: 'OK' }]
                  );
                }

                // Update map region when follow-user is enabled and auto-zoom is on
                if (prev.isFollowingUser && !prev.destinationLock && autoZoom && isWalking && hasGoodAccuracy) {
                  next.region = {
                    latitude: smLat,
                    longitude: smLon,
                    latitudeDelta: prev.region.latitudeDelta,
                    longitudeDelta: prev.region.longitudeDelta,
                  };
                  // Mark programmatic change before updating region
                  isProgrammaticRegionChange.current = true;
                  lastProgrammaticRegionChangeAt.current = Date.now();
                }

                // Update latest accuracy so routing can gate on it
                next.accuracy = smAcc;
                return next;
              });
            } catch (error) {
              console.error('Error processing location update:', error);
            }
          }
        );

      } catch (error) {
        console.error('Location initialization error:', error);
        if (isMounted) {
          Alert.alert('Location Error', 'Unable to access location services. Please check your permissions.');
        }
      }
    };

    startWatching();

    // Cleanup function
    return () => {
      isMounted = false;
      if (watcher && watcher.remove) {
        try {
          watcher.remove();
        } catch (error) {
          console.error('Error removing location watcher:', error);
        }
      }
      if (headingSub && headingSub.remove) {
        try {
          headingSub.remove();
        } catch {}
      }
    };
  }, [calculateDistance]);

  useEffect(() => {
    if (!state.isCompassMode) return;
    const center = state.stableUserLocation || state.userLocation;
    if (!center || !mapRef.current) return;
    try {
      isProgrammaticRegionChange.current = true;
      lastProgrammaticRegionChangeAt.current = Date.now();
      mapRef.current.animateCamera({
        center: { latitude: center.latitude, longitude: center.longitude },
        heading: state.heading,
      }, { duration: 250 });
    } catch (e) {}
  }, [state.isCompassMode, state.heading, state.stableUserLocation, state.userLocation]);

  // Navigation functions with improved error handling
  const getRoute = useCallback(async (originLoc) => {
    if (isFetchingRoute) return;
    const originLocation = originLoc || state.userLocation;
    if (!originLocation || !state.coords) {
      console.warn('Missing location data for route calculation');
      Alert.alert('Error', 'Location data not available. Please wait for GPS to initialize.');
      return;
    }

    if (typeof state.accuracy === 'number' && state.accuracy > 25) {
      setState(prev => ({ ...prev, routingStatus: 'Proceeding with current GPS fix', routingError: null }));
    }

    try {
      setIsFetchingRoute(true);
      // Clear any existing timeout
      if (apiTimeout.current) {
        clearTimeout(apiTimeout.current);
        apiTimeout.current = null;
      }

      // Show loading state without clearing current polyline to avoid flicker
      setState(prev => ({
        ...prev,
        isNavigating: true,
      }));
      const ORS_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImIzZWViY2NlODJhNWNkNDkwMGQzMTNhNmU1MDYzYzE2ZjFlNzgyNWRlYmRmNTg0M2IxZDgwNWNlIiwiaCI6Im11cm11cjY0In0=';
      if (state.travelMode === 'drive') {
        setState(prev => ({ ...prev, routingSource: 'OpenRouteService', routingStatus: 'Fetching route', routingError: null }));
        const resp = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_KEY}&start=${originLocation.longitude},${originLocation.latitude}&end=${state.coords.longitude},${state.coords.latitude}`);
        const data = await resp.json();
        if (data.features && data.features[0]) {
          const coordinates = data.features[0].geometry.coordinates.map(coord => ({ latitude: coord[1], longitude: coord[0] }));
          const props = data.features[0].properties || {};
          const summary = props.summary || (props.segments && props.segments[0]) || {};
          const totalDistance = typeof summary.distance === 'number' ? summary.distance : null;
          const totalDuration = typeof summary.duration === 'number' ? summary.duration : null;
          routeCacheRef.current = coordinates;
          setState(prev => ({
            ...prev,
            routingSource: 'OpenRouteService',
            routingStatus: 'Route received',
            routingError: null,
            routeCoordinates: coordinates,
            routeTotalDistance: totalDistance,
            routeTotalDuration: totalDuration,
          }));
          try {
            const hasRoute = coordinates && coordinates.length > 1;
            const hasLocs = originLocation && state.coords;
            let initialRemaining = null;
            if (hasRoute && hasLocs) {
              const nearestIdx = findNearestIndexOnRoute(coordinates, originLocation.latitude, originLocation.longitude);
              const nearestPt = nearestIdx >= 0 ? coordinates[nearestIdx] : null;
              const toPolyline = nearestPt ? haversineMeters(originLocation.latitude, originLocation.longitude, nearestPt.latitude, nearestPt.longitude) : 0;
              const alongRoute = sumPolylineDistanceFrom(coordinates, Math.max(0, nearestIdx));
              initialRemaining = Math.round(toPolyline + alongRoute);
            } else if (hasLocs) {
              initialRemaining = calculateDistance(originLocation.latitude, originLocation.longitude, state.coords.latitude, state.coords.longitude);
            }
            let initialEta = null;
            if (initialRemaining != null && initialRemaining > 0) {
              if (typeof totalDistance === 'number' && typeof totalDuration === 'number' && totalDistance > 0) {
                const ratio = Math.min(1, initialRemaining / totalDistance);
                initialEta = Math.round(totalDuration * ratio);
              }
            } else if (typeof totalDuration === 'number') {
              initialEta = Math.round(totalDuration);
            }
            if (initialRemaining != null || initialEta != null) {
              setState(prev => ({ ...prev, distance: initialRemaining ?? prev.distance, etaSeconds: initialEta ?? prev.etaSeconds }));
            }
          } catch (e) {}
        } else {
          throw new Error('No driving route found from OpenRouteService');
        }
      } else {
        setState(prev => ({ ...prev, routingSource: 'OpenRouteService', routingStatus: 'Fetching route', routingError: null }));
        const resp = await fetch(`https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${ORS_KEY}&start=${originLocation.longitude},${originLocation.latitude}&end=${state.coords.longitude},${state.coords.latitude}`);
        const data = await resp.json();
        if (data.features && data.features[0]) {
          const coordinates = data.features[0].geometry.coordinates.map(coord => ({ latitude: coord[1], longitude: coord[0] }));
          const props = data.features[0].properties || {};
          const summary = props.summary || (props.segments && props.segments[0]) || {};
          const totalDistance = typeof summary.distance === 'number' ? summary.distance : null;
          const totalDuration = typeof summary.duration === 'number' ? summary.duration : null;
          routeCacheRef.current = coordinates;
          setState(prev => ({
            ...prev,
            routingSource: 'OpenRouteService',
            routingStatus: 'Route received',
            routingError: null,
            routeCoordinates: coordinates,
            routeTotalDistance: totalDistance,
            routeTotalDuration: totalDuration,
          }));
          try {
            const hasRoute = coordinates && coordinates.length > 1;
            const hasLocs = originLocation && state.coords;
            let initialRemaining = null;
            if (hasRoute && hasLocs) {
              const nearestIdx = findNearestIndexOnRoute(coordinates, originLocation.latitude, originLocation.longitude);
              const nearestPt = nearestIdx >= 0 ? coordinates[nearestIdx] : null;
              const toPolyline = nearestPt ? haversineMeters(originLocation.latitude, originLocation.longitude, nearestPt.latitude, nearestPt.longitude) : 0;
              const alongRoute = sumPolylineDistanceFrom(coordinates, Math.max(0, nearestIdx));
              initialRemaining = Math.round(toPolyline + alongRoute);
            } else if (hasLocs) {
              initialRemaining = calculateDistance(originLocation.latitude, originLocation.longitude, state.coords.latitude, state.coords.longitude);
            }
            let initialEta = null;
            if (initialRemaining != null && initialRemaining > 0) {
              if (typeof totalDistance === 'number' && typeof totalDuration === 'number' && totalDistance > 0) {
                const ratio = Math.min(1, initialRemaining / totalDistance);
                initialEta = Math.round(totalDuration * ratio);
              }
            } else if (typeof totalDuration === 'number') {
              initialEta = Math.round(totalDuration);
            }
            if (initialRemaining != null || initialEta != null) {
              setState(prev => ({ ...prev, distance: initialRemaining ?? prev.distance, etaSeconds: initialEta ?? prev.etaSeconds }));
            }
          } catch (e) {}
        } else {
          throw new Error('No walking route found from OpenRouteService');
        }
      }

      // Use same route geometry for both modes; mode only affects ETA calculation
    } catch (error) {
      console.error('❌ Routing error:', { message: error.message, stack: error.stack });
      Alert.alert('Routing Error', 'Unable to fetch route. Please try again.');
      setState(prev => ({ ...prev, routingError: error.message, routingStatus: 'Routing failed' }));
    }
    finally {
      setIsFetchingRoute(false);
    }
  }, [destination, state.userLocation, state.coords, state.travelMode]);

  const startNavigation = useCallback(async () => {
    if (!state.coords) {
      Alert.alert('Error', 'Destination coordinates not available');
      return;
    }

    let current = state.userLocation;
    if (!current) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Error', 'Location permission not granted');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 7000 });
        current = loc.coords;
        setState(prev => ({ ...prev, userLocation: current, accuracy: current.accuracy }));
      } catch (e) {
        Alert.alert('Error', 'Current location not available. Please wait for GPS to initialize.');
        return;
      }
    }

    try {
      // Immediate response
      setState(prev => ({ ...prev, isNavigating: true, destinationLock: false, isFollowingUser: true, isCompassMode: true }));
      getRoute(current);

      // Check if we've arrived immediately
      const distance = calculateDistance(
        current.latitude,
        current.longitude,
        state.coords.latitude,
        state.coords.longitude
      );
      
      if (distance <= 20) {
        Alert.alert('🎉 Destination Reached!', `You're already at ${destination.name}`);
        setState(prev => ({ ...prev, isNavigating: false }));
      }
    } catch (error) {
      try {
        const origin = originLoc || state.userLocation;
        if (origin && state.coords) {
          const offline = await routeBetween(
            { latitude: origin.latitude, longitude: origin.longitude },
            { latitude: state.coords.latitude, longitude: state.coords.longitude }
          );
          const sumDist = (pts) => {
            let d = 0;
            for (let i = 1; i < pts.length; i++) {
              const a = pts[i-1];
              const b = pts[i];
              const R = 6371000;
              const toRad = (x) => x * Math.PI / 180;
              const dLat = toRad(b.latitude - a.latitude);
              const dLon = toRad(b.longitude - a.longitude);
              const lat1 = toRad(a.latitude);
              const lat2 = toRad(b.latitude);
              const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
              d += 2 * R * Math.asin(Math.sqrt(h));
            }
            return Math.round(d);
          };
          const distanceM = offline && offline.length > 1 ? sumDist(offline) : null;
          const walkSpeedMps = 1.25;
          const durationS = distanceM ? Math.round(distanceM / walkSpeedMps) : null;
          routeCacheRef.current = offline || [];
          setState(prev => ({
            ...prev,
            routingSource: 'Offline OSM',
            routingStatus: offline && offline.length > 1 ? 'Route received' : 'Routing failed',
            routingError: null,
            routeCoordinates: offline || [],
            routeTotalDistance: distanceM,
            routeTotalDuration: durationS,
            isNavigating: true,
          }));
          return;
        }
      } catch (offlineErr) {
        console.error('Offline routing error:', offlineErr);
      }
      console.error('Navigation start error:', error);
      Alert.alert('Error', 'Failed to start navigation. Please try again.');
    }
  }, [state.coords, state.userLocation, getRoute, calculateDistance, destination.name]);

  const stopNavigation = useCallback(() => {
    try {
      if (apiTimeout.current) {
        clearTimeout(apiTimeout.current);
        apiTimeout.current = null;
      }
      routeCacheRef.current = [];
      setState(prev => ({
        ...prev,
        isNavigating: false,
        routeCoordinates: [],
        routeTotalDistance: null,
        routeTotalDuration: null,
        etaSeconds: null,
        driveRouteTotalDistance: null,
        driveRouteTotalDuration: null,
        driveEtaSeconds: null,
      }));
    } catch (error) {
      console.error('Stop navigation error:', error);
    }
  }, []);

  // Campus cached route selection removed

  // Enhanced cleanup on unmount and focus changes
  useEffect(() => {
    return () => {
      try {
        if (apiTimeout.current) {
          clearTimeout(apiTimeout.current);
          apiTimeout.current = null;
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
  }, []);

  // Additional cleanup when component loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup when navigating away
        if (apiTimeout.current) {
          clearTimeout(apiTimeout.current);
          apiTimeout.current = null;
        }
      };
    }, [])
  );

  // Refetch route when travel mode changes to ensure mode-appropriate geometry
  useEffect(() => {
    if (state.isNavigating && state.coords) {
      getRoute();
    }
  }, [state.travelMode, state.coords]);

  // Optimized render methods
  // Removed GPS accuracy color helper; panel no longer displays accuracy

  if (state.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      {state.notice && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{state.notice}</Text>
        </View>
      )}

      {Platform.OS !== 'web' ? (
        <>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            region={state.region}
            showsUserLocation={false}
            followsUserLocation={false}
            showsMyLocationButton={true}
            showsCompass={true}
            rotateEnabled={true}
            minZoomLevel={14}
            maxZoomLevel={20}
            mapType={mapViewType}
            onRegionChangeComplete={(region) => {
            setState(prev => {
              // Ignore events shortly after programmatic changes
              if (isProgrammaticRegionChange.current || (Date.now() - lastProgrammaticRegionChangeAt.current) < 200) {
                isProgrammaticRegionChange.current = false;
                return prev;
              }
              let next = { ...prev };
              let changed = false;
              if (!prev.region || isRegionDifferent(prev.region, region)) {
                next.region = region;
                changed = true;
              }
              if (prev.userLocation) {
                const drift = calculateDistance(
                  region.latitude,
                  region.longitude,
                  prev.userLocation.latitude,
                  prev.userLocation.longitude
                );
                if (drift > 10 && prev.isFollowingUser) {
                  next.isFollowingUser = false;
                  changed = true;
                }
              }
              return changed ? next : prev;
            });
          }}
        >


          {state.coords && (
            <Marker
              coordinate={{
                latitude: state.coords.latitude,
                longitude: state.coords.longitude,
              }}
              title={showBuildingNames ? destination.name : undefined}
              description={showBuildingNames ? 'Your destination' : undefined}
              pinColor="red"
            />
          )}

          {(state.stableUserLocation || state.userLocation) && state.accuracy && (
            <>
              <Marker
                coordinate={{ latitude: (state.stableUserLocation || state.userLocation).latitude, longitude: (state.stableUserLocation || state.userLocation).longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: 'rgba(39,110,241,0.25)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(39,110,241,0.6)'
                  }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#276EF1' }} />
                  </View>
                  <View style={{
                    position: 'absolute',
                    top: -8,
                    transform: [{ rotate: `${state.heading}deg` }],
                  }}>
                    <View style={{
                      width: 0,
                      height: 0,
                      borderLeftWidth: 5,
                      borderRightWidth: 5,
                      borderBottomWidth: 10,
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                      borderBottomColor: '#276EF1',
                    }} />
                  </View>
                </View>
              </Marker>
              <Circle
                center={{ latitude: (state.stableUserLocation || state.userLocation).latitude, longitude: (state.stableUserLocation || state.userLocation).longitude }}
                radius={getAccuracyRadius(state.accuracy)}
                strokeColor="rgba(30,144,255,0.6)"
                fillColor="rgba(30,144,255,0.2)"
              />
            </>
          )}

          {(state.isNavigating && routeCacheRef.current && routeCacheRef.current.length > 1) && (
            <>
              <Polyline
                coordinates={routeCacheRef.current}
                strokeColor="#FF0000"
                strokeWidth={4}
              />

            </>
          )}

        </MapView>
        
          </>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 20 }}>
            🗺️ Map View
          </Text>
          <Text style={{ fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 10 }}>
            Destination: {destination.name}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            Maps are not available on web platform.{'\n'}
            Please use the mobile app for full navigation features.
          </Text>
        </View>
      )}

      {!state.isNavigating && state.coords && (
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={startNavigation}
          activeOpacity={0.8}
        >
          <Text style={styles.navigateButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      )}

      {state.isNavigating && panelVisible && (
        <>
          <Animated.View 
            style={[
              styles.navigationInfo,
              {
                transform: panelPosition.getTranslateTransform(),
              }
            ]}
            {...panResponder.panHandlers}
          >
          <View style={styles.panelHeader}>
            <Text style={styles.navigationTitle}>🧭 Navigating to: {destination.name}</Text>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, state.travelMode === 'walk' && styles.activeModeButton]}
                onPress={() => {
                  if (state.travelMode !== 'walk') {
                    setState(prev => ({ ...prev, travelMode: 'walk' }));
                  }
                }}
              >
                <Text style={styles.modeButtonLabel}>Walk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, state.travelMode === 'drive' && styles.activeModeButton]}
                onPress={() => {
                  if (state.travelMode !== 'drive') {
                    setState(prev => ({ ...prev, travelMode: 'drive' }));
                  }
                }}
              >
                <Text style={styles.modeButtonLabel}>Drive</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.hideButton}
              onPress={() => setPanelVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
            
            <View style={styles.navigationStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>
                  {state.distance ? `${state.distance}m` : 'Calculating...'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{state.travelMode === 'drive' ? 'Drive ETA' : 'Walk ETA'}</Text>
                <Text style={styles.statValue}>{formatEta(state.etaSeconds)}</Text>
              </View>
            </View>
            

            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopNavigation}
              activeOpacity={0.8}
            >
              <Text style={styles.stopButtonText}>Stop Navigation</Text>
            </TouchableOpacity>
          </Animated.View>

          
        </>
      )}

      {state.isNavigating && !panelVisible && (
        <TouchableOpacity
          style={styles.showPanelButton}
          onPress={() => setPanelVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      {/* Campus RoutePicker removed: ORS-only */}
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  notice: {
    position: 'absolute',
    top: 90,
    left: 20,
    right: 20,
    backgroundColor: '#FF7043',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  noticeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  navigateButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  navigateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
    backgroundColor: theme.colors.primaryGlass,
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
    backgroundColor: theme.colors.danger,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  realTimeStatus: {
    position: 'absolute',
    top: 90,
    left: 20,
    backgroundColor: theme.colors.dangerGlass,
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
  routingStatusBanner: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    zIndex: 996,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  routingStatusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  modeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  activeModeButton: {
    backgroundColor: theme.colors.primaryGlass,
    borderColor: theme.colors.primary,
  },
  modeButtonLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});