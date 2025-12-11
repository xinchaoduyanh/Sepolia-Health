export const spacingTokens = {
  // Healthcare spacing system (based on 4px base unit)
  base: 0.25, // 4px
  unit: '0.25rem', // CSS variable

  // Named spacing for medical UI
  xs: '0.25rem',   // 4px - Tight spacing
  sm: '0.5rem',    // 8px - Small spacing
  md: '1rem',      // 16px - Standard spacing
  lg: '1.5rem',    // 24px - Large spacing
  xl: '2rem',      // 32px - Extra large
  '2xl': '3rem',   // 48px - Section spacing
  '3xl': '4rem',   // 64px - Page spacing

  // Medical-specific spacing
  medical: {
    tight: '0.375rem', // 6px - Compact medical forms
    standard: '0.75rem', // 12px - Medical form fields
    comfortable: '1.25rem', // 20px - Medical information sections
    spacious: '2.5rem', // 40px - Medical dashboard spacing
  },

  // Vital signs spacing
  vital: {
    card: '1.5rem',   // Vital signs card padding
    section: '2rem',  // Vital section spacing
    item: '1rem',     // Individual vital spacing
  },

  // Form spacing for medical forms
  form: {
    field: '1.5rem',   // Medical form field spacing
    section: '2.5rem', // Form section spacing
    group: '2rem',     // Form group spacing
  }
};

export default spacingTokens;