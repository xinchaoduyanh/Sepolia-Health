module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
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
      ],
      // react-native-reanimated/plugin MUST be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
