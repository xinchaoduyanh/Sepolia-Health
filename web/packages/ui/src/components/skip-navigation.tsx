'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SkipNavLinkProps {
  targetId: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipNavLink({ targetId, children, className }: SkipNavLinkProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'fixed top-0 left-6 z-50 -translate-y-full bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg transition-transform duration-200 focus:translate-y-6',
        isVisible && 'translate-y-6',
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
          target.removeAttribute('tabindex');
        }
      }}
    >
      {children}
    </a>
  );
}

export function SkipNavigation() {
  return (
    <>
      <SkipNavLink targetId="main-content">
        Skip to main content
      </SkipNavLink>
      <SkipNavLink targetId="navigation">
        Skip to navigation
      </SkipNavLink>
      <SkipNavLink targetId="emergency-info">
        Skip to emergency information
      </SkipNavLink>
      <SkipNavLink targetId="search">
        Skip to search
      </SkipNavLink>
    </>
  );
}

interface MainContentProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
}

export function MainContent({ id = 'main-content', className, children, ...props }: MainContentProps) {
  return (
    <main
      id={id}
      className={cn('outline-none', className)}
      tabIndex={-1}
      {...props}
    >
      {children}
    </main>
  );
}

interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  onEscape?: () => void;
  className?: string;
}

export function FocusTrap({ children, isActive, onEscape, className }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Save the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Find all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    firstElement.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscape);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscape);

      // Restore focus to the previous element when trap is deactivated
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, onEscape]);

  return (
    <div
      ref={containerRef}
      className={cn('focus-trap', className)}
      role="dialog"
      aria-modal={isActive}
    >
      {children}
    </div>
  );
}

interface ScreenReaderAnnouncerProps {
  message?: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function ScreenReaderAnnouncer({ message, priority = 'polite', className }: ScreenReaderAnnouncerProps) {
  const [announcement, setAnnouncement] = React.useState('');

  React.useEffect(() => {
    if (message) {
      setAnnouncement(message);
      // Clear announcement after it's read
      const timer = setTimeout(() => setAnnouncement(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {announcement}
    </div>
  );
}

interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  className?: string;
}

export function LiveRegion({ children, priority = 'polite', className }: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only live-region', className)}
    >
      {children}
    </div>
  );
}

// Hook for screen reader announcements
export function useScreenReader() {
  const [announcer, setAnnouncer] = useState<HTMLDivElement | null>(null);

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer) return;

    const announcerElement = announcer;
    announcerElement.setAttribute('aria-live', priority);
    announcerElement.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcerElement.textContent = '';
    }, 1000);
  }, [announcer]);

  return { announce, setAnnouncer };
}

// Enhanced focus management hook
export function useFocusManagement(isActive: boolean, escapeCallback?: () => void) {
  const containerRef = React.useRef<HTMLElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    previousFocusRef.current = document.activeElement as HTMLElement;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        escapeCallback?.();
      } else if (e.key === 'Tab') {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, escapeCallback]);

  return containerRef;
}

// Component for keyboard-only users
interface KeyboardOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function KeyboardOnly({ children, className }: KeyboardOnlyProps) {
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = () => setIsKeyboardUser(true);
    const handleMouseDown = () => setIsKeyboardUser(false);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return (
    <span
      className={cn(
        'keyboard-only',
        isKeyboardUser ? 'opacity-100' : 'opacity-0',
        className
      )}
      aria-hidden={!isKeyboardUser}
    >
      {children}
    </span>
  );
}

// High contrast mode indicator
export function HighContrastIndicator() {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (!isHighContrast) return null;

  return (
    <div
      className="fixed top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-md text-sm font-medium z-50"
      role="status"
      aria-live="polite"
    >
      High Contrast Mode Active
    </div>
  );
}

// Reduced motion indicator
export function ReducedMotionIndicator() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (!prefersReducedMotion) return null;

  return (
    <div
      className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-medium z-50"
      role="status"
      aria-live="polite"
    >
      Reduced Motion Active
    </div>
  );
}

// Focus visible enhancement
export function FocusVisible({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Add focus-visible styles
    const style = document.createElement('style');
    style.textContent = `
      .js-focus-visible :focus:not([data-focus-visible-added]) {
        outline: none;
      }
      .js-focus-visible [data-focus-visible-added] {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
      .js-focus-visible [data-focus-visible-added].focus-ring-error {
        outline-color: var(--color-destructive);
      }
      .js-focus-visible [data-focus-visible-added].focus-ring-warning {
        outline-color: var(--color-warning);
      }
    `;
    document.head.appendChild(style);

    // Add focus-visible polyfill behavior
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('js-focus-visible');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('js-focus-visible');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.head.removeChild(style);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return <>{children}</>;
}

// Accessibility health check component
export function AccessibilityHealthCheck() {
  const [issues, setIssues] = React.useState<string[]>([]);

  React.useEffect(() => {
    const checkAccessibility = () => {
      const foundIssues: string[] = [];

      // Check for missing alt text
      const images = document.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        foundIssues.push(`${images.length} images missing alt text`);
      }

      // Check for missing ARIA labels
      const buttonsWithoutLabel = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
      if (buttonsWithoutLabel.length > 0) {
        foundIssues.push(`${buttonsWithoutLabel.length} buttons missing ARIA labels`);
      }

      // Check for proper heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const hasH1 = document.querySelectorAll('h1').length > 0;
      if (!hasH1) {
        foundIssues.push('Missing h1 heading');
      }

      // Check for proper form labels
      const inputsWithoutLabel = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby]):not([id])');
      if (inputsWithoutLabel.length > 0) {
        foundIssues.push(`${inputsWithoutLabel.length} inputs missing labels`);
      }

      setIssues(foundIssues);
    };

    // Initial check
    checkAccessibility();

    // Check after DOM changes
    const observer = new MutationObserver(() => {
      checkAccessibility();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    return () => observer.disconnect();
  }, []);

  if (issues.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-warning text-warning-foreground px-4 py-2 rounded-md shadow-lg z-50 max-w-sm">
      <div className="font-medium">Accessibility Issues Found:</div>
      <ul className="text-sm mt-1 space-y-1">
        {issues.slice(0, 3).map((issue, index) => (
          <li key={index}>• {issue}</li>
        ))}
        {issues.length > 3 && (
          <li>• +{issues.length - 3} more issues</li>
        )}
      </ul>
    </div>
  );
}