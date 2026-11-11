import { StrictMode, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { LazyMotion, domAnimation } from 'framer-motion'
import App from './App.jsx'
import { initI18n } from './i18n'
import './index.css'
import 'flag-icons/css/flag-icons.min.css'
import { AuthProvider } from './context/AuthContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'

// Auto-recover if browser tries to load old chunk after a new deployment
window.addEventListener('vite:preloadError', (event) => {
  event?.preventDefault?.();
  const pageAlreadyRefreshed = window.sessionStorage.getItem('chunk_reload_attempted');
  if (!pageAlreadyRefreshed) {
    window.sessionStorage.setItem('chunk_reload_attempted', 'true');
    window.location.reload();
  }
});

function Root() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n()
      .catch((err) => console.warn('i18n init error:', err))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#071330]">
        <div className="w-10 h-10 border-2 border-[#C9A227]/30 border-t-[#C9A227] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <StrictMode>
      {/* `m` components only ship the DOM animation subset; the full
          framer-motion feature bundle is no longer pulled in. LazyMotion wraps
          every provider so portals (toasts, modals) share the same context. */}
      <LazyMotion features={domAnimation}>
        <BrowserRouter>
          <HelmetProvider>
            <CurrencyProvider>
              <ThemeProvider>
                <AuthProvider>
                  <ToastProvider>
                    <App />
                  </ToastProvider>
                </AuthProvider>
              </ThemeProvider>
            </CurrencyProvider>
          </HelmetProvider>
        </BrowserRouter>
      </LazyMotion>
    </StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
