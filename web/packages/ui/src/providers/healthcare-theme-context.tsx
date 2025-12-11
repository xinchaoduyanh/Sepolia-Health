'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface HealthcareThemeConfig {
  // Accessibility preferences
  highContrastMode: boolean;
  reducedMotion: boolean;
  largeTextMode: boolean;

  // Healthcare-specific preferences
  emergencyMode: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  medicalDataHighlight: boolean;

  // Display preferences
  compactMode: boolean;
  showVitalAnimations: boolean;
  clinicalMode: boolean;
}

const HealthcareThemeContext = createContext<HealthcareThemeConfig & {
  updateConfig: (updates: Partial<HealthcareThemeConfig>) => void;
}>({
  highContrastMode: false,
  reducedMotion: false,
  largeTextMode: false,
  emergencyMode: false,
  colorBlindMode: 'none',
  medicalDataHighlight: true,
  compactMode: false,
  showVitalAnimations: true,
  clinicalMode: false,
  updateConfig: () => {},
});

export function useHealthcareTheme() {
  return useContext(HealthcareThemeContext);
}

interface HealthcareThemeProviderProps {
  children: React.ReactNode;
}

export function HealthcareThemeProvider({ children }: HealthcareThemeProviderProps) {
  const [config, setConfig] = useState<HealthcareThemeConfig>({
    highContrastMode: false,
    reducedMotion: false,
    largeTextMode: false,
    emergencyMode: false,
    colorBlindMode: 'none',
    medicalDataHighlight: true,
    compactMode: false,
    showVitalAnimations: true,
    clinicalMode: false,
  });

  // Detect system accessibility preferences
  useEffect(() => {
    const mediaQueries = {
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      largeText: window.matchMedia('(min-resolution: 120dpi)'),
    };

    const updateSystemPreferences = () => {
      setConfig(prev => ({
        ...prev,
        highContrastMode: mediaQueries.highContrast.matches,
        reducedMotion: mediaQueries.reducedMotion.matches,
        largeTextMode: mediaQueries.largeText.matches,
      }));
    };

    updateSystemPreferences();

    // Listen for preference changes
    const handleChange = updateSystemPreferences;
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', handleChange);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', handleChange);
      });
    };
  }, []);

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove all healthcare theme classes first
    root.classList.remove(
      'high-contrast',
      'reduce-motion',
      'large-text',
      'emergency-mode',
      'compact-mode',
      'clinical-mode',
      'color-blind-protanopia',
      'color-blind-deuteranopia',
      'color-blind-tritanopia'
    );

    // Apply current config classes
    if (config.highContrastMode) root.classList.add('high-contrast');
    if (config.reducedMotion) root.classList.add('reduce-motion');
    if (config.largeTextMode) root.classList.add('large-text');
    if (config.emergencyMode) root.classList.add('emergency-mode');
    if (config.compactMode) root.classList.add('compact-mode');
    if (config.clinicalMode) root.classList.add('clinical-mode');

    // Color blind mode
    if (config.colorBlindMode !== 'none') {
      root.classList.add(`color-blind-${config.colorBlindMode}`);
    }

    // Store config in localStorage
    localStorage.setItem('healthcare-theme-config', JSON.stringify(config));
  }, [config]);

  // Load saved config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('healthcare-theme-config');
    if (saved) {
      try {
        const savedConfig = JSON.parse(saved);
        setConfig(prev => ({ ...prev, ...savedConfig }));
      } catch (e) {
        console.warn('Failed to load healthcare theme config:', e);
      }
    }
  }, []);

  const updateConfig = (updates: Partial<HealthcareThemeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <HealthcareThemeContext.Provider value={{ ...config, updateConfig }}>
      {children}
    </HealthcareThemeContext.Provider>
  );
}