export { healthcareColorTokens, semanticColors } from './healthcare-colors';
export { typographyTokens } from './typography';
export { spacingTokens } from './spacing';
export { shadowTokens } from './shadows';

// Re-export defaults
import healthcareColorTokens from './healthcare-colors';
import typographyTokens from './typography';
import spacingTokens from './spacing';
import shadowTokens from './shadows';

export {
  healthcareColorTokens as default,
  typographyTokens,
  spacingTokens,
  shadowTokens
};

// Combined theme tokens for easy access
export const healthcareThemeTokens = {
  colors: healthcareColorTokens,
  semantic: semanticColors,
  typography: typographyTokens,
  spacing: spacingTokens,
  shadows: shadowTokens,
};