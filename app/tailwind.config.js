/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#0284C7',
          light: '#BAE6FD',
          dark: '#0369A1',
          foreground: '#FFFFFF',
        },
        // Secondary colors
        secondary: {
          DEFAULT: '#10B981',
          light: '#6EE7B7',
          foreground: '#FFFFFF',
        },
        // Accent
        accent: {
          DEFAULT: '#06B6D4',
          foreground: '#FFFFFF',
        },
        // Background - Nhạt, Content đậm
        background: {
          DEFAULT: '#E0F2FE',
          secondary: '#D1ECFD',
        },
        surface: '#BAE6FD',
        // Text colors
        text: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
        },
        // UI Elements
        border: '#93D5F8',
        input: '#BAE6FD',
        card: '#BAE6FD',
        // Status colors
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#06B6D4',
      },
    },
  },
  plugins: [],
};
