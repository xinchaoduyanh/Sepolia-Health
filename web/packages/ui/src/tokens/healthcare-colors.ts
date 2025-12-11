export const healthcareColorTokens = {
  // Primary Medical Blues
  medical: {
    50: '#e0f2fe',
    100: '#bae6fd',
    200: '#7dd3fc',
    300: '#38bdf8',
    400: '#0ea5e9',
    500: '#0284c7', // Primary Medical Blue
    600: '#0369a1',
    700: '#075985',
    800: '#0c4a6e',
    900: '#164e63',
  },

  // Success Health Greens
  health: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Primary Health Green
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Clinical Warning Colors
  clinical: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Primary Clinical Orange
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Emergency/Critical Colors
  emergency: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Primary Emergency Red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Medical Purple for Special Indicators
  specialty: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Primary Medical Purple
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  }
};

export const semanticColors = {
  // Patient Status Colors
  patientStatus: {
    critical: healthcareColorTokens.emergency[500],
    serious: healthcareColorTokens.clinical[500],
    stable: healthcareColorTokens.health[500],
    recovering: healthcareColorTokens.medical[400],
    discharged: healthcareColorTokens.medical[300],
  },

  // Appointment Status Colors
  appointmentStatus: {
    scheduled: healthcareColorTokens.medical[500],
    confirmed: healthcareColorTokens.health[500],
    inProgress: healthcareColorTokens.clinical[500],
    completed: healthcareColorTokens.health[600],
    cancelled: healthcareColorTokens.emergency[500],
    noShow: healthcareColorTokens.medical[300],
  },

  // Medical Priority Colors
  priority: {
    urgent: healthcareColorTokens.emergency[500],
    high: healthcareColorTokens.clinical[500],
    medium: healthcareColorTokens.specialty[500],
    low: healthcareColorTokens.medical[500],
    routine: healthcareColorTokens.medical[300],
  },

  // Clinical Status Colors
  clinical: {
    positive: healthcareColorTokens.health[500],
    negative: healthcareColorTokens.medical[300],
    inconclusive: healthcareColorTokens.clinical[500],
    pending: healthcareColorTokens.specialty[400],
    abnormal: healthcareColorTokens.emergency[500],
    normal: healthcareColorTokens.health[500],
  }
};

export default healthcareColorTokens;