import React from 'react';
import { usePrefetchAppTerms } from '@/lib/api/app-terms';

/**
 * Component to prefetch app terms in the background
 * This runs silently without blocking UI rendering
 */
export function BackgroundPrefetch() {
  usePrefetchAppTerms();
  return null; // This component doesn't render anything
}
