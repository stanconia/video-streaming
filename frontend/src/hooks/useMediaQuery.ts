import { useState, useEffect } from 'react';

/**
 * Custom hook that listens to a CSS media query and returns whether it matches.
 * Updates reactively when the viewport changes.
 *
 * @param query - A valid CSS media query string, e.g. '(max-width: 768px)'
 * @returns boolean indicating whether the media query currently matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Set initial value in case it changed between render and effect
    setMatches(mql.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Returns true when viewport is 768px or narrower (mobile) */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');

/** Returns true when viewport is 1024px or narrower (tablet and below) */
export const useIsTablet = () => useMediaQuery('(max-width: 1024px)');

/** Returns true when viewport is 480px or narrower (small phone) */
export const useIsSmallPhone = () => useMediaQuery('(max-width: 480px)');

/** Returns true when viewport is 1280px or wider (desktop) */
export const useIsDesktop = () => useMediaQuery('(min-width: 1280px)');
