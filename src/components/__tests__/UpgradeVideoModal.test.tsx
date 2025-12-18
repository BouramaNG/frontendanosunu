import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UpgradeVideoModal from '../components/UpgradeVideoModal';

describe('UpgradeVideoModal Component', () => {
  const mockOnClose = vi.fn();
  const mockUpgradeUrl = '/admin/upgrade';

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <UpgradeVideoModal
        isOpen={false}
        onClose={mockOnClose}
        upgradeUrl={mockUpgradeUrl}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <UpgradeVideoModal
        isOpen={true}
        onClose={mockOnClose}
        upgradeUrl={mockUpgradeUrl}
      />
    );
    expect(screen.getByText('Vidéos Premium')).toBeInTheDocument();
  });

  it('should display all required elements', () => {
    render(
      <UpgradeVideoModal
        isOpen={true}
        onClose={mockOnClose}
        upgradeUrl={mockUpgradeUrl}
      />
    );

    // Title
    expect(screen.getByText('Vidéos Premium')).toBeInTheDocument();
    expect(screen.getByText('Disponible uniquement en chambres payantes')).toBeInTheDocument();

    // Features
    expect(screen.getByText('Vidéos Courtes')).toBeInTheDocument();
    expect(screen.getByText('Engagement Max')).toBeInTheDocument();
    expect(screen.getByText('Contenu Exclusif')).toBeInTheDocument();

    // Buttons
    expect(screen.getByText('Annuler')).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('should call onClose when Annuler button is clicked', () => {
    render(
      <UpgradeVideoModal
        isOpen={true}
        onClose={mockOnClose}
        upgradeUrl={mockUpgradeUrl}
      />
    );

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('should navigate to upgradeUrl when Upgrade button is clicked', () => {
    const { location } = window;
    delete window.location;
    window.location = { href: '' } as any;

    render(
      <UpgradeVideoModal
        isOpen={true}
        onClose={mockOnClose}
        upgradeUrl={mockUpgradeUrl}
      />
    );

    const upgradeButton = screen.getByText('Upgrade');
    fireEvent.click(upgradeButton);

    expect(window.location.href).toBe(mockUpgradeUrl);

    window.location = location;
  });

  it('should have correct feature descriptions', () => {
    render(
      <UpgradeVideoModal
        isOpen={true}
        onClose={mockOnClose}
        upgradeUrl={mockUpgradeUrl}
      />
    );

    expect(screen.getByText('Jusqu\'à 60 secondes')).toBeInTheDocument();
    expect(screen.getByText('Captez l\'attention en vidéo')).toBeInTheDocument();
    expect(screen.getByText('Réservé à vos membres')).toBeInTheDocument();
  });

  it('should display motivational footer text', () => {
    render(
      <UpgradeVideoModal
        isOpen={true}
        onClose={mockOnClose}
        upgradeUrl={mockUpgradeUrl}
      />
    );

    expect(
      screen.getByText(/Les vidéos aident vos messages à être vus 10x plus souvent/)
    ).toBeInTheDocument();
  });
});
