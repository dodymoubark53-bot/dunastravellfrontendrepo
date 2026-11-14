import { describe, expect, it } from 'vitest';
import { getTourPriceDisplay } from '../components/tour/TourCard';

describe('tour price display scenarios', () => {
  it('keeps a USD price payable and visible in PRICE mode', () => {
    expect(
      getTourPriceDisplay({
        basePriceUsd: '250.00',
        currency: 'USD',
        priceDisplayMode: 'PRICE',
      }),
    ).toEqual({
      displayPrice: 250,
      customPriceLabel: '',
      isCustomPrice: false,
      isPriceHidden: false,
    });
  });

  it('keeps an EUR price payable and visible in PRICE mode', () => {
    expect(
      getTourPriceDisplay({
        basePriceUsd: '180.00',
        currency: 'EUR',
        priceDisplayMode: 'PRICE',
      }),
    ).toMatchObject({
      displayPrice: 180,
      isCustomPrice: false,
      isPriceHidden: false,
    });
  });

  it('hides the price without converting hidden mode into a free tour', () => {
    expect(
      getTourPriceDisplay({
        basePriceUsd: '250.00',
        currency: 'USD',
        priceDisplayMode: 'HIDDEN',
      }),
    ).toMatchObject({
      displayPrice: 250,
      isPriceHidden: true,
      isCustomPrice: false,
    });
  });

  it('represents a genuinely complimentary tour as zero in PRICE mode', () => {
    expect(
      getTourPriceDisplay({
        basePriceUsd: '0.00',
        currency: 'USD',
        priceDisplayMode: 'PRICE',
      }),
    ).toMatchObject({
      displayPrice: 0,
      isPriceHidden: false,
      isCustomPrice: false,
    });
  });

  it('displays custom price label when mode is CUSTOM_LABEL and label is present', () => {
    expect(
      getTourPriceDisplay({
        basePriceUsd: '500.00',
        priceDisplayMode: 'CUSTOM_LABEL',
        priceLabel: 'Upon Request',
      }),
    ).toEqual({
      displayPrice: 500,
      customPriceLabel: 'Upon Request',
      isCustomPrice: true,
      isPriceHidden: false,
    });
  });

  it('resolves localized priceLabel object according to language', () => {
    const tour = {
      basePriceUsd: '500.00',
      priceDisplayMode: 'CUSTOM_LABEL',
      priceLabel: { en: 'Inquire Now', ar: 'تواصل معنا للسعر' },
    };
    expect(getTourPriceDisplay(tour, 'ar')).toEqual({
      displayPrice: 500,
      customPriceLabel: 'تواصل معنا للسعر',
      isCustomPrice: true,
      isPriceHidden: false,
    });
    expect(getTourPriceDisplay(tour, 'en')).toEqual({
      displayPrice: 500,
      customPriceLabel: 'Inquire Now',
      isCustomPrice: true,
      isPriceHidden: false,
    });
  });

  it('hides price when CUSTOM_LABEL mode has empty label', () => {
    expect(
      getTourPriceDisplay({
        basePriceUsd: '500.00',
        priceDisplayMode: 'CUSTOM_LABEL',
        priceLabel: '   ',
      }),
    ).toEqual({
      displayPrice: 500,
      customPriceLabel: '',
      isCustomPrice: false,
      isPriceHidden: true,
    });
  });

  it('correctly reads nested tour or raw priceDisplayMode', () => {
    expect(
      getTourPriceDisplay({
        id: 'jordan-tour-1',
        raw: {
          basePriceUsd: '350.00',
          priceDisplayMode: 'HIDDEN',
        },
      }),
    ).toMatchObject({
      displayPrice: 350,
      isPriceHidden: true,
      isCustomPrice: false,
    });
  });
});
