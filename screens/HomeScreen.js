// screens/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  Text,
  ScrollView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { MapView, Marker, Polyline, Circle } from '../components/MapComponents';
import { getAccuracyRadius } from '../utils/geoVisuals';
import { useSearch } from '../contexts/SearchContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchAllCoordinates } from '../api/coordinates';
import { useSettings } from '../contexts/SettingsContext';
import NavigationPanel from '../components/NavigationPanel';
import { bestMatches, normalizeName } from '../utils/nameMatch';
import theme from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { routeBetween } from '../utils/osmRouter';

const CATEGORY_STYLES = {
  AcademicBlock: { color: '#1E88E5', label: 'Academic Block', icon: 'school' },
  Residences: { color: '#FBC02D', label: 'Residences', icon: 'home' },
  SportsComplex: { color: '#43A047', label: 'Sports Complex', icon: 'fitness' },
  Administration: { color: '#8E24AA', label: 'Admin Bins', icon: 'business' },
  FoodCourts: { color: '#FF7043', label: 'Food Bins', icon: 'restaurant' },
  Default: { color: '#999', label: 'Other Bins', icon: 'trash-bin' },
};

const FOOD_KEYWORDS_REGEX = /(cafeteria|dining\s?hall|dining|tuck\s?shop|tuckshop|restaurant|canteen|food|kitchen|coffee|snack)/i;
const ADMIN_KEYWORDS_REGEX = /(admin|administration|registry|office|student\s?affairs|admissions|finance|bursar)/i;
const LECTURE_KEYWORDS_REGEX = /(lecture|lectures|hall|auditorium|theatre|education)/i;
const LIBRARY_KEYWORDS_REGEX = /(library|archive|resource\s?center|media\s?center)/i;
const LAB_KEYWORDS_REGEX = /(computer\s?lab|ict|lab\b|labs\b|technology|it\b)/i;
const PARKING_KEYWORDS_REGEX = /(parking|car\s?park|parking\s?bay|bay\b|garage)/i;
const RESIDENCE_KEYWORDS_REGEX = /(residence|residences|hostel|hostels|dorm|dormitory|student\s?housing|accommodation|lodgings)/i;
const RES_ABBREV_REGEX = /\bres\b/i;
const KNOWN_RESIDENCE_NAMES = new Set([
  'letaba',
  'onderberg',
  'loskop',
  'deekap',
  'dee kap',
  'd-kap',
  'd kap',
  'dkp',
]);

const prettifyLabel = (value) => {
  if (typeof value !== 'string' || value.length === 0) return null;
  return value
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
};

const getCategoryMeta = (venue) => {
  const category = venue?.category;
  if (category && CATEGORY_STYLES[category]) {
    return CATEGORY_STYLES[category];
  }
  const name = venue?.name || '';
  const c = normalizeName(category || '');
  const n = normalizeName(name);
  if (KNOWN_RESIDENCE_NAMES.has(n) || c.includes('residence') || n.includes('residence') || RESIDENCE_KEYWORDS_REGEX.test(name) || RES_ABBREV_REGEX.test(name)) return CATEGORY_STYLES.Residences;
  if (c.includes('cafeteria') || n.includes('cafeteria') || FOOD_KEYWORDS_REGEX.test(name)) return CATEGORY_STYLES.FoodCourts;
  if (c.includes('administration') || n.includes('administration') || ADMIN_KEYWORDS_REGEX.test(name)) return CATEGORY_STYLES.Administration;
  if (c.includes('education') || n.includes('lecture') || LECTURE_KEYWORDS_REGEX.test(name) || c.includes('library') || n.includes('library') || LIBRARY_KEYWORDS_REGEX.test(name) || c.includes('laboratory') || n.includes('laboratory') || n.includes('technology') || LAB_KEYWORDS_REGEX.test(name)) return CATEGORY_STYLES.AcademicBlock;
  if (c.includes('parking') || n.includes('parking') || PARKING_KEYWORDS_REGEX.test(name) || n.includes('sport') || n.includes('gym') || n.includes('fitness')) return CATEGORY_STYLES.SportsComplex;
  const prettyLabel = prettifyLabel(category) || CATEGORY_STYLES.Default.label;
  return { ...CATEGORY_STYLES.Default, label: prettyLabel };
};

class KalmanFilter {
  constructor(initialPos = 0, processNoise = 1e-8, measurementNoise = 1e-7) {
    this.x = [initialPos, 0]; // [pos, vel]
    this.P = [[1e-6, 0], [0, 1e-6]]; // covariance
    this.Q = [[processNoise / 2, 0], [0, processNoise]]; // process noise
    this.R = measurementNoise; // measurement noise (scalar)
    this.H = [1, 0]; // observation model
  }

  predict(dt) {
    // State transition matrix F
    const F = [[1, dt], [0, 1]];
    // Predict state: x = F * x
    const newX0 = this.x[0] + this.x[1] * dt;
    const newX1 = this.x[1];
    this.x = [newX0, newX1];

    // Predict covariance: P = F * P * F^T + Q
    const Ft = [[1, 0], [dt, 1]];
    const P00 = F[0][0] * (this.P[0][0] * F[0][0] + this.P[0][1] * F[1][0]) + F[0][1] * (this.P[1][0] * F[0][0] + this.P[1][1] * F[1][0]) + this.Q[0][0];
    const P01 = F[0][0] * (this.P[0][0] * Ft[0][1] + this.P[0][1] * Ft[1][1]) + F[0][1] * (this.P[1][0] * Ft[0][1] + this.P[1][1] * Ft[1][1]) + this.Q[0][1];
    const P10 = P01; // symmetric
    const P11 = F[1][0] * (this.P[0][0] * Ft[0][1] + this.P[0][1] * Ft[1][1]) + F[1][1] * (this.P[1][0] * Ft[0][1] + this.P[1][1] * Ft[1][1]) + this.Q[1][1];
    this.P = [[P00, P01], [P10, P11]];
  }

  update(z, dt = 0.1) {
    this.predict(dt);

    // Innovation y = z - H * x
    const Hx = this.H[0] * this.x[0] + this.H[1] * this.x[1];
    const y = z - Hx;

    // Innovation covariance S = H * P * H^T + R
    const S = this.P[0][0] * this.H[0] ** 2 + 2 * this.P[0][1] * this.H[0] * this.H[1] + this.P[1][1] * this.H[1] ** 2 + this.R;

    // Kalman gain K = P * H^T / S
    const K0 = (this.P[0][0] * this.H[0] + this.P[1][0] * this.H[1]) / S;
    const K1 = (this.P[0][1] * this.H[0] + this.P[1][1] * this.H[1]) / S;
    const K = [K0, K1];

    // Update state: x = x + K * y
    this.x[0] += K[0] * y;
    this.x[1] += K[1] * y;

    // Update covariance: P = (I - K * H) * P
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

  getPosition() {
    return this.x[0];
  }

  getVelocity() {
    return this.x[1];
  }

  getUncertainty() {
    return Math.sqrt(this.P[0][0]);
  }
}

const averageLocation = (positions) => {
  if (positions.length === 0) return null;
  const avgLat = positions.reduce((sum, pos) => sum + pos.latitude, 0) / positions.length;
  const avgLng = positions.reduce((sum, pos) => sum + pos.longitude, 0) / positions.length;
  const avgAlt = positions.reduce((sum, pos) => sum + (pos.altitude || 0), 0) / positions.length;
  return { latitude: avgLat, longitude: avgLng, altitude: avgAlt, accuracy: positions[0]?.accuracy || null };
};

export default function HomeScreen() {
  const { searchQuery, setSearchQuery } = useSearch();
  const navigation = useNavigation();
  const route = useRoute();
  const { autoZoom, mapViewType, showBuildingNames } = useSettings();
  // Map rotation states
  const [mapHeading, setMapHeading] = useState(0);
  const [isHeadingUp, setIsHeadingUp] = useState(true);
  const [userHeading, setUserHeading] = useState(null);
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: -25.43652,
    longitude: 30.9818,
    latitudeDelta: 0.001,
    longitudeDelta: 0.001,
  });
  const [userLocation, setUserLocation] = useState(null);
  const userLocationRef = useRef(null);
  const [stableUserLocation, setStableUserLocation] = useState(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [venues, setVenues] = useState([]);
  const [panelVisible, setPanelVisible] = useState(true);
  const [routingSource, setRoutingSource] = useState(null);
  const [routingStatus, setRoutingStatus] = useState(null);
  const [routingError, setRoutingError] = useState(null);
  const [routeTotalDistance, setRouteTotalDistance] = useState(null);
  const [routeTotalDuration, setRouteTotalDuration] = useState(null);
  const [travelMode, setTravelMode] = useState('walk');
  const [etaSeconds, setEtaSeconds] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [lastStableTime, setLastStableTime] = useState(Date.now());  // New: Timestamp of last confirmed stable position
  const [recentPositions, setRecentPositions] = useState([]);  // New: Queue of last 3 positions for averaging
  const STATIONARY_TIMEOUT_MS = 5000;  // New: Require 5s of stability before trusting a new position
  const kfLat = useRef(null);
  const kfLon = useRef(null);
  const kfAlt = useRef(null);  // New: For 3D - altitude filter
  const prevTimestampRef = useRef(null);
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
  const [fetchError, setFetchError] = useState(null);
  // Load venues from API
  useEffect(() => {
    const loadVenues = async () => {
      try {
        const venueData = await fetchAllCoordinates();
        setVenues(venueData);
        setFetchError(null);
      } catch (error) {
        console.error('Error loading venues:', error);
        setVenues([]);
        setFetchError(error?.message || 'Failed to fetch venues');
      }
    };
    loadVenues();
  }, []);
  // Handle navigation from Education screen
  useEffect(() => {
    if (route.params?.startNavigation && route.params?.selectedVenue) {
      const venue = route.params.selectedVenue;
      startNavigation(venue);

      navigation.setParams({
        startNavigation: null,
        selectedVenue: null
      });
    }
  }, [route.params]);
  // Request location permission and start tracking
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access was denied. Enable it in settings.');
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });
        const { latitude, longitude, altitude, accuracy, timestamp } = location.coords;
        const locationData = { latitude, longitude, altitude: altitude || 0, accuracy, timestamp };
        // Initialize Kalman filters for 3D
        const degToMeters = 111000; // approx meters per degree
        const initialR = (accuracy / degToMeters) ** 2;
        kfLat.current = new KalmanFilter(latitude, 1e-8, initialR);
        kfLon.current = new KalmanFilter(longitude, 1e-8, initialR);
        kfAlt.current = new KalmanFilter(altitude || 0, 1e-8, initialR * 10); // Altitude noise typically higher
        prevTimestampRef.current = timestamp;
        const smoothedLat = kfLat.current.getPosition();
        const smoothedLon = kfLon.current.getPosition();
        const smoothedAlt = kfAlt.current.getPosition();
        const smoothedAccuracy = Math.max(accuracy, Math.sqrt(kfLat.current.P[0][0]) * degToMeters);
        const smoothedLocationData = { latitude: smoothedLat, longitude: smoothedLon, altitude: smoothedAlt, accuracy: smoothedAccuracy, timestamp };
        setUserLocation(smoothedLocationData);
        userLocationRef.current = smoothedLocationData;
        setStableUserLocation(smoothedLocationData);
        setLocationAccuracy(smoothedAccuracy);
        setLastStableTime(Date.now());
        setRecentPositions([smoothedLocationData]);
        isProgrammaticRegionChange.current = true;
        lastProgrammaticRegionChangeAt.current = Date.now();
        setRegion({ latitude: smoothedLat, longitude: smoothedLon, latitudeDelta: 0.002, longitudeDelta: 0.002 });
        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 10,  // Increased from 5 to ignore <10m jitters
          },
          (newLocation) => {
            const { latitude: newLat, longitude: newLng, altitude: newAlt, speed, accuracy: rawAccuracy, timestamp: newTimestamp } = newLocation.coords;
            const dt = prevTimestampRef.current ? (newTimestamp - prevTimestampRef.current) / 1000 : 0.1;
            prevTimestampRef.current = newTimestamp;
            const newLocationData = { latitude: newLat, longitude: newLng, altitude: newAlt || 0, accuracy: rawAccuracy, timestamp: newTimestamp };

            if (userLocationRef.current) {
              const movementDistance = calculateDistance(
                newLat, newLng, userLocationRef.current.latitude, userLocationRef.current.longitude
              );
              const isStationary = !speed || speed < 0.5;
              const jitter = Math.max((rawAccuracy || 20) * 2, 30);

              // Enhanced: Stronger stationary deadband
              if (isStationary) {
                const timeSinceStable = Date.now() - lastStableTime;
                if (movementDistance < jitter) {
                  return;
                }
                if (movementDistance < jitter * 0.8 && timeSinceStable > STATIONARY_TIMEOUT_MS) {
                  return;
                }
              } else {
                // Moving: Update freely, but still filter extreme jitter
                if (movementDistance < jitter * 0.6) {
                  return;
                }
              }
            }

            // Update Kalman with raw measurement for 3D
            const degToMeters = 111000;
            const currentR = (rawAccuracy / degToMeters) ** 2;
            kfLat.current.R = currentR;
            kfLon.current.R = currentR;
            kfAlt.current.R = currentR * 10; // Higher noise for altitude
            kfLat.current.update(newLat, dt);
            kfLon.current.update(newLng, dt);
            kfAlt.current.update(newAlt || 0, dt);

            // Get smoothed 3D position
            const smoothedLat = kfLat.current.getPosition();
            const smoothedLon = kfLon.current.getPosition();
            const smoothedAlt = kfAlt.current.getPosition();
            const kfUncertaintyMeters = Math.sqrt(kfLat.current.P[0][0]) * degToMeters;
            const smoothedAccuracy = Math.max(rawAccuracy, kfUncertaintyMeters);
            const smoothedLocationData = { latitude: smoothedLat, longitude: smoothedLon, altitude: smoothedAlt, accuracy: smoothedAccuracy, timestamp: newTimestamp };

            // Update location (now filtered and smoothed)
            setUserLocation(smoothedLocationData);
            userLocationRef.current = smoothedLocationData;
            setLocationAccuracy(smoothedAccuracy);

            // Update stable time on any accepted update
            setLastStableTime(Date.now());

            // Add averaging (optional, on top of KF)
            setRecentPositions(prev => {
              const updated = [...prev, smoothedLocationData].slice(-3);  // Keep last 3
              return updated;
            });

            const jitter = Math.max((rawAccuracy || 20) * 2, 30);
            // Enhanced speed: Include vertical component from KF
            const horizontalSpeedKmh = (speed && speed >= 0.5 && smoothedAccuracy <= 20 && userLocationRef.current && calculateDistance(smoothedLat, smoothedLon, userLocationRef.current.latitude, userLocationRef.current.longitude) >= jitter)
              ? Math.round(speed * 3.6)
              : Math.sqrt(
                (kfLat.current.getVelocity() * degToMeters / 3.6) ** 2 +
                (kfLon.current.getVelocity() * degToMeters * Math.cos(smoothedLat * Math.PI / 180) / 3.6) ** 2
              );
            const verticalSpeedKmh = Math.abs(kfAlt.current.getVelocity()) * 3.6; // m/s to km/h
            const currentKmh = Math.sqrt(horizontalSpeedKmh ** 2 + verticalSpeedKmh ** 2);
            setCurrentSpeed(currentKmh);
            if (isFollowingUser && autoZoom) {
              const movementDistance = userLocationRef.current ? calculateDistance(
                smoothedLat, smoothedLon, userLocationRef.current.latitude, userLocationRef.current.longitude
              ) : 10;

              const jitter = Math.max((rawAccuracy || 20) * 2, 30);
              const isWalking = (speed && speed >= 1.0) || (movementDistance >= jitter);
              const hasGoodAccuracy = rawAccuracy && rawAccuracy <= 20;
              if (!speed || speed < 0.5) {
                if (movementDistance > jitter && hasGoodAccuracy && (Date.now() - lastStableTime > 1000)) {  // New timeout
                  updateNavigationInfo(smoothedLocationData);
                  isProgrammaticRegionChange.current = true;
                  lastProgrammaticRegionChangeAt.current = Date.now();
                  setRegion(prevRegion => ({
                    ...prevRegion,
                    latitude: smoothedLat,
                    longitude: smoothedLon,
                  }));
                  setStableUserLocation(averageLocation(recentPositions));  // Use averaged instead of newLocationData
                }
              } else {
                if (isWalking && hasGoodAccuracy) {
                  updateNavigationInfo(smoothedLocationData);
                  isProgrammaticRegionChange.current = true;
                  lastProgrammaticRegionChangeAt.current = Date.now();
                  setRegion(prevRegion => ({
                    ...prevRegion,
                    latitude: smoothedLat,
                    longitude: smoothedLon,
                  }));
                  setStableUserLocation(averageLocation(recentPositions));  // Use averaged
                }
              }
            }
          }
        );
        setLocationWatcher(watcher);
      } catch (error) {
        console.log('Location error:', error);
        Alert.alert('Location Error', 'Could not get your location.');
      }
    })();
    return () => {
      if (locationWatcher && locationWatcher.remove) {
        locationWatcher.remove();
      }
    };
  }, [selectedVenue, isNavigating]);
  // Compass/Heading tracking
  useEffect(() => {
    let headingSubscription = null;
    const startHeadingUpdates = async () => {
      try {
        const isAvailable = await Location.hasServicesEnabledAsync();
        if (!isAvailable) return;
        headingSubscription = await Location.watchHeadingAsync((headingData) => {
          const { trueHeading, magHeading } = headingData;
          const heading = trueHeading >= 0 ? trueHeading : magHeading;

          setUserHeading(heading);

          if (isHeadingUp && isNavigating) {
            setMapHeading(heading);

            if (mapRef.current && mapRef.current.animateCamera) {
              mapRef.current.animateCamera({
                heading: heading,
                pitch: 0,
              }, { duration: 500 });
            }
          }
        });
      } catch (error) {
        console.log('Heading tracking error:', error);
      }
    };
    startHeadingUpdates();
    return () => {
      if (headingSubscription) {
        headingSubscription.remove();
      }
    };
  }, [isHeadingUp, isNavigating]);
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const filtered = bestMatches(searchQuery, venues, (v) => v.name || '');
    setSearchResults(filtered);
    setShowSearchResults(true);
  }, [searchQuery, venues]);
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };
  const decodePolyline = (encoded) => {
    if (!encoded || typeof encoded !== 'string') return [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const path = [];
    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;
      path.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return path;
  };
  const getRoute = async (destination) => {
    if (!userLocation) {
      Alert.alert('Error', 'User location not available');
      return;
    }
    try {
      if (typeof locationAccuracy === 'number' && locationAccuracy > 25) {
        setRoutingStatus('Proceeding with current GPS fix');
        setRoutingError(null);
      }
      const origin = `${userLocation.latitude},${userLocation.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBN0jCFJUFC9Y-iBLeMN6evtwztLHLfsHE';
      if (travelMode === 'drive') {
        if (!GOOGLE_API_KEY) {
          setRoutingError('Missing Google Maps API key (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)');
          setRoutingStatus('Routing failed');
          Alert.alert('Routing Error', 'Google Directions requires a valid API key.');
          return;
        }
        setRoutingSource('Google Maps');
        setRoutingStatus('Fetching route');
        setRoutingError(null);
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&mode=driving&key=${GOOGLE_API_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const poly = route.overview_polyline && route.overview_polyline.points;
          const coordinates = poly ? decodePolyline(poly) : [];
          let totalDistance = 0;
          let totalDuration = 0;
          const legs = route.legs || [];
          for (const leg of legs) {
            if (leg.distance && typeof leg.distance.value === 'number') totalDistance += leg.distance.value;
            if (leg.duration && typeof leg.duration.value === 'number') totalDuration += leg.duration.value;
          }
          setRouteTotalDistance(totalDistance || null);
          setRouteTotalDuration(totalDuration || null);
          console.log('🗺️ Received driving route from Google Directions');
          setRoutingSource('Google Maps');
          setRoutingStatus('Route received');
          setRoutingError(null);
          setRouteCoordinates(coordinates);
        } else {
          throw new Error('No driving route found from Google Directions');
        }
      } else {
        setRoutingSource('OpenRouteService');
        setRoutingStatus('Fetching route');
        setRoutingError(null);
        const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjY3MjZjZDdkY2M3ZjQ1ODViNGM5MzU2YTFlODk2NWM4IiwiaCI6Im11cm11cjY0In0=';
        const resp = await fetch(
          `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${ORS_API_KEY}&start=${userLocation.longitude},${userLocation.latitude}&end=${destination.longitude},${destination.latitude}`
        );
        const data = await resp.json();
        if (data.features && data.features[0]) {
          const coordinates = data.features[0].geometry.coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          const props = data.features[0].properties || {};
          const summary = props.summary || (props.segments && props.segments[0]) || {};
          const totalDistance = typeof summary.distance === 'number' ? summary.distance : null;
          const totalDuration = typeof summary.duration === 'number' ? summary.duration : null;
          setRouteTotalDistance(totalDistance);
          setRouteTotalDuration(totalDuration);
          console.log('🗺️ Received walking route from OpenRouteService');
          setRoutingSource('OpenRouteService');
          setRoutingStatus('Route received');
          setRoutingError(null);
          setRouteCoordinates(coordinates);
        } else {
          throw new Error('No walking route found from OpenRouteService');
        }
      }
    } catch (error) {
      try {
        const offline = await routeBetween(
          { latitude: userLocation.latitude, longitude: userLocation.longitude },
          { latitude: destination.latitude, longitude: destination.longitude }
        );
        const sumDist = (pts) => {
          let d = 0;
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1];
            const b = pts[i];
            const R = 6371000;
            const toRad = (x) => x * Math.PI / 180;
            const dLat = toRad(b.latitude - a.latitude);
            const dLon = toRad(b.longitude - a.longitude);
            const lat1 = toRad(a.latitude);
            const lat2 = toRad(b.latitude);
            const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
            d += 2 * R * Math.asin(Math.sqrt(h));
          }
          return Math.round(d);
        };
        const distanceM = offline && offline.length > 1 ? sumDist(offline) : null;
        const walkSpeedMps = 1.25;
        const durationS = distanceM ? Math.round(distanceM / walkSpeedMps) : null;
        setRoutingSource('Offline OSM');
        setRoutingStatus(offline && offline.length > 1 ? 'Route received' : 'Routing failed');
        setRoutingError(null);
        setRouteCoordinates(offline || []);
        setRouteTotalDistance(distanceM);
        setRouteTotalDuration(durationS);
        return;
      } catch (offlineErr) {
        console.error('Offline routing error:', offlineErr);
      }
      console.error('❌ Routing error:', { message: error.message, stack: error.stack });
      setRoutingError(error.message);
      setRoutingStatus('Routing failed');
      Alert.alert('Routing Error', 'Unable to fetch route. Please try again.');
    }
  };
  useEffect(() => {
    if (selectedVenue && isNavigating) {
      getRoute(selectedVenue);
    }
  }, [travelMode]);
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000;
    return distance;
  };
  const handleVenueSelect = (venue) => {
    setShowSearchResults(false);
    navigation.navigate('Directions', {
      destination: {
        name: venue.name,
        latitude: venue.latitude,
        longitude: venue.longitude,
        ...venue,
      },
    });
  };
  const updateNavigationInfo = (currentLocation) => {
    if (!selectedVenue) return;
    let routeRemaining = null;
    if (routeCoordinates && routeCoordinates.length > 1) {
      const haversineMeters = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < routeCoordinates.length; i++) {
        const d = haversineMeters(currentLocation.latitude, currentLocation.longitude, routeCoordinates[i].latitude, routeCoordinates[i].longitude);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      let sum = bestDist;
      for (let i = bestIdx; i < routeCoordinates.length - 1; i++) {
        const a = routeCoordinates[i];
        const b = routeCoordinates[i + 1];
        sum += haversineMeters(a.latitude, a.longitude, b.latitude, b.longitude);
      }
      routeRemaining = Math.round(sum);
    }
    const straightRemaining = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      selectedVenue.latitude,
      selectedVenue.longitude
    );
    const distance = routeRemaining ?? straightRemaining;
    setDistanceToDestination(distance);
    const speedMps = currentSpeed && currentSpeed > 0 ? (currentSpeed / 3.6) : 0;
    const WALK_MPS = 1.389;
    const CAR_MPS = 13.9;
    const walkSpeed = speedMps >= 0.5 ? speedMps : WALK_MPS;
    const driveSpeed = speedMps >= 6 ? speedMps : CAR_MPS;
    const selectedSpeed = travelMode === 'drive' ? driveSpeed : walkSpeed;
    let eta;
    if (distance != null && distance > 0) {
      if (routeTotalDistance && routeTotalDuration && routeTotalDistance > 0) {
        const ratio = Math.min(1, distance / routeTotalDistance);
        eta = Math.round(routeTotalDuration * ratio);
      } else if (selectedSpeed && selectedSpeed > 0) {
        eta = Math.round(distance / selectedSpeed);
      } else {
        eta = null;
      }
    } else if (routeTotalDuration) {
      eta = Math.round(routeTotalDuration);
    } else {
      eta = null;
    }
    setEtaSeconds(eta);
    const ARRIVAL_THRESHOLD_METERS = 20;
    const hasGoodAccuracy = typeof locationAccuracy === 'number' && locationAccuracy <= 25;
    if (
      isNavigating &&
      !hasArrived &&
      typeof distance === 'number' &&
      distance <= ARRIVAL_THRESHOLD_METERS &&
      hasGoodAccuracy
    ) {
      setHasArrived(true);
      setIsNavigating(false);
      setPanelVisible(true);
      Alert.alert(
        '🎉 Destination Reached!',
        `You have arrived at ${selectedVenue.name}`,
        [{ text: 'OK' }]
      );
      setRouteCoordinates([]);
      setEtaSeconds(null);
    }
  };
  const startNavigation = (venue) => {
    if (!venue?.latitude || !venue?.longitude) {
      Alert.alert("Invalid Location", "This venue doesn't have valid coordinates.");
      return;
    }
    setSelectedVenue(venue);
    setIsNavigating(true);
    setHasArrived(false);
    setShowSearchResults(false);
    clearSearch();
    getRoute(venue);
  };
  const stopNavigation = () => {
    setIsNavigating(false);
    setSelectedVenue(null);
    setRouteCoordinates([]);
    setDistanceToDestination(null);
    setRouteTotalDistance(null);
    setRouteTotalDuration(null);
    setEtaSeconds(null);
    setHasArrived(false);
    Alert.alert('Navigation Stopped', 'You have stopped navigation.');
  };
  const toggleMapOrientation = () => {
    setIsHeadingUp(prev => !prev);

    if (isHeadingUp) {
      setMapHeading(0);
      if (mapRef.current && mapRef.current.animateCamera) {
        mapRef.current.animateCamera({
          heading: 0,
          pitch: 0,
        }, { duration: 500 });
      }
    } else {
      if (userHeading !== null) {
        setMapHeading(userHeading);
        if (mapRef.current && mapRef.current.animateCamera) {
          mapRef.current.animateCamera({
            heading: userHeading,
            pitch: 0,
          }, { duration: 500 });
        }
      }
    }
  };
  const handleCategoryPress = (category) => {
    setPanelVisible(true);
    if (category === 'All') {
      setSearchResults(venues);
    } else {
      const filteredVenues = venues.filter(venue => {
        const meta = getCategoryMeta(venue);
        return meta.label === CATEGORY_STYLES[category]?.label;
      });
      setSearchResults(filteredVenues);
    }
  };
  const getAccuracyColor = () => {
    if (!locationAccuracy) return '#999';
    if (locationAccuracy <= 5) return '#4CAF50';
    if (locationAccuracy <= 15) return '#FFC107';
    return '#FF5722';
  };
  const retryLoadVenues = async () => {
    try {
      setFetchError(null);
      const venueData = await fetchAllCoordinates();
      setVenues(venueData);
    } catch (error) {
      console.error('Error loading venues:', error);
      setFetchError(error?.message || 'Failed to fetch venues');
    }
  };
  return (
    <View style={styles.container}>
      {Platform.OS !== 'web' ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation={false}
          followsUserLocation={false}
          showsMyLocationButton={true}
          minZoomLevel={14}
          maxZoomLevel={20}
          mapType={mapViewType}
          rotateEnabled={true}
          pitchEnabled={false}
          onRegionChangeComplete={(newRegion) => {
            if (isProgrammaticRegionChange.current || (Date.now() - lastProgrammaticRegionChangeAt.current) < 200) {
              isProgrammaticRegionChange.current = false;
              return;
            }
            if (isRegionDifferent(region, newRegion)) {
              setRegion(newRegion);
            }
            if (userLocation) {
              const drift = calculateDistance(
                newRegion.latitude,
                newRegion.longitude,
                userLocation.latitude,
                userLocation.longitude
              );
              if (drift > 10) {
                setIsFollowingUser(false);
              }
            }
          }}
        >
          {(searchResults.length > 0 ? searchResults : venues).map((venue, index) => {
            const lat = venue?.latitude;
            const lng = venue?.longitude;
            if (
              typeof lat !== 'number' ||
              typeof lng !== 'number' ||
              isNaN(lat) ||
              isNaN(lng)
            ) {
              return null;
            }
            const categoryMeta = getCategoryMeta(venue);
            const isSelected = selectedVenue?.name === venue.name;
            const iconColor = categoryMeta.color;
            const fillLevel = Math.floor(Math.random() * 100);
            const statusColor = fillLevel > 80 ? '#F44336' : (fillLevel > 50 ? '#FFEB3B' : '#4CAF50');

            return (
              <Marker
                key={venue._id || index}
                coordinate={{ latitude: lat, longitude: lng }}
                title={showBuildingNames ? venue.name : undefined}
                description={showBuildingNames ? `${categoryMeta.label} - ${fillLevel}% Full` : undefined}
                tracksViewChanges
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => handleVenueSelect(venue)}
                onCalloutPress={() => handleVenueSelect(venue)}
              >
                <View
                  style={[
                    styles.markerIconWrapper,
                    { borderColor: statusColor },
                    isSelected && styles.markerIconSelected,
                  ]}
                >
                  <Ionicons name="trash-outline" size={20} color={statusColor} />
                  <View style={[styles.markerLetterBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.markerLetter}>{fillLevel}%</Text>
                  </View>
                </View>
              </Marker>
            );
          })}
          {(stableUserLocation || userLocation) && locationAccuracy && (
            <>
              <Marker
                coordinate={{ latitude: (stableUserLocation || userLocation).latitude, longitude: (stableUserLocation || userLocation).longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.userMarkerOuter}>
                  <View style={styles.userMarkerInner} />
                </View>
              </Marker>
              <Circle
                center={{ latitude: (stableUserLocation || userLocation).latitude, longitude: (stableUserLocation || userLocation).longitude }}
                radius={getAccuracyRadius(locationAccuracy)}
                strokeColor="rgba(30,144,255,0.6)"
                fillColor="rgba(30,144,255,0.2)"
              />
            </>
          )}
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#FF0000"
              strokeWidth={5}
            />
          )}
        </MapView>
      ) : (
        <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 20 }}>
            🗺️ UMP Campus Map
          </Text>
          <Text style={{ fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 10 }}>
            {searchResults.length} locations available
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
            Maps are not available on web platform.{'\n'}
            Please use the mobile app for full map features.
          </Text>
        </View>
      )}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => handleCategoryPress('AcademicBlock')}
          >
            <Ionicons name="school" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.categoryButtonText}>Academic Block</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => handleCategoryPress('Residences')}
          >
            <Ionicons name="home" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.categoryButtonText}>Residences</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => handleCategoryPress('SportsComplex')}
          >
            <Ionicons name="fitness" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.categoryButtonText}>Sports Complex</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => handleCategoryPress('Administration')}
          >
            <Ionicons name="business" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.categoryButtonText}>Admin Bins</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => handleCategoryPress('FoodCourts')}
          >
            <Ionicons name="restaurant" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.categoryButtonText}>Food Courts</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      {/* Compass Button */}
      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.compassButton}
          onPress={toggleMapOrientation}
          activeOpacity={0.7}
        >
          <View style={[styles.compassIcon, { transform: [{ rotate: `${-mapHeading}deg` }] }]}>
            <Ionicons
              name="navigate"
              size={24}
              color={isHeadingUp ? theme.colors.primary : '#666'}
            />
          </View>
          <Text style={styles.compassText}>
            {isHeadingUp ? 'Heading' : 'North'}
          </Text>
        </TouchableOpacity>
      )}
      {/* Heading Indicator */}
      {isHeadingUp && userHeading !== null && Platform.OS !== 'web' && (
        <View style={styles.headingIndicator}>
          <Text style={styles.headingText}>
            {Math.round(userHeading)}°
          </Text>
        </View>
      )}
      {/* Accuracy Indicator */}
      {locationAccuracy && (
        <View style={[styles.accuracyIndicator, { backgroundColor: getAccuracyColor() }]}>
          <Text style={styles.accuracyText}>
            GPS: ±{Math.round(locationAccuracy)}m
          </Text>
        </View>
      )}
      {/* Altitude Indicator */}
      {(stableUserLocation || userLocation)?.altitude !== undefined && Platform.OS !== 'web' && (
        <View style={styles.altitudeIndicator}>
          <Text style={styles.altitudeText}>
            Alt: {((stableUserLocation || userLocation).altitude || 0).toFixed(1)}m
          </Text>
        </View>
      )}
      {/* Search Results */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <ScrollView>
            <Text style={styles.searchResultsHeader}>Search Results:</Text>
            {searchResults.map((venue, index) => (
              <View key={index} style={styles.searchResultContainer}>
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleVenueSelect(venue)}
                >
                  <Text style={styles.searchResultName}>{venue.name}</Text>
                  {userLocation && (
                    <Text style={styles.searchResultDistance}>
                      {Math.round(
                        calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          venue.latitude,
                          venue.longitude
                        )
                      )}m away
                    </Text>
                  )}
                  <Text style={styles.navigateHint}>Tap to navigate</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      {showSearchResults && searchResults.length === 0 && searchQuery.trim() !== '' && (
        <View style={styles.searchResults}>
          <Text style={styles.noResultsText}>No buildings found matching "{searchQuery}"</Text>
          <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Navigation Info Panel */}
      {selectedVenue && isNavigating && (
        <NavigationPanel
          visible={panelVisible}
          destinationName={selectedVenue.name}
          distance={distanceToDestination}
          speed={currentSpeed}
          etaSeconds={etaSeconds}
          travelMode={travelMode}
          onChangeMode={(mode) => setTravelMode(mode)}
          onStop={stopNavigation}
          onHide={() => setPanelVisible(false)}
          onShow={() => setPanelVisible(true)}
          liveBadge={true}
        />
      )}
      {/* Start Navigation CTA */}
      {selectedVenue && !isNavigating && (
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => startNavigation(selectedVenue)}
          activeOpacity={0.8}
        >
          <Text style={styles.navigateButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  categoryContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 10,
    paddingHorizontal: 5,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  categoryScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 6,
    minWidth: 100,
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  categoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  compassButton: {
    position: 'absolute',
    top: 140,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    zIndex: 998,
  },
  compassIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassText: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  headingIndicator: {
    position: 'absolute',
    top: 220,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 998,
  },
  headingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  accuracyIndicator: {
    position: 'absolute',
    top: 80,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
    zIndex: 999,
  },
  accuracyText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  altitudeIndicator: {
    position: 'absolute',
    top: 110,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
    zIndex: 999,
  },
  altitudeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  searchResults: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 8,
    zIndex: 999,
  },
  searchResultsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: '#333',
  },
  searchResultContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultItem: {
    padding: 15,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  searchResultDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  navigateHint: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 3,
    fontStyle: 'italic',
  },
  noResultsText: {
    padding: 20,
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  clearSearchButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
  },
  clearSearchText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  markerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerIconSelected: {
    transform: [{ scale: 1.1 }],
  },
  markerLetterBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  markerLetter: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  markerLetterDark: {
    color: '#1A237E',
    fontSize: 9,
    fontWeight: '700',
  },
  navigateButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.primaryGlass,
    borderRadius: 10,
    paddingVertical: 12,
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
    fontSize: 15,
  },
  userMarkerOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(39,110,241,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(39,110,241,0.6)'
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32'
  },
});