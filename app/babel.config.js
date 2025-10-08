module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  plugins.push('react-native-reanimated/plugin');
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

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
