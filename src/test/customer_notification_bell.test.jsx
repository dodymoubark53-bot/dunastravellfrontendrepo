import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CustomerNotificationBell from '../components/ui/CustomerNotificationBell';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'Test User' } }),
}));

vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ items: [], unreadCount: 0 }),
    patch: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../utils/sound', () => ({
  playNotificationSound: vi.fn(),
}));

function renderBell() {
  return render(
    <MemoryRouter>
      <CustomerNotificationBell />
    </MemoryRouter>
  );
}

const panelTitle = /^(الإشعارات|Notifications)$/;

describe('CustomerNotificationBell outside interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens when the bell is clicked', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText(panelTitle)).toBeInTheDocument();
  });

  it('closes when clicking outside the dropdown on desktop', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText(panelTitle)).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByText(panelTitle)).not.toBeInTheDocument();
  });

  it('closes on a touch/pen outside tap (pointer event)', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    fireEvent.pointerDown(document.body, { pointerType: 'touch' });
    expect(screen.queryByText(panelTitle)).not.toBeInTheDocument();
  });

  it('stays open when interacting inside the dropdown', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    fireEvent.pointerDown(screen.getByText(panelTitle));
    expect(screen.getByText(panelTitle)).toBeInTheDocument();
  });

  it('closes when pressing Escape', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText(panelTitle)).not.toBeInTheDocument();
  });

  it('closes when clicking outside via mousedown (desktop/laptop mouse)', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText(panelTitle)).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText(panelTitle)).not.toBeInTheDocument();
  });

  it('closes when tapping outside via touchstart (phone/tablet touch)', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText(panelTitle)).toBeInTheDocument();

    fireEvent.touchStart(document.body);
    expect(screen.queryByText(panelTitle)).not.toBeInTheDocument();
  });

  it('closes when tapping the backdrop overlay', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText(panelTitle)).toBeInTheDocument();

    const backdrop = screen.getByTestId('notification-backdrop');
    fireEvent.click(backdrop);
    expect(screen.queryByText(panelTitle)).not.toBeInTheDocument();
  });

  it('toggles closed when clicking the bell button again', () => {
    renderBell();
    const bellBtn = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bellBtn);
    expect(screen.getByText(panelTitle)).toBeInTheDocument();

    fireEvent.click(bellBtn);
    expect(screen.queryByText(panelTitle)).not.toBeInTheDocument();
  });
});
