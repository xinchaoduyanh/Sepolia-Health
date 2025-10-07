// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

// Add alias support
config.resolver.alias = {
  '@': path.resolve(__dirname, '.'),
  '@/contexts': path.resolve(__dirname, 'contexts'),
  '@/components': path.resolve(__dirname, 'components'),
  '@/types': path.resolve(__dirname, 'types'),
};

module.exports = withNativeWind(config, { input: './global.css' });
