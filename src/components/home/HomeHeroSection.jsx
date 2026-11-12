import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaPlay, FaTimes } from "react-icons/fa";
import "./HomeHeroSection.css";

// Rotating ring configuration
const VIDEO_RING_LABEL = "WATCH VIDEO";
const VIDEO_RING_COPIES = 3;

/**
 * Renders the hero description sentence with luxury gradient keyword highlights.
 * Highlights Egypt (and its equivalents in AR, ES, IT, PT) in radiant gold,
 * and Experts in luminous brand cyan, leaving the surrounding words crisp and elegant.
 */
function renderStyledHeroDesc(descText) {
  if (!descText) return null;
  return descText;
}

function getHeroEyebrowText(lang, isRtl) {
  if (isRtl) return "رحلات استكشافية فاخرة برعاية خبرائنا";
  const l = (lang || "").toLowerCase();
  if (l.startsWith("es")) return "EXPEDICIONES DE LUJO PERSONALIZADAS";
  if (l.startsWith("it")) return "SPEDIZIONI DI LUSSO SU MISURA";
  if (l.startsWith("pt")) return "EXPEDIÇÕES DE LUXO EXCLUSIVAS";
  return "CURATED LUXURY EXPEDITIONS";
}

const SLIDE_DATA = [
  {
    id: "hero-s1",
    bgClass: "slider-bg one",
    bgImage: "/imgs/slider-abu-simbel.webp",
    bgImage480: "/imgs/slider-abu-simbel-480.webp",
    bgImage800: "/imgs/slider-abu-simbel-800.webp",
    titlePart1: "luxury",
    titlePart2: "journey",
    desc: "Discover the magic of Egypt and its historical monuments with the help of Experts",
    btnText: "SEE DESTINATION",
    btnLink: "/destinations",
  },
  {
    id: "hero-s2",
    bgClass: "slider-bg two",
    bgImage: "/imgs/slider-pyramids.webp",
    bgImage480: "/imgs/slider-pyramids-480.webp",
    bgImage800: "/imgs/slider-pyramids-800.webp",
    titlePart1: "luxury",
    titlePart2: "journey",
    desc: "Discover the magic of Egypt and its historical monuments with the help of Experts",
    btnText: "SEE DESTINATION",
    btnLink: "/destinations",
  },
  {
    id: "hero-s3",
    bgClass: "slider-bg three",
    bgImage: "/imgs/slider-karnak.webp",
    bgImage480: "/imgs/slider-karnak-480.webp",
    bgImage800: "/imgs/slider-karnak-800.webp",
    titlePart1: "luxury",
    titlePart2: "journey",
    desc: "Discover the magic of Egypt and its historical monuments with the help of Experts",
    btnText: "SEE DESTINATION",
    btnLink: "/destinations",
  },
];

function HeroSlideItem({ slide, isActive, isRtl, setIsVideoOpen, t, lang }) {
  const watchVideoLabel = t("home.heroWatchVideo", "WATCH VIDEO");
  const ringPathId = `circlePath-${slide.id}`;
  const eyebrowText = getHeroEyebrowText(lang, isRtl);
  const rawDescText = t("home.heroDesc", slide.desc);

  const renderAnimatedWord = (text, startCharIdx = 0) => {
    if (!text) return null;
    if (isRtl) {
      // Arabic words must stay intact: splitting them into single letters would
      // break the cursive glyph joining. Each word therefore animates as one unit,
      // and the word gap mirrors the LTR gap (only between words, never trailing).
      const words = text.split(" ");

      return words.map((wordStr, wordIdx) => (
        <span
          key={wordIdx}
          className="char ar-word"
          style={{
            display: 'inline-block',
            marginInlineEnd: wordIdx < words.length - 1 ? '0.3em' : '0',
            '--char-index': startCharIdx + wordIdx,
          }}
        >
          {wordStr}
        </span>
      ));
    }

    let globalCharIndex = startCharIdx;
    const words = text.split(" ");

    return words.map((wordStr, wordIdx) => {
      const chars = wordStr.split("").map((char) => {
        const charElement = (
          <span
            key={globalCharIndex}
            className="char"
            style={{ display: 'inline-block', '--char-index': globalCharIndex }}
          >
            {char}
          </span>
        );
        globalCharIndex++;
        return charElement;
      });

      return (
        <span
          key={wordIdx}
          className="word-wrapper"
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            marginInlineEnd: wordIdx < words.length - 1 ? '0.3em' : '0'
          }}
        >
          {chars}
        </span>
      );
    });
  };

  return (
    <div
      className={`hero-slide ${isActive ? "active" : ""}`}
    >
      <div className="slider-section d-flex align-items-center">
        <div className={slide.bgClass}>
          <picture>
            <source media="(max-width: 480px)" srcSet={slide.bgImage480} />
            <source media="(max-width: 768px)" srcSet={slide.bgImage800} />
            <img
              className="slider-bg-img"
              src={slide.bgImage}
              srcSet={`${slide.bgImage480} 480w, ${slide.bgImage800} 800w, ${slide.bgImage} 1376w`}
              sizes="100vw"
              alt=""
              aria-hidden="true"
              decoding="async"
              loading={isActive ? "eager" : "lazy"}
              fetchPriority={isActive ? "high" : "low"}
            />
          </picture>
        </div>
        <div className="auto-container">
          <div className="row align-items-center d-flex">
            <div className="col-lg-12">
              <div className="hero_content">
                <h1 className="text-anime-3 hero-heading-1">
                  {renderAnimatedWord(t("home.heroTitle1", slide.titlePart1))}
                </h1>
                <h1 className="text-anime-3 hero-heading-2">
                  {renderAnimatedWord(t("home.heroTitle2", slide.titlePart2))}
                </h1>
                {/* Luxury Illuminated Subtitle Card */}
                <div className="hero-desc-glass-card">
                  <div className="hero-desc-content">
                    <div className="hero-desc-eyebrow">
                      <span className="hero-desc-sparkle" aria-hidden="true">✦</span>
                      <span className="hero-desc-badge-text">{eyebrowText}</span>
                    </div>
                    <p className="slider-contect-des">
                      {renderStyledHeroDesc(rawDescText)}
                    </p>
                  </div>
                </div>
                <div className="hero-btn defult-btn">
                    <Link to={slide.btnLink}>
                      {t("home.heroBtnText", slide.btnText)}
                      <svg
                        width="16"
                        height="12"
                        viewBox="0 0 16 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M14.96 4.9808C12.8146 4.9808 10.8592 3.0272 10.8592 0.88V0H9.0992V0.88C9.0992 2.44112 9.78384 3.90544 10.8583 4.9808H0V6.7408H10.8583C9.78384 7.81616 9.0992 9.28048 9.0992 10.8416V11.7216H10.8592V10.8416C10.8592 8.69528 12.8146 6.7408 14.96 6.7408H15.84V4.9808H14.96Z"
                          fill="white"
                        ></path>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rotating Circular Video Badge positioned at bottom-right (bottom-left in RTL) */}
          <div
            className="circle__video"
            onClick={() => setIsVideoOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              <defs>
                <path
                  id={ringPathId}
                  d="M 100, 100 m -78, 0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"
                ></path>
              </defs>
              <g className="rotate-text">
                <text className="no-capitalize">
                  {Array.from({ length: VIDEO_RING_COPIES }, (_, copyIndex) => (
                    <textPath
                      key={copyIndex}
                      className="no-capitalize"
                      href={`#${ringPathId}`}
                      startOffset={`${(copyIndex * 100) / VIDEO_RING_COPIES}%`}
                    >
                      {VIDEO_RING_LABEL}
                    </textPath>
                  ))}
                </text>
              </g>
            </svg>

            <button
              type="button"
              className="circle-vide_btn popup-video"
              onClick={(e) => {
                e.stopPropagation();
                setIsVideoOpen(true);
              }}
              aria-label={watchVideoLabel}
            >
              <span className="play-now">
                <FaPlay />
              </span>
            </button>
          </div>
        </div>
      </div>
  );
}

export default function HomeHeroSection() {
  const { t, i18n } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const isRtl = i18n.language === 'ar' || i18n.language?.startsWith('ar');

  // Infinite non-stop loop across all 3 slides (0 ➔ 1 ➔ 2 ➔ 0 ➔ 1 ➔ 2...)
  // Paused while the video modal is open so nothing moves behind it.
  useEffect(() => {
    if (isVideoOpen) return undefined;

    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % SLIDE_DATA.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isVideoOpen]);

  // Lock background scrolling while the video modal is open.
  useEffect(() => {
    if (!isVideoOpen || typeof document === "undefined") return undefined;

    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previous = {
      bodyOverflow: body.style.overflow,
      htmlOverflow: documentElement.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    };

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    // Compensate for the disappearing scrollbar to avoid a layout shift.
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previous.bodyOverflow;
      documentElement.style.overflow = previous.htmlOverflow;
      body.style.paddingRight = previous.bodyPaddingRight;
    };
  }, [isVideoOpen]);

  const handleSlideTo = (index) => {
    setActiveIndex(index);
  };

  return (
    <div
      className={`boxed ${isRtl ? "rtl" : "ltr"}`}
      dir={isRtl ? "rtl" : "ltr"}
      style={{ direction: isRtl ? "rtl" : "ltr", textAlign: isRtl ? "right" : "left" }}
    >
      <div className="main-slider-wrpper">
        <div className="slider__active_container">
          {SLIDE_DATA.map((slide, idx) => (
            <HeroSlideItem
              key={slide.id}
              slide={slide}
              isActive={activeIndex === idx}
              isRtl={isRtl}
              setIsVideoOpen={setIsVideoOpen}
              t={t}
              lang={i18n.language || "en"}
            />
          ))}

          {/* Dots Navigation Bar */}
          <div className="travel-slider-dots">
            {SLIDE_DATA.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSlideTo(idx)}
                className={`dot-slide ${activeIndex === idx ? "active" : ""}`}
                aria-label={`Go to slide ${idx + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </div>

      {/* Video Popup Modal (portaled to <body> so no ancestor transform/overflow can
          break its `position: fixed` viewport centering) */}
      {isVideoOpen && typeof document !== "undefined" &&
        createPortal(
          <div
            className="video-modal-backdrop"
            onClick={() => setIsVideoOpen(false)}
          >
            <div
              className="video-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="video-modal-close"
                onClick={() => setIsVideoOpen(false)}
              >
                <FaTimes />
              </button>
              <video
                controls
                autoPlay
                playsInline
                preload="auto"
                poster="https://res.cloudinary.com/degbrq3ck/video/upload/so_2/v1789316780/hero_jiyrsh.jpg"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" }}
              >
                {/* H.264 MP4 first — universal support */}
                <source
                  src="https://res.cloudinary.com/degbrq3ck/video/upload/v1789316780/hero_jiyrsh.mp4"
                  type="video/mp4"
                />
                {/* WebM/VP9 fallback for browsers with VP9 support */}
                <source
                  src="https://res.cloudinary.com/degbrq3ck/video/upload/v1789316780/hero_jiyrsh.webm"
                  type="video/webm"
                />
              </video>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
