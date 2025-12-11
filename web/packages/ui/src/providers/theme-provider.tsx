'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { HealthcareThemeProvider } from './healthcare-theme-context';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      storageKey="sepolia-health-theme"
      themes={[
        'light',
        'dark',
        'clinical',
        'emergency',
        'emergency-department',
        'pediatrics',
        'surgery',
        'cardiology',
        'radiology',
        'laboratory',
        'pharmacy',
        'night-shift'
      ]}
    >
      <HealthcareThemeProvider>
        {children}
      </HealthcareThemeProvider>
    </NextThemesProvider>
  );
}