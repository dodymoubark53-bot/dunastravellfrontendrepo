import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// Custom plugin to convert render-blocking CSS link tags to preloaded async link tags
function asyncCssPlugin() {
  return {
    name: 'async-css',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet"([^>]*?)href="([^"]+)"([^>]*?)>/g,
        (match, pre, href, post) => {
          // Hand-authored links (e.g. the Google Fonts link in index.html) already
          // opt into the async pattern with `media="print" onload="this.media='all'"`.
          // Rewriting them would append a SECOND `onload`, and the browser keeps only
          // the first attribute — so `this.media='all'` runs but `rel` stays `preload`,
          // meaning the stylesheet is never applied. Leave those links untouched.
          if (/\bonload\s*=/.test(match)) return match;
          return `<link rel="preload" ${pre}href="${href}"${post} as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" ${pre}href="${href}"${post}></noscript>`;
        }
      );
    }
  };
}

// Security plugin: isolates hidden sourcemaps into a private directory outside dist
function isolateSourceMapsPlugin() {
  return {
    name: 'isolate-sourcemaps',
    apply: 'build',
    closeBundle() {
      const distAssetsDir = path.resolve(process.cwd(), 'dist/assets');
      const privateMapsDir = path.resolve(process.cwd(), '.private-sourcemaps');
      if (!fs.existsSync(distAssetsDir)) return;
      if (!fs.existsSync(privateMapsDir)) {
        fs.mkdirSync(privateMapsDir, { recursive: true });
      }
      const files = fs.readdirSync(distAssetsDir);
      for (const file of files) {
        if (file.endsWith('.map')) {
          const srcPath = path.join(distAssetsDir, file);
          const destPath = path.join(privateMapsDir, file);
          fs.copyFileSync(srcPath, destPath);
          fs.unlinkSync(srcPath);
        }
      }
    }
  };
}

// Development plugin to capture and save all browser runtime logs & errors to a local file
function devLoggerPlugin() {
  const logFilePath = path.resolve(process.cwd(), 'frontend_runtime.log');

  return {
    name: 'dev-runtime-logger',
    apply: 'serve',
    configureServer(server) {
      fs.writeFileSync(logFilePath, `=== Frontend Runtime Log Session Started: ${new Date().toISOString()} ===\n\n`, 'utf8');

      server.middlewares.use('/__client_log', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const time = new Date().toLocaleTimeString();
              const logEntry = `[${time}] [${data.type || 'LOG'}] ${data.message || ''}\n${data.stack ? '  Stack: ' + data.stack + '\n' : ''}${data.details ? '  Details: ' + JSON.stringify(data.details) + '\n' : ''}\n`;
              fs.appendFileSync(logFilePath, logEntry, 'utf8');
              const color = data.type && data.type.includes('ERROR') ? '\x1b[31m' : data.type && data.type.includes('WARN') ? '\x1b[33m' : '\x1b[36m';
              console.log(`${color}[BROWSER ${data.type}]\x1b[0m ${data.message || ''}`);
            } catch (e) {
              fs.appendFileSync(logFilePath, `[${new Date().toLocaleTimeString()}] ${body}\n`, 'utf8');
            }
            res.statusCode = 200;
            res.end('OK');
          });
        } else {
          res.statusCode = 200;
          res.end('OK');
        }
      });
    },
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>
    <script>
      (function() {
        function sendLog(type, message, stack, details) {
          try {
            var payload = JSON.stringify({
              type: type,
              message: String(message || ''),
              stack: stack || null,
              details: details || null,
              url: window.location.pathname + window.location.search,
              time: new Date().toISOString()
            });
            if (navigator.sendBeacon) {
              navigator.sendBeacon('/__client_log', payload);
            } else {
              fetch('/__client_log', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' } });
            }
          } catch(e) {}
        }
        window.addEventListener('error', function(e) {
          sendLog('UNCAUGHT_ERROR', e.message, e.error ? e.error.stack : null, { filename: e.filename, lineno: e.lineno, colno: e.colno });
        });
        window.addEventListener('unhandledrejection', function(e) {
          sendLog('UNHANDLED_REJECTION', e.reason ? (e.reason.message || String(e.reason)) : 'Unknown rejection', e.reason ? e.reason.stack : null);
        });
        var origError = console.error;
        console.error = function() {
          var args = Array.prototype.slice.call(arguments);
          sendLog('CONSOLE_ERROR', args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' '));
          origError.apply(console, arguments);
        };
        var origWarn = console.warn;
        console.warn = function() {
          var args = Array.prototype.slice.call(arguments);
          sendLog('CONSOLE_WARN', args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' '));
          origWarn.apply(console, arguments);
        };
        console.log('[DevLogger] Live browser logging active. Output stored in frontend_runtime.log');
        sendLog('PAGE_NAVIGATE', 'Loaded ' + window.location.pathname);
      })();
    </script>`
      );
    }
  };
}

// Dev-only: inject the same per-tour <title>/canonical that the production
// prerender script writes into dist/tours/<slug>/index.html, so Ctrl+U works
// identically on the local dev server (`npm run dev`).
function devTourSeoPlugin() {
  const cataloguePath = path.resolve(process.cwd(), 'src/data/database/unified_52_tours.json');
  let titleMap = null;

  const getTitleMap = () => {
    if (!titleMap) {
      titleMap = new Map();
      try {
        const data = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
        for (const tour of data.tours || []) {
          if (!tour?.slug) continue;
          const raw = tour.title;
          const title = typeof raw === 'object'
            ? (raw.en || raw.ar || Object.values(raw)[0])
            : raw;
          titleMap.set(tour.slug, title || tour.slug);
        }
      } catch {
        // Catalogue is optional — fall back to a prettified slug.
      }
    }
    return titleMap;
  };

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const injectTourSeo = (html, slug) => {
    const title = getTitleMap().get(slug)
      || slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    const canonical = `https://dunas-travel.com/tours/${slug}`;

    return html
      .replace(/<link[^>]*rel="canonical"[^>]*>/gi, '')
      .replace(/<title>[\s\S]*?<\/title>/i,
        `<title>${escapeHtml(title)} | Dunas Travel</title>\n    <link rel="canonical" href="${canonical}" />`)
      .replace(/<meta property="og:url"[^>]*>/i,
        `<meta property="og:url" content="${canonical}" />`);
  };

  return {
    name: 'dev-tour-seo',
    apply: 'serve',
    configureServer(server) {
      const htmlPath = path.resolve(process.cwd(), 'index.html');
      server.middlewares.use(async (req, res, next) => {
        const originalUrl = req.originalUrl || req.url || '';
        const pathname = originalUrl.split('?')[0];
        const match = pathname.match(/^\/tours\/([^/]+)\/?$/);
        if (!match) return next();

        let slug = match[1];
        try { slug = decodeURIComponent(slug); } catch { /* keep raw */ }
        if (!/^[a-z0-9-]+$/i.test(slug)) return next();

        try {
          const rawHtml = fs.readFileSync(htmlPath, 'utf8');
          const withSeo = injectTourSeo(rawHtml, slug);
          const finalHtml = await server.transformIndexHtml(originalUrl, withSeo, originalUrl);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(finalHtml);
        } catch (error) {
          next(error);
        }
        return undefined;
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = path.resolve(process.cwd());
  const env = { ...loadEnv(mode, process.cwd(), ''), ...loadEnv(mode, envDir, '') };
  // Keep local development fully integrated. VITE_API_URL wins (e.g. http://localhost:5000/api if running local backend),
  // Default is local backend — the production API rejects localhost CORS origins, never use it as a dev fallback.
  const upstreamApi = env.VITE_API_URL || 'http://localhost:5000/api';
  const apiOrigin = new URL(upstreamApi).origin;

  return {
    plugins: [
      react(),
      asyncCssPlugin(),
      isolateSourceMapsPlugin(),
      devLoggerPlugin(),
      devTourSeoPlugin(),
      visualizer({
        filename: 'stats.html',
        open: false,
        gzipSize: true
      })
    ],
    base: '/',
    server: {
      watch: {
        ignored: [
          '**/.claude/**',
          '**/.git/**',
          '**/stats.html',
          '**/dist/**',
          '**/frontend_runtime.log',
          '**/*.webp',
          '**/*.png',
          '**/*.jpg',
          '**/*.jpeg',
          '**/*.svg',
          '**/*.mp4',
          '**/*.webm'
        ]
      },
      // Production API intentionally rejects localhost origins. Proxy local
      // browser requests through Vite so the app can be exercised locally
      // without weakening production CORS policy.
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      minify: true,
      cssMinify: true,
      modulePreload: {
        resolveDependencies(url, deps, { hostId, hostType }) {
          return deps.filter(dep => !dep.includes('locale-') && !dep.includes('Cookie') && !dep.includes('vendor-motion'));
        },
      },
      // flag-icons ships ~250 flag SVGs referenced from its CSS. Inlining them
      // (the previous default here) produced an 810 kB stylesheet on every
      // page. Keep them as separate files: the browser then only downloads the
      // handful of flags actually rendered.
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            // React Core runtime
            if (
              normalizedId.includes('node_modules/react-dom/') ||
              normalizedId.includes('node_modules/react/') ||
              normalizedId.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (
              normalizedId.includes('node_modules/react-router/') ||
              normalizedId.includes('node_modules/react-router-dom/')
            ) {
              return 'vendor-router';
            }
            if (normalizedId.includes('node_modules/react-helmet-async/')) {
              return 'vendor-helmet';
            }
            if (normalizedId.includes('node_modules/framer-motion')) return 'vendor-motion';
            if (normalizedId.includes('node_modules/swiper')) return 'vendor-swiper';
            if (
              normalizedId.includes('node_modules/i18next') ||
              normalizedId.includes('node_modules/react-i18next') ||
              normalizedId.includes('node_modules/i18next-browser-languagedetector')
            ) {
              return 'vendor-i18n';
            }
            if (
              normalizedId.includes('node_modules/leaflet') ||
              normalizedId.includes('node_modules/react-leaflet')
            ) {
              return 'vendor-leaflet';
            }
            if (normalizedId.includes('src/i18n/locales/')) {
              const match = normalizedId.match(/locales\/([a-z]{2})\.(ui|catalog)\.json/);
              if (match) return `locale-${match[1]}-${match[2]}`;
              const matchOld = normalizedId.match(/locales\/([a-z]{2})\.json/);
              if (matchOld) return `locale-${matchOld[1]}`;
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      sourcemap: 'hidden',
    },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    fileParallelism: false,
  },
  };
})
