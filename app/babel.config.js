module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  plugins.push([
    'module:react-native-dotenv',
    { moduleName: '@env', path: '.env', allowUndefined: true },
  ]);
  plugins.push([
    'module-resolver',
    {
      root: ['./'],
      alias: {
        '@': './',
        '@/lib': './lib',
        '@/lib/api': './lib/api',
        '@/lib/hooks': './lib/hooks',
        '@/lib/utils': './lib/utils',
        '@/contexts': './contexts',
        '@/components': './components',
        '@/types': './types',
        '@/providers': './providers',
        '@/assets': './assets',
        '@/constants': './constants',
      },
    },
  ]);
  // react-native-reanimated/plugin MUST be listed last
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins,
  };
};
