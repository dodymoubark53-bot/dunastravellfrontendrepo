/**
 * Generates a static HTML shell per tour so search engines see the correct
 * <title> and <link rel="canonical"> in the raw HTML (Ctrl+U), before any
 * JavaScript runs. React Helmet still keeps the page up to date at runtime.
 *
 * Runs automatically after `vite build`.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SHELL = path.join(DIST, 'index.html');
const SITE_URL = 'https://dunas-travel.com';
const API_URL = process.env.VITE_API_URL || 'https://api.dunas-travel.com/api';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function setTag(html, pattern, tag) {
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function buildTourHtml(shell, tour) {
  const slug = String(tour.slug || '').trim();
  const title = String(tour.title || slug).trim();
  const description = String(tour.description || tour.overview || `Explore ${title} with Dunas Travel.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
  const image = typeof tour.image === 'string' && tour.image.startsWith('http') ? tour.image : '';
  const canonical = `${SITE_URL}/tours/${slug}`;

  let html = shell;
  html = setTag(html, /<title>[\s\S]*?<\/title>/i, `    <title>${escapeHtml(title)} | Dunas Travel</title>`);
  html = setTag(html, /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
    `    <meta name="description" content="${escapeHtml(description)}" />`);
  html = setTag(html, /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `    <meta property="og:title" content="${escapeHtml(title)} | Dunas Travel" />`);
  html = setTag(html, /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`);
  html = setTag(html, /<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/i,
    `    <meta property="og:url" content="${escapeHtml(canonical)}" />`);
  if (image) {
    html = setTag(html, /<meta\s+property="og:image"\s+content="[\s\S]*?"\s*\/?>/i,
      `    <meta property="og:image" content="${escapeHtml(image)}" />`);
  }

  // No data-rh attribute here: SEOHead updates this exact tag on mount and
  // react-helmet-async touches only tags it owns, so no duplicate is created.
  html = html.replace(/(<title>[\s\S]*?<\/title>)/i,
    `$1\n    <link rel="canonical" href="${escapeHtml(canonical)}" />`);

  return html;
}

async function fetchToursFromApi() {
  const tours = [];
  for (let page = 1; page <= 20; page += 1) {
    const url = `${API_URL}/tours?limit=50&page=${page}&lang=en`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Tours API returned ${response.status}`);
    const body = await response.json();
    const batch = Array.isArray(body?.data) ? body.data : [];
    tours.push(...batch);
    if (!body?.meta?.hasNextPage || batch.length === 0) break;
  }
  return tours.filter((tour) => tour?.slug).map((tour) => ({
    slug: tour.slug,
    title: typeof tour.title === 'object' ? (tour.title.en || tour.title.ar || Object.values(tour.title)[0]) : tour.title,
    description: tour.overview || '',
    image: tour.heroImage || tour.heroImageUrl || tour.images?.[0] || '',
  }));
}

async function loadFallbackTours() {
  const file = path.join(ROOT, 'src/data/database/unified_52_tours.json');
  const data = JSON.parse(await readFile(file, 'utf8'));
  return (Array.isArray(data.tours) ? data.tours : []).filter((tour) => tour?.slug).map((tour) => ({
    slug: tour.slug,
    title: typeof tour.title === 'object' ? (tour.title.en || tour.title.ar || Object.values(tour.title)[0]) : tour.title,
    description: typeof tour.overview === 'object' ? (tour.overview.en || tour.overview.ar || '') : (tour.overview || ''),
    image: '',
  }));
}

async function main() {
  let shell;
  try {
    shell = await readFile(SHELL, 'utf8');
  } catch {
    console.warn('[prerender-seo] dist/index.html not found — run `vite build` first. Skipping.');
    return;
  }

  let tours;
  let source = 'API';
  try {
    tours = await fetchToursFromApi();
    if (tours.length === 0) throw new Error('Tours API returned no tours');
  } catch (error) {
    source = 'local catalogue fallback';
    console.warn(`[prerender-seo] API unavailable (${error.message}); using local catalogue.`);
    tours = await loadFallbackTours();
  }

  let written = 0;
  for (const tour of tours) {
    const slug = String(tour.slug || '').trim();
    if (!/^[a-z0-9-]+$/i.test(slug)) continue;
    const directory = path.join(DIST, 'tours', slug);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), buildTourHtml(shell, tour), 'utf8');
    written += 1;
  }
  console.log(`[prerender-seo] Generated ${written} tour pages with per-tour canonical (${source}).`);
}

main().catch((error) => {
  console.error('[prerender-seo] Failed:', error);
  process.exitCode = 1;
});
