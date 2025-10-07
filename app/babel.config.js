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
        '@/contexts': './contexts',
        '@/components': './components',
        '@/types': './types',
      },
    },
  ]);

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
