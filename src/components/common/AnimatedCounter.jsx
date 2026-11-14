import React, { useEffect, useRef } from 'react';

/**
 * AnimatedCounter
 * Smoothly animates numbers from 0 to target value when scrolled into view.
 * Uses native IntersectionObserver and direct DOM textContent manipulation
 * inside requestAnimationFrame to completely eliminate React re-render cascades
 * and heavy motion library overhead.
 */
export default function AnimatedCounter({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = '',
  formatter,
}) {
  const ref = useRef(null);
  const targetNumber = typeof value === 'number' ? value : parseInt(value, 10) || 0;

  const format = (n) => {
    const formatted = formatter ? formatter(n) : n.toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect user's motion preference: jump straight to target value
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(targetNumber);
      return;
    }

    let animationFrameId;
    let observer;

    const startAnimation = () => {
      let startTime = null;
      const startValue = 0;
      const endValue = targetNumber;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth ease-out cubic curve: 1 - (1 - p)^3
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + (endValue - startValue) * easeOut);

        if (ref.current) {
          ref.current.textContent = format(current);
        }

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else if (ref.current) {
          ref.current.textContent = format(endValue);
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            observer.disconnect();
            startAnimation();
          }
        },
        { rootMargin: '-20px' }
      );
      observer.observe(el);
    } else {
      startAnimation();
    }

    return () => {
      if (observer) observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetNumber, duration, prefix, suffix, formatter]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
