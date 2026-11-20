import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import SEOHead from '../../components/seo/SEOHead';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import TourCard from '../../components/tour/TourCard';
import { useTours } from '../../hooks/useTours';
import LuxuryHeroSection from '../../components/common/LuxuryHeroSection';
import DurationSortFilter from '../../components/common/DurationSortFilter';
import { getOptimizedCloudinaryUrl } from '../../utils/cloudinary';
import { DEFAULT_EGYPT_PACKAGES } from '../../data/egyptPackages';

import useLandingPage from '../../hooks/useLandingPage';

function resolvePackageTitle(pkg, t, lang) {
  if (!pkg) return '';
  // 1. Dashboard-edited multilingual title
  if (pkg.title && typeof pkg.title === 'object') {
    const val = pkg.title[lang] || pkg.title.en || pkg.title.ar;
    if (val && typeof val === 'string' && val.trim()) return val;
  }
  const fallback =
    pkg.titleDefault ||
    (lang === 'ar' ? pkg.titleAr : pkg.titleEn) ||
    pkg.titleAr ||
    pkg.titleEn ||
    '';
  if (pkg.titleKey && t) {
    const val = t(pkg.titleKey, fallback);
    if (val && val !== pkg.titleKey) return val;
  }
  if (typeof pkg.title === 'string' && pkg.title.trim()) return pkg.title;
  return fallback;
}

function resolvePackageDesc(pkg, t, lang) {
  if (!pkg) return '';
  // 1. Dashboard-edited multilingual description (descriptionJsonb)
  if (pkg.descriptionJsonb && typeof pkg.descriptionJsonb === 'object') {
    const custom = pkg.descriptionJsonb[lang] || pkg.descriptionJsonb.en || pkg.descriptionJsonb.ar;
    if (custom && typeof custom === 'string' && custom.trim()) return custom;
  }
  // 2. Multilingual description object
  if (pkg.description && typeof pkg.description === 'object') {
    const custom = pkg.description[lang] || pkg.description.en || pkg.description.ar;
    if (custom && typeof custom === 'string' && custom.trim()) return custom;
  }
  // 3. Fallback translation key or default
  const fallback =
    pkg.descDefault ||
    (typeof pkg.description === 'string' ? pkg.description : '') ||
    '';
  if (pkg.descKey && t) {
    const val = t(pkg.descKey, fallback);
    if (val && val !== pkg.descKey) return val;
  }
  if (typeof pkg.description === 'string' && pkg.description.trim()) return pkg.description;
  return fallback;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function Egipto() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const isRtl = lang.startsWith('ar');
  const navigate = useNavigate();
  const { landingPage } = useLandingPage('egypt', { destinationOnly: true });
  const { tours: allLiveTours = [] } = useTours({ limit: 70 });
  const liveTours = useMemo(() => {
    const list = (allLiveTours || []).filter(t => {
      const d = String(t.destination || t.country || '').toLowerCase();
      return d.includes('egypt') || d.includes('cairo') || d.includes('luxor');
    });
    return list.length > 0 ? list : allLiveTours;
  }, [allLiveTours]);

  // Define the default 9 standalone base classic tours for Egypt top section
  const DEFAULT_TOP_CLASSIC_SLUGS = [
    'cairo-express-4d',
    'cairo-express-alexandria-5d',
    'egito-classico-8d',
    'egito-classico-ii-9d',
    'egito-historico-10d',
    'cairo-cruzeiro-sharm-11d',
    'grande-ramses-10d',
    'tesouros-egipto-9d',
    'complete-egypt-8d'
  ];

  const topSlugsConfig =
    landingPage?.sections?.topTourSlugs ||
    landingPage?.sectionsJsonb?.topTourSlugs ||
    landingPage?.topTourSlugs;

  const baseClassic9Tours = useMemo(() => {
    const tourList = Array.isArray(liveTours) ? liveTours : [];
    if (tourList.length === 0) return [];
    const foundMap = new Map();
    tourList.forEach((t) => {
      if (t && t.slug) {
        foundMap.set(String(t.slug).toLowerCase(), t);
      }
    });

    const activeSlugs =
      Array.isArray(topSlugsConfig) && topSlugsConfig.length > 0
        ? topSlugsConfig
        : DEFAULT_TOP_CLASSIC_SLUGS;

    const result = activeSlugs
      .map((slug) => foundMap.get(String(slug).toLowerCase()))
      .filter(Boolean);

    // Also include any tour explicitly placed in egypt_main if not already present
    tourList.forEach((t) => {
      const cat = String(t.category || '').toLowerCase();
      if ((cat === 'egypt_main' || cat === 'top_featured') && !result.some((r) => r.slug === t.slug)) {
        result.push(t);
      }
    });

    return result.length > 0 ? result : tourList;
  }, [liveTours, topSlugsConfig]);

  const dynamicHeroImage = landingPage?.heroImageUrl || 'https://res.cloudinary.com/nclvl0iu/image/upload/v1790131551/egyothero.webp';
  const heroTitle = landingPage?.title || t('dest.egypt.headline', 'مصر.. حيث يلتقي التاريخ الخالد برغد الرفاهية');
  const heroSubtitle = landingPage?.subtitle || t('dest.egypt.subtitle', 'Egypt: Where Eternal History Meets Pure Luxury');
  const heroDesc = landingPage?.description || landingPage?.brief || t(
    'dest.egypt.desc',
    'انطلق في رحلة أسطورية عبر الزمن؛ استمتع بزيارة أهرامات الجيزة الخالدة، وواجهات معابد الأقصر وأسوان الملكية، وابحر في نيل مصر على متن أفخم الفنادق العائمة مع استرخاء ساحر على شواطئ البحر الأحمر.'
  );

  const [display9Tours, setDisplay9Tours] = React.useState([]);

  const rawPackages =
    landingPage?.sections?.featuredPackages ||
    landingPage?.sectionsJsonb?.featuredPackages ||
    DEFAULT_EGYPT_PACKAGES;

  const displayPackages = useMemo(() => {
    const list = Array.isArray(rawPackages) ? rawPackages : [];
    return list
      .filter(
        (pkg) =>
          pkg &&
          pkg.isVisible !== false &&
          pkg.status !== 'DRAFT' &&
          pkg.status !== 'INACTIVE',
      )
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  }, [rawPackages]);

  const currentLocale = (i18n.language || 'en').split('-')[0].toLowerCase();
  const sectionsData = landingPage?.sections || landingPage?.sectionsJsonb || {};

  const heroBadgeFromSections =
    sectionsData?.heroBadge?.[currentLocale] ||
    sectionsData?.heroBadge?.ar ||
    sectionsData?.heroBadge?.en;

  const heroBadgeIcon = sectionsData?.heroBadgeIcon || '👑';

  const heroBadge =
    heroBadgeFromSections ||
    t('dest.egypt.badge', 'مهد الحضارات وعاصمة الفخامة التاريخية');

  const heroHighlightsFromSections =
    sectionsData?.heroHighlights?.[currentLocale] ||
    sectionsData?.heroHighlights?.ar ||
    sectionsData?.heroHighlights?.en;

  const defaultHeroHighlights = [
    t('dest.egypt.tag1', '🚢 رحلات نيلية 5 نجوم ديلوكس'),
    t('dest.egypt.tag2', '👑 إرشاد سياحي خاص باللغات العالمية'),
    t('dest.egypt.tag3', '🐪 تجارب سفاري وحصريات الصحراء'),
  ];

  const heroHighlights =
    Array.isArray(heroHighlightsFromSections) && heroHighlightsFromSections.length > 0
      ? heroHighlightsFromSections
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
              const icon = item.icon?.trim() ? `${item.icon.trim()} ` : '';
              return `${icon}${item.text || ''}`.trim();
            }
            return '';
          })
          .filter(Boolean)
      : defaultHeroHighlights;

  return (
    <div className="w-full min-h-screen bg-obsidian-50 dark:bg-[#0c0d19] pb-24 text-start">
      <SEOHead
        title={t('dest.egypt.seoTitle', 'Luxury Egypt Tours & Vacations | Private Nile Cruises & Bespoke Travel')}
        description={t(
          'dest.egypt.seoDesc',
          'Discover Egypt in grand style. From the majestic Pyramids of Giza to the temples of Luxor and the Red Sea coast, embark on an unforgettable luxury journey with Dunas Travel.'
        )}
        keywords="luxury egypt tours, private nile cruise, cairo luxor aswan private tour, egypt bespoke holidays, dunas travel egypt"
        canonical="https://dunas-travel.com/destinations/egypt"
        ogImage={dynamicHeroImage}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'TouristDestination',
          name: 'Egypt',
          description: 'Timeless luxury tours and private Nile cruises across Egypt by Dunas Travel.',
          image: dynamicHeroImage,
          url: 'https://dunas-travel.com/destinations/egypt',
        }}
      />

      {/* Luxury Hero Section */}
      <LuxuryHeroSection
        badge={heroBadge}
        badgeIcon={heroBadgeIcon}
        title={heroTitle}
        subtitle={heroSubtitle}
        description={heroDesc}
        highlights={heroHighlights}
        enableCmsWidgets={!heroBadgeFromSections && !heroHighlightsFromSections}
        primaryCta={{
          text: t('dest.egypt.ctaPrimary', 'استكشف برامج مصر الفاخرة'),
          link: '#tours-grid'
        }}
        secondaryCta={{
          text: t('dest.egypt.ctaSecondary', 'صمّم رحلتك الخاصة'),
          link: '/tailor-tour'
        }}
        bgImage={dynamicHeroImage}
        zoomDuration={12}
      />

      {/* Top Section: 9 Essential Standalone Trips (الرحلات الأساسية الـ 9) */}
      <section className="container mx-auto px-6 mt-16" id="tours-grid">
        <div className="text-center mb-10">
          <span className="inline-block font-body text-gold-500 tracking-[0.2em] uppercase text-sm mb-2 font-bold">
            {t('dest.egypt.toursSubtitle', 'Handpicked Packages & Itineraries')}
          </span>
          <h2
            className="text-display-md text-obsidian-900 dark:text-ivory-50 font-display font-bold text-3xl md:text-4xl"
            style={{ fontFamily: "'Playfair Display', 'Cairo', serif" }}
          >
            {t('dest.egypt.toursTitle', 'أبرز برامج ورحلات مصر الفاخرة')}
          </h2>
        </div>

        {/* Filter & Sort by Duration */}
        {baseClassic9Tours.length > 0 && (
          <DurationSortFilter
            tours={baseClassic9Tours}
            onFilterChange={setDisplay9Tours}
            className="mb-8"
          />
        )}

        {/* 9 Base Standalone Tours Grid */}
        <m.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {(display9Tours.length > 0 ? display9Tours : baseClassic9Tours).map((tour, index) => (
            <TourCard key={tour.id || tour.slug} tour={tour} index={index} />
          ))}
        </m.div>
      </section>

      {/* Bottom Section: Curated Master Programs (باقات وبرامج مصر المختارة) */}
      {displayPackages.length > 0 && (
        <section className="container mx-auto px-6 mt-24" id="egypt-programs">
          <m.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="text-center mb-12"
          >
            <m.span
              variants={itemVariants}
              className="inline-block font-body text-gold-500 tracking-[0.2em] uppercase text-sm mb-4 font-bold"
            >
              {t('dest.egypt.programsSubtitle', 'Luxury Travel Programs in Egypt')}
            </m.span>
            <m.h2
              variants={itemVariants}
              className="text-display-lg text-obsidian-900 dark:text-ivory-50 mb-4 font-display"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t('dest.egypt.programsTitle', 'باقات وبرامج مختارة بعناية')}
            </m.h2>
            <m.p
              variants={itemVariants}
              className="text-body-lg text-obsidian-600 dark:text-ivory-300 max-w-2xl mx-auto"
            >
              {t(
                'dest.egypt.programsDesc',
                'اكتشف تشكيلة واسعة من البرامج الكلاسيكية، برامج شهر العسل، والرحلات الدينية المصممة وفق أعلى درجات الراحة.'
              )}
            </m.p>
          </m.div>

          <m.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
          >
            {displayPackages.map((pkg) => {
              const titleText = resolvePackageTitle(pkg, t, lang);
              const descText = resolvePackageDesc(pkg, t, lang);
              const linkUrl = pkg.link || (pkg.slug ? `/tours/${pkg.slug}` : '/destinations/egypt');
              const resolvedImage =
                pkg.imageUrl?.startsWith('http')
                  ? getOptimizedCloudinaryUrl(pkg.imageUrl, { width: 500, quality: 'auto:eco' })
                  : pkg.imageUrl || '/imgs/extensions-card.webp';

              return (
                <m.div
                  key={pkg.id || pkg.slug || linkUrl}
                  variants={itemVariants}
                  onClick={(e) => {
                    if (!e.target.closest('a, button')) navigate(linkUrl);
                  }}
                  className="populer-single-box style-classic group relative flex flex-col h-full bg-white dark:bg-[#061d5d] border border-primary-500/20 dark:border-gold-500/30 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(12,28,72,0.08)] hover:shadow-[0_24px_50px_rgba(245,166,35,0.28)] hover:border-gold-500 hover:-translate-y-2.5 transition-all duration-500 cursor-pointer text-left rtl:text-right"
                >
                  <div className="about-sp">
                    <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="75" cy="75" r="55" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45" />
                      <circle cx="75" cy="75" r="32" fill="#F5A623" opacity="0.2" />
                      <path d="M55 75 L75 55 L95 75" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                    </svg>
                  </div>
                  <div className="populer-thumb relative h-[255px] bg-gray-100 dark:bg-[#041446] dunas-img-container overflow-hidden rounded-t-2xl">
                    <Link to={linkUrl} className="block w-full h-full overflow-hidden">
                      <img
                        src={resolvedImage}
                        alt={titleText}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width="400"
                        height="255"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            'https://res.cloudinary.com/degbrq3ck/image/upload/v1783026771/8_mpyvu4.jpg';
                        }}
                      />
                    </Link>
                  </div>
                  <div className="populer-contnet flex flex-col flex-grow p-6 bg-white dark:bg-transparent">
                    <Link to={linkUrl}>
                      <h3
                        className="popular-title text-gray-900 dark:text-white group-hover:text-gold-500 dark:group-hover:text-gold-400 font-bold text-[22px] leading-snug line-clamp-2 mb-2.5 transition-colors duration-300"
                        style={{ fontFamily: "'Playfair Display', 'Cairo', serif" }}
                      >
                        {titleText}
                      </h3>
                    </Link>
                    <p className="text-gray-600 dark:text-slate-100 font-medium text-[14px] leading-relaxed line-clamp-3 mb-4 flex-grow">
                      {descText}
                    </p>
                    <div className="populer-btn-and-days pt-3.5 border-t border-gray-200 dark:border-gold-500/20 mt-auto flex items-center justify-end gap-3">
                      <div className="populer-btn defult-btn shrink-0">
                        <Link to={linkUrl} className="group/btn">
                          <span>{t('tourCard.viewDetails', 'عرض التفاصيل')}</span>
                          {isRtl ? (
                            <FaArrowLeft className="text-xs inline-block ml-2 rtl:mr-2 transform group-hover/btn:-translate-x-1.5 transition-transform duration-300" />
                          ) : (
                            <FaArrowRight className="text-xs inline-block ml-2 rtl:mr-2 transform group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                </m.div>
              );
            })}
          </m.div>
        </section>
      )}

      {/* Tailor-Made CTA Section */}
      <section className="relative py-24 mt-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://res.cloudinary.com/nclvl0iu/image/upload/v1790131551/egyothero.webp)' }}
        />

        <div className="relative z-10 container mx-auto px-6 text-center max-w-3xl">
          <span
            className="text-gold-400 uppercase tracking-widest text-sm font-bold block mb-4"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
          >
            {t('dest.egypt.ctaLabel', "DIDN'T FIND WHAT YOU'RE LOOKING FOR?")}
          </span>
          <h2
            className="text-display-xl text-white mb-6 font-display"
            style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 2px 16px rgba(0,0,0,0.95)' }}
          >
            {t('dest.egypt.ctaTitle', 'Let us design your perfect Egypt tour')}
          </h2>
          <p
            className="text-body-lg text-white mb-10 font-semibold"
            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.9)' }}
          >
            {t(
              'dest.egypt.ctaDesc',
              'Tell us your preferences, and our expert travel designers will craft a bespoke itinerary tailored just for you.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/tailor-a-tour">
              <Button variant="gold-glow" className="w-full sm:w-auto px-10 py-4 font-bold text-base">
                {t('home.tailorTour', 'Tailor Your Tour')}
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="glass" className="w-full sm:w-auto px-10 py-4 font-bold text-base text-white border-white/60">
                {t('nav.contact', 'Contact Us')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
