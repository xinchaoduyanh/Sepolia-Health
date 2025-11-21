/**
 * Centralized Color Theme for React Native App
 * Synchronized with Web theme
 */

const Colors = {
  light: {
    // Primary colors
    primary: '#0284C7',
    primaryLight: '#BAE6FD',
    primaryDark: '#0369A1',
    primaryForeground: '#FFFFFF',

    // Secondary colors
    secondary: '#10B981',
    secondaryLight: '#6EE7B7',
    secondaryForeground: '#FFFFFF',

    // Accent
    accent: '#06B6D4',
    accentForeground: '#FFFFFF',

    // Background - Nhạt, Content đậm
    background: '#E0F2FE',
    backgroundSecondary: '#D1ECFD',
    surface: '#BAE6FD',

    // Text
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',

    // UI Elements
    border: '#93D5F8',
    input: '#BAE6FD',
    card: '#BAE6FD',

    // Status
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#06B6D4',

    // Gradients (cho LinearGradient)
    gradientPrimary: ['#0284C7', '#06B6D4', '#10B981'],
    gradientSecondary: ['#0284C7', '#10B981'],
  },

  dark: {
    // Primary colors - Tối hơn cho dark theme
    primary: '#0EA5E9',
    primaryLight: '#BAE6FD',
    primaryDark: '#0C4A6E',
    primaryForeground: '#FFFFFF',

    // Secondary colors
    secondary: '#34D399',
    secondaryLight: '#A7F3D0',
    secondaryDark: '#065F46',
    secondaryForeground: '#FFFFFF',

    // Accent
    accent: '#22D3EE',
    accentForeground: '#FFFFFF',

    // Background
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    surface: '#1E293B',
    surfaceHover: '#273549',

    // Text
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // UI Elements
    border: '#334155',
    input: '#334155',
    card: '#1E293B',

    // Status
    success: '#22C55E',
    error: '#EF4444',
    warning: '#FBBF24',
    info: '#22D3EE',

    // Gradients (cho LinearGradient) - Sidebar gradient
    gradientPrimary: ['#1E293B', '#0C4A6E', '#065F46'],
    gradientSecondary: ['#0C4A6E', '#065F46'],
  },
} as const;

// Export default theme (Light)
export default Colors.light;

// Helper để get màu theo theme
export const getColors = (isDark: boolean = false) => {
  return isDark ? Colors.dark : Colors.light;
};

// Export Colors object
export { Colors };
