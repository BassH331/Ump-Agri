import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const storage = {
  get: async (key) => {
    if (isWeb) return Promise.resolve(localStorage.getItem(key));
    return SecureStore.getItemAsync(key);
  },
  set: async (key, value) => {
    if (isWeb) { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  remove: async (key) => {
    if (isWeb) { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

const DEFAULTS = { darkMode: false, autoZoom: true, showBuildingNames: true, mapViewType: 'satellite' };

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await storage.get('settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({ ...DEFAULTS, ...parsed });
        }
      } catch (_e) {
        // ignore restore errors
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const persist = async (next) => {
    setSettings(next);
    try {
      await storage.set('settings', JSON.stringify(next));
    } catch (_e) {
      // ignore persistence errors
    }
  };

  const setDarkMode = (v) => persist({ ...settings, darkMode: !!v });
  const setAutoZoom = (v) => persist({ ...settings, autoZoom: !!v });
  const setShowBuildingNames = (v) => persist({ ...settings, showBuildingNames: !!v });
  const setMapViewType = (v) => persist({ ...settings, mapViewType: v || DEFAULTS.mapViewType });

  const resetSettings = () => persist(DEFAULTS);

  const value = useMemo(() => ({
    ...settings,
    loading,
    setDarkMode,
    setAutoZoom,
    setShowBuildingNames,
    setMapViewType,
    resetSettings,
  }), [settings, loading]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}