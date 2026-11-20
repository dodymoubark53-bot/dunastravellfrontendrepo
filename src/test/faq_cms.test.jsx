import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import FAQ from '../pages/FAQ';
import { deepLocalizeCms } from '../hooks/useCmsBlock';
import * as useCmsBlockModule from '../hooks/useCmsBlock';

// Mock SEOHead and framer-motion
vi.mock('../components/seo/SEOHead', () => ({
  default: ({ title }) => <div data-testid="seo-title">{title}</div>,
}));

vi.mock('framer-motion', () => ({
  m: {
    div: ({ children, className }) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: { language: 'ar' },
  }),
}));

describe('deepLocalizeCms', () => {
  it('localizes field-level multilingual dictionaries', () => {
    const raw = {
      heading: {
        en: 'Frequently Asked Questions',
        ar: 'الأسئلة الشائعة والأكثر تكراراً',
        es: 'Preguntas Frecuentes',
      },
      helpCenter: {
        en: 'HELP CENTER',
        ar: 'مركز المساعدة',
      },
      items: [
        {
          id: 'faq-1',
          question: { en: 'How to book?', ar: 'كيف أحجز؟' },
          answer: { en: 'Online', ar: 'عبر الموقع' },
        },
      ],
    };

    const localized = deepLocalizeCms(raw, 'ar');
    expect(localized.heading).toBe('الأسئلة الشائعة والأكثر تكراراً');
    expect(localized.helpCenter).toBe('مركز المساعدة');
    expect(localized.items[0].question).toBe('كيف أحجز؟');
    expect(localized.items[0].answer).toBe('عبر الموقع');
  });

  it('keeps scalar strings untouched', () => {
    const raw = { heading: 'Hello World', count: 5 };
    const localized = deepLocalizeCms(raw, 'ar');
    expect(localized.heading).toBe('Hello World');
    expect(localized.count).toBe(5);
  });
});

describe('FAQ Component CMS resilience', () => {
  it('renders correctly without throwing when cmsData contains multilingual objects', () => {
    vi.spyOn(useCmsBlockModule, 'useCmsBlock').mockReturnValue({
      data: {
        heading: {
          ar: 'الأسئلة الشائعة التجريبية',
          en: 'Test FAQ Heading',
          es: 'Preguntas de Prueba',
          it: 'Domande di Prova',
          pt: 'Perguntas de Teste',
        },
        helpCenter: {
          ar: 'مركز المساعدة التجريبي',
          en: 'Test Help Center',
          es: 'Centro de Ayuda',
          it: 'Centro Assistenza',
          pt: 'Centro de Ajuda',
        },
        items: [
          {
            id: 'cms-test-1',
            category: 'general',
            question: {
              ar: 'سؤال تجريبي خاص؟',
              en: 'Special test question?',
            },
            answer: {
              ar: 'جواب تجريبي خاص.',
              en: 'Special test answer.',
            },
          },
        ],
      },
      loading: false,
      error: null,
    });

    render(<FAQ />);

    // Should render localized Arabic text from the CMS object, not throw React error #31
    expect(screen.getByText('مركز المساعدة التجريبي')).toBeInTheDocument();
    expect(screen.getAllByText('الأسئلة الشائعة التجريبية').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('سؤال تجريبي خاص؟')).toBeInTheDocument();
  });
});
