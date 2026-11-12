import { useState, useEffect, lazy, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { JaiderChatProvider, useJaiderChat } from '../../context/JaiderChatContext';
import { runWhenIdle } from '../../utils/idle';

const Footer = lazy(() => import('./Footer'));
const FloatingContact = lazy(() => import('./FloatingContact'));
const BackgroundMusic = lazy(() => import('../ui/BackgroundMusic'));
const FloatingGuideR = lazy(() => import('../ui/FloatingGuideR'));
const JaiderChatWindow = lazy(() => import('../ui/JaiderChatWindow'));

/**
 * The chat panel renders nothing until it is opened, so its chunk and React
 * tree are only mounted on the first open instead of on page load.
 */
const DeferredJaiderChatWindow = () => {
  const { isOpen } = useJaiderChat();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  if (!mounted) return null;
  return <JaiderChatWindow />;
};

const Layout = () => {
  const [loadWidgets, setLoadWidgets] = useState(false);
  const [loadFooter, setLoadFooter] = useState(false);
  const location = useLocation();

  // Non-critical floating widgets (chat, contact, guide, music) are mounted
  // after the main thread goes idle, or as soon as the visitor interacts.
  useEffect(() => {
    let cancelIdle = () => {};
    const enableWidgets = () => {
      setLoadWidgets(true);
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('pointerdown', enableWidgets);
      window.removeEventListener('scroll', enableWidgets);
      window.removeEventListener('keydown', enableWidgets);
      window.removeEventListener('touchstart', enableWidgets);
      cancelIdle();
    };

    window.addEventListener('pointerdown', enableWidgets, { passive: true });
    window.addEventListener('scroll', enableWidgets, { passive: true });
    window.addEventListener('keydown', enableWidgets, { passive: true });
    window.addEventListener('touchstart', enableWidgets, { passive: true });

    cancelIdle = runWhenIdle(enableWidgets, { timeout: 4000, fallbackDelay: 3500 });

    return cleanup;
  }, []);

  // The footer sits below every route, so its JS/CSS can wait for idle too.
  // This keeps it out of the initial network/main-thread contention without
  // changing anything the visitor sees above the fold.
  useEffect(() => {
    const cancelIdle = runWhenIdle(() => setLoadFooter(true), {
      timeout: 2500,
      fallbackDelay: 1500,
    });
    return cancelIdle;
  }, []);

  // Global Scroll Reveal Observer for all pages — 100% async native IntersectionObserver
  // Eliminates synchronous getBoundingClientRect layout reads that forced 230ms reflow.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px -20px 0px' }
    );

    const observeElements = () => {
      const targets = document.querySelectorAll(
        '.reveal, .reveal-on-scroll, section:not(.no-reveal), .section-head, .grid-card-reveal'
      );
      targets.forEach((el) => {
        if (!el.classList.contains('in')) {
          el.classList.add('reveal-on-scroll');
          observer.observe(el);
        }
      });
    };

    const idleId = (window.requestIdleCallback || ((cb) => setTimeout(cb, 200)))(observeElements);

    return () => {
      if (window.cancelIdleCallback && typeof idleId === 'number') {
        window.cancelIdleCallback(idleId);
      }
      observer.disconnect();
    };
  }, [location.pathname]);

  return (
    <JaiderChatProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Suspense
            fallback={
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gold-300 border-t-gold-500 rounded-full animate-spin" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>

        {loadFooter && (
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        )}
        {loadWidgets && (
          <Suspense fallback={null}>
            <FloatingContact />
            <BackgroundMusic />
            <FloatingGuideR />
            <DeferredJaiderChatWindow />
          </Suspense>
        )}
      </div>
    </JaiderChatProvider>
  );
};

export default Layout;
