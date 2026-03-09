const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow bundling .osm files as assets
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'osm'];

// Exclude react-native-maps from web builds
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.alias = {
  ...(config.resolver.alias || {}),
};

// Add platform-specific resolver for web
if (process.env.EXPO_PLATFORM === 'web') {
  config.resolver.alias['react-native-maps'] = require.resolve('./components/MapComponentsWeb.js');
}

module.exports = config;