export const typographyTokens = {
  // Medical-optimized font families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    medical: ['Inter', 'Roboto', 'system-ui', 'sans-serif'], // Optimized for medical data
  },

  // Healthcare-specific font sizes
  fontSize: {
    'xs': ['0.75rem', { lineHeight: '1rem' }], // 12px - Small labels
    'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px - Body text
    'base': ['1rem', { lineHeight: '1.5rem' }], // 16px - Default
    'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px - Large text
    'xl': ['1.25rem', { lineHeight: '1.75rem' }], // 20px - Subheadings
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px - Headings
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - Large headings
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px - Display headings
    // Medical-specific sizes
    'vital': ['3rem', { lineHeight: '1' }], // 48px - Vital signs display
    'medical': ['2.5rem', { lineHeight: '1.2' }], // 40px - Medical data display
  },

  // Medical font weights
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    // Medical-specific
    medical: '600', // Slightly bolder for medical data
    diagnostic: '700', // Bold for diagnostic results
  },

  // Letter spacing for medical readability
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    // Medical-specific
    medical: '0.01em', // Slightly increased for readability
  },

  // Line height optimized for medical content
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
    // Medical-specific
    medical: '1.4', // Optimized for medical data
    readable: '1.6', // Enhanced readability
  }
};

export default typographyTokens;