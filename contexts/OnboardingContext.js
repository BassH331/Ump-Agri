import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const storage = {
  get: async (key) => {
    if (isWeb) return Promise.resolve(localStorage.getItem(key));
    return SecureStore.getItemAsync(key);
  },
  set: async (key, value) => {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  remove: async (key) => {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const STORAGE_KEY = 'onboarding_status';
const CURRENT_VERSION = '4';
const FORCE_REPLAY_EVERY_LAUNCH =
  __DEV__ && (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_FORCE_ONBOARDING !== 'false' : true);

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const value = await storage.get(STORAGE_KEY);
        if (!value) {
          setHasCompletedOnboarding(false);
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(value);
        } catch (_err) {
          parsed = value;
        }

        if (FORCE_REPLAY_EVERY_LAUNCH) {
          await storage.remove(STORAGE_KEY);
          setHasCompletedOnboarding(false);
        } else if (parsed && typeof parsed === 'object') {
          if (parsed.version === CURRENT_VERSION) {
            setHasCompletedOnboarding(Boolean(parsed.completed));
          } else {
            await storage.remove(STORAGE_KEY);
            setHasCompletedOnboarding(false);
          }
        } else if (parsed === 'true') {
          // Legacy completion flag – reset so users see the new guide
          await storage.remove(STORAGE_KEY);
          setHasCompletedOnboarding(false);
        } else {
          setHasCompletedOnboarding(false);
        }
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    try {
      const payload = JSON.stringify({ version: CURRENT_VERSION, completed: true });
      await storage.set(STORAGE_KEY, payload);
    } catch (error) {
      console.warn('[Onboarding] Failed to persist onboarding completion', error);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(false);
    try {
      await storage.remove(STORAGE_KEY);
    } catch (error) {
      console.warn('[Onboarding] Failed to reset onboarding state', error);
    }
  }, []);

  const value = useMemo(
    () => ({ hasCompletedOnboarding, loading, completeOnboarding, resetOnboarding }),
    [hasCompletedOnboarding, loading, completeOnboarding, resetOnboarding],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
