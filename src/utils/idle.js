/**
 * Small scheduling helpers used to keep non-critical work off the critical path.
 *
 * `runWhenIdle` prefers requestIdleCallback (with a hard timeout so the work
 * still happens on browsers that stay busy) and falls back to setTimeout.
 * Every helper returns a cancel function.
 */

export const runWhenIdle = (callback, { timeout = 2500, fallbackDelay = 300 } = {}) => {
  if (typeof window === 'undefined') return () => {};

  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback?.(id);
  }

  const id = window.setTimeout(callback, fallbackDelay);
  return () => window.clearTimeout(id);
};

/**
 * Runs `callback` once, when the page has painted at least two frames.
 * Used for work that must not compete with hydration but should happen early.
 */
export const runAfterFirstPaint = (callback) => {
  if (typeof window === 'undefined') return () => {};

  let cancelled = false;
  let frameId = 0;

  frameId = window.requestAnimationFrame(() => {
    frameId = window.requestAnimationFrame(() => {
      if (!cancelled) callback();
    });
  });

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(frameId);
  };
};
