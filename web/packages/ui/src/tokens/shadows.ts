export const shadowTokens = {
  // Base shadow system
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',

  // Medical-specific shadows
  medical: {
    subtle: '0 2px 4px 0 rgb(0 0 0 / 0.03)',
    card: '0 4px 8px 0 rgb(0 0 0 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.1)',
    elevated: '0 8px 16px 0 rgb(0 0 0 / 0.08), 0 2px 6px 0 rgb(0 0 0 / 0.12)',
    floating: '0 16px 32px 0 rgb(0 0 0 / 0.1), 0 4px 12px 0 rgb(0 0 0 / 0.15)',
  },

  // Dark mode shadows
  dark: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6)',
  },

  // Colored shadows for medical indicators
  colored: {
    success: '0 4px 8px 0 rgb(16 185 129 / 0.15)',
    warning: '0 4px 8px 0 rgb(245 158 11 / 0.15)',
    error: '0 4px 8px 0 rgb(239 68 68 / 0.15)',
    info: '0 4px 8px 0 rgb(2 132 199 / 0.15)',
  },

  // Interactive shadows
  interactive: {
    hover: '0 8px 16px 0 rgb(0 0 0 / 0.12)',
    focus: '0 0 0 3px rgb(2 132 199 / 0.2)',
    active: '0 2px 4px 0 rgb(0 0 0 / 0.15)',
  }
};

export default shadowTokens;