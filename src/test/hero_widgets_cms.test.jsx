import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LuxuryHeroSection from '../components/common/LuxuryHeroSection';
import api from '../utils/api';

vi.mock('../utils/api', () => ({
  default: { get: vi.fn() },
}));

describe('LuxuryHeroSection dashboard widgets', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it('overrides the built-in badge and icon chips with the page CMS config', async () => {
    api.get.mockResolvedValue({
      content: {
        pages: {
          p_global: {
            badge: 'Global badge',
            highlights: [{ id: 'g', icon: '🌍', text: 'Global chip' }],
          },
          p_programs_multi_country: {
            badge: 'CMS badge',
            badgeIcon: '🧭',
            highlights: [{ id: '1', icon: '✈️', text: 'CMS chip' }],
          },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/programs/multi-country']}>
        <LuxuryHeroSection
          title="Test Hero"
          badge="Original badge"
          highlights={['Original chip']}
        />
      </MemoryRouter>
    );

    expect(await screen.findByText('CMS badge')).toBeInTheDocument();
    expect(screen.getByText(/CMS chip/)).toBeInTheDocument();
    expect(screen.queryByText('Original badge')).not.toBeInTheDocument();
    expect(screen.queryByText(/Original chip/)).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith(
      '/cms/hero_widgets?lang=ar',
      expect.any(Object)
    );
  });
});
