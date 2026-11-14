import { useState, useEffect } from 'react';

/**
 * useIdleMount - Delays mounting non-critical components until the browser is idle
 * or after an optional fallback delay (with setTimeout fallback for Safari / browsers without requestIdleCallback).
 *
 * @param {number} delay Fallback delay in milliseconds (default: 2000)
 * @returns {boolean} Whether the component should mount
 */
export function useIdleMount(delay = 2000) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let idleId;
    let timeoutId;

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(
        () => setIsIdle(true),
        { timeout: delay }
      );
    } else {
      timeoutId = window.setTimeout(
        () => setIsIdle(true),
        Math.max(1, delay)
      );
    }

    return () => {
      if (idleId && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [delay]);

  return isIdle;
}

export default useIdleMount;

