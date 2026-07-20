import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextBlock } from '../components/content/TextBlock';
import { DataSaverBadge } from '../components/ui/DataSaverBadge';
import { DataSaverProvider } from '../lib/pwa/useDataSaverMode';

const MARKDOWN_WITH_IMAGE =
  'Hello world\n\n![A diagram of the architecture](https://example.com/arch.png)\n\nMore text here';

describe('Data Saver Mode — T-010', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('TextBlock image handling', () => {
    it('ultra_light: strips images and shows alt text as placeholder', () => {
      const { container } = render(
        <TextBlock content={MARKDOWN_WITH_IMAGE} dataSaverMode="ultra_light" />,
      );

      // No <img> element should be rendered
      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(0);

      // Alt text should be visible as a placeholder
      expect(screen.getByText(/A diagram of the architecture/)).toBeInTheDocument();
    });

    it('data_saver: renders images with max-width constraint of 480px', () => {
      const { container } = render(
        <TextBlock content={MARKDOWN_WITH_IMAGE} dataSaverMode="data_saver" />,
      );

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/arch.png');
      // Should have a max-width constraint class
      expect(images[0].className).toMatch(/max-w-\[480px\]/);
    });

    it('full: renders images at original quality without width constraint', () => {
      const { container } = render(
        <TextBlock content={MARKDOWN_WITH_IMAGE} dataSaverMode="full" />,
      );

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/arch.png');
      // Should have max-w-full (original quality), not the 480px constraint
      expect(images[0].className).toMatch(/max-w-full/);
      expect(images[0].className).not.toMatch(/max-w-\[480px\]/);
    });
  });

  describe('DataSaverBadge', () => {
    it('displays "Full Quality" label when mode is full', () => {
      localStorage.setItem('sabificate:data-saver-mode', 'full');
      render(
        <DataSaverProvider>
          <DataSaverBadge />
        </DataSaverProvider>,
      );
      expect(screen.getByText('Full Quality')).toBeInTheDocument();
    });

    it('displays "Data Saver" label when mode is data_saver', () => {
      localStorage.setItem('sabificate:data-saver-mode', 'data_saver');
      render(
        <DataSaverProvider>
          <DataSaverBadge />
        </DataSaverProvider>,
      );
      expect(screen.getByText('Data Saver')).toBeInTheDocument();
    });

    it('displays "Ultra Light" label when mode is ultra_light', () => {
      localStorage.setItem('sabificate:data-saver-mode', 'ultra_light');
      render(
        <DataSaverProvider>
          <DataSaverBadge />
        </DataSaverProvider>,
      );
      expect(screen.getByText('Ultra Light')).toBeInTheDocument();
    });
  });
});
