/**
 * Accessibility Utilities
 * Provides helpers for ARIA labels, keyboard navigation, and accessibility checks
 */

/**
 * Generates ARIA labels for medical status badges
 */
export const generateMedicalStatusLabel = (status: string, type?: string): string => {
  const statusLabels: Record<string, string> = {
    'critical': 'Critical condition',
    'serious': 'Serious condition',
    'stable': 'Stable condition',
    'improving': 'Improving condition',
    'worsening': 'Worsening condition',
    'normal': 'Normal',
    'abnormal': 'Abnormal',
    'attention': 'Attention required',
    'warning': 'Warning',
    'success': 'Success',
    'info': 'Information'
  };

  const baseLabel = statusLabels[status.toLowerCase()] || status;
  return type ? `${type}: ${baseLabel}` : baseLabel;
};

/**
 * Generates ARIA labels for vital signs
 */
export const generateVitalSignLabel = (vital: string, value: string | number, unit?: string, status?: string): string => {
  const vitalLabels: Record<string, string> = {
    'heartRate': 'Heart rate',
    'bloodPressure': 'Blood pressure',
    'temperature': 'Temperature',
    'oxygenSaturation': 'Oxygen saturation',
    'respiratoryRate': 'Respiratory rate',
    'glucose': 'Blood glucose',
    'weight': 'Weight',
    'height': 'Height',
    'bmi': 'Body mass index'
  };

  const label = vitalLabels[vital] || vital;
  const valueStr = `${value}${unit ? ` ${unit}` : ''}`;
  const statusStr = status ? `, ${generateMedicalStatusLabel(status)}` : '';

  return `${label}: ${valueStr}${statusStr}`;
};

/**
 * Generates ARIA labels for patient charts and data visualizations
 */
export const generateChartLabel = (title: string, type: string, dataPoints?: number): string => {
  const typeDescriptions: Record<string, string> = {
    'line': 'line chart',
    'bar': 'bar chart',
    'pie': 'pie chart',
    'area': 'area chart',
    'scatter': 'scatter plot'
  };

  const chartType = typeDescriptions[type] || 'chart';
  const dataInfo = dataPoints ? ` with ${dataPoints} data points` : '';

  return `${title}, ${chartType}${dataInfo}`;
};

/**
 * Generates ARIA labels for medication schedules
 */
export const generateMedicationLabel = (name: string, dosage: string, frequency: string, time?: string): string => {
  const timeStr = time ? ` at ${time}` : '';
  return `Medication: ${name}, ${dosage}, ${frequency}${timeStr}`;
};

/**
 * Keyboard navigation helpers
 */
export class KeyboardNavigation {
  /**
   * Trap focus within a container
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Check if element is focusable
   */
  static isFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    if (element.getAttribute('tabindex') === '-1') {
      return false;
    }

    const focusableTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'];
    const isFocusableTag = focusableTags.includes(element.tagName);
    const hasTabIndex = element.hasAttribute('tabindex');
    const isContentEditable = element.getAttribute('contenteditable') === 'true';

    return isFocusableTag || hasTabIndex || isContentEditable;
  }

  /**
   * Get next focusable element
   */
  static getNextFocusable(current: HTMLElement, container?: HTMLElement): HTMLElement | null {
    const focusableElements = Array.from(
      (container || document.body).querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(current);
    return focusableElements[currentIndex + 1] || null;
  }

  /**
   * Get previous focusable element
   */
  static getPreviousFocusable(current: HTMLElement, container?: HTMLElement): HTMLElement | null {
    const focusableElements = Array.from(
      (container || document.body).querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(current);
    return focusableElements[currentIndex - 1] || null;
  }
}

/**
 * Color contrast validation utilities
 */
export class ColorContrast {
  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Calculate relative luminance
   */
  static getLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getLuminance(rgb1);
    const lum2 = this.getLuminance(rgb2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if contrast meets WCAG AA standard (4.5:1 for normal text)
   */
  static meetsWCAGAA(foreground: string, background: string, largeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    const requiredRatio = largeText ? 3 : 4.5;
    return ratio >= requiredRatio;
  }

  /**
   * Check if contrast meets WCAG AAA standard (7:1 for normal text)
   */
  static meetsWCAGAAA(foreground: string, background: string, largeText: boolean = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    const requiredRatio = largeText ? 4.5 : 7;
    return ratio >= requiredRatio;
  }
}

/**
 * Screen reader announcement utilities
 */
export class ScreenReader {
  private static announcer: HTMLElement | null = null;

  /**
   * Initialize screen reader announcer
   */
  static init(): void {
    if (typeof document === 'undefined') return;

    if (!this.announcer) {
      this.announcer = document.createElement('div');
      this.announcer.setAttribute('aria-live', 'polite');
      this.announcer.setAttribute('aria-atomic', 'true');
      this.announcer.style.position = 'absolute';
      this.announcer.style.left = '-10000px';
      this.announcer.style.width = '1px';
      this.announcer.style.height = '1px';
      this.announcer.style.overflow = 'hidden';
      document.body.appendChild(this.announcer);
    }
  }

  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (typeof document === 'undefined') return;

    this.init();

    if (!this.announcer) return;

    // Create temporary announcer for assertive messages
    if (priority === 'assertive') {
      const assertiveAnnouncer = document.createElement('div');
      assertiveAnnouncer.setAttribute('aria-live', 'assertive');
      assertiveAnnouncer.setAttribute('aria-atomic', 'true');
      assertiveAnnouncer.style.position = 'absolute';
      assertiveAnnouncer.style.left = '-10000px';
      assertiveAnnouncer.style.width = '1px';
      assertiveAnnouncer.style.height = '1px';
      assertiveAnnouncer.style.overflow = 'hidden';
      assertiveAnnouncer.textContent = message;
      document.body.appendChild(assertiveAnnouncer);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(assertiveAnnouncer);
      }, 1000);
    } else {
      this.announcer.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        if (this.announcer) {
          this.announcer.textContent = '';
        }
      }, 1000);
    }
  }

  /**
   * Announce vital sign changes
   */
  static announceVitalChange(vital: string, oldValue: string, newValue: string, status?: string): void {
    const message = `${vital} changed from ${oldValue} to ${newValue}${status ? `, ${status}` : ''}`;
    this.announce(message, status === 'critical' || status === 'warning' ? 'assertive' : 'polite');
  }

  /**
   * Announce patient status changes
   */
  static announceStatusChange(patientName: string, oldStatus: string, newStatus: string): void {
    const message = `Patient ${patientName} status changed from ${oldStatus} to ${newStatus}`;
    this.announce(message, newStatus === 'critical' ? 'assertive' : 'polite');
  }

  /**
   * Announce medication reminders
   */
  static announceMedicationReminder(medicationName: string, time: string): void {
    const message = `Reminder: Time to take ${medicationName} at ${time}`;
    this.announce(message, 'assertive');
  }
}

/**
 * Skip navigation utilities
 */
export class SkipNavigation {
  /**
   * Create skip navigation link
   */
  static createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-nav';
    skipLink.setAttribute('aria-label', text);

    // Add basic styles
    Object.assign(skipLink.style, {
      position: 'absolute',
      top: '-40px',
      left: '6px',
      background: '#000',
      color: '#fff',
      padding: '8px',
      textDecoration: 'none',
      borderRadius: '4px',
      zIndex: '9999',
      transition: 'top 0.3s'
    });

    // Show on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    return skipLink;
  }

  /**
   * Initialize skip navigation
   */
  static initialize(mainContentId: string = 'main-content'): void {
    if (typeof document === 'undefined') return;

    // Add skip link to beginning of body
    const skipLink = this.createSkipLink(mainContentId);
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Ensure target element exists
    const target = document.getElementById(mainContentId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      });
    }
  }
}

/**
 * Focus trap for modals and dialogs
 */
export class FocusTrap {
  private element: HTMLElement;
  private previousFocus: HTMLElement | null = null;
  private cleanup: (() => void) | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  /**
   * Activate focus trap
   */
  activate(): void {
    this.previousFocus = document.activeElement as HTMLElement;
    this.cleanup = KeyboardNavigation.trapFocus(this.element);
  }

  /**
   * Deactivate focus trap
   */
  deactivate(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }

    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }
}

/**
 * Health check utilities for accessibility
 */
export class AccessibilityHealthCheck {
  /**
   * Check if page has proper heading structure
   */
  static checkHeadingStructure(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    if (headings.length === 0) {
      issues.push('No headings found on page');
      return { valid: false, issues };
    }

    // Check for h1
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 0) {
      issues.push('No h1 heading found');
    } else if (h1s.length > 1) {
      issues.push('Multiple h1 headings found');
    }

    // Check heading order
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        issues.push(`Heading level skipped: h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    });

    return { valid: issues.length === 0, issues };
  }

  /**
   * Check for alt text on images
   */
  static checkImageAltText(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const images = document.querySelectorAll('img');

    images.forEach((img, index) => {
      if (!img.alt && img.alt !== '') {
        issues.push(`Image ${index + 1} missing alt text`);
      }
    });

    return { valid: issues.length === 0, issues };
  }

  /**
   * Check for proper ARIA labels on interactive elements
   */
  static checkAriaLabels(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const interactiveElements = document.querySelectorAll('button, [role="button"], a[href]');

    interactiveElements.forEach((element, index) => {
      const hasText = element.textContent?.trim();
      const hasAriaLabel = element.getAttribute('aria-label');
      const hasAriaLabelledBy = element.getAttribute('aria-labelledby');

      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push(`Interactive element ${index + 1} missing accessible name`);
      }
    });

    return { valid: issues.length === 0, issues };
  }

  /**
   * Run complete accessibility health check
   */
  static runFullCheck(): { valid: boolean; issues: string[]; checks: any } {
    const checks = {
      headings: this.checkHeadingStructure(),
      images: this.checkImageAltText(),
      ariaLabels: this.checkAriaLabels()
    };

    const allIssues = [
      ...checks.headings.issues,
      ...checks.images.issues,
      ...checks.ariaLabels.issues
    ];

    return {
      valid: allIssues.length === 0,
      issues: allIssues,
      checks
    };
  }
}

// Export types for TypeScript support
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
}

export interface VitalSignData {
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  timestamp?: Date;
}

export interface MedicationData {
  name: string;
  dosage: string;
  frequency: string;
  time?: string;
  taken?: boolean;
}

export interface PatientData {
  id: string;
  name: string;
  status: 'critical' | 'serious' | 'stable' | 'improving';
  alerts?: string[];
}