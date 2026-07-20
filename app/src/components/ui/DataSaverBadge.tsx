import { useDataSaverMode } from '../../lib/pwa/useDataSaverMode';
import type { DataSaverMode } from '../../../contracts/types';

const MODE_LABELS: Record<DataSaverMode, string> = {
  full: 'Full Quality',
  data_saver: 'Data Saver',
  ultra_light: 'Ultra Light',
};

const MODE_COLORS: Record<DataSaverMode, string> = {
  full: 'bg-green-100 text-green-700',
  data_saver: 'bg-amber-100 text-amber-700',
  ultra_light: 'bg-gray-100 text-gray-700',
};

/**
 * Compact badge that displays the current data saver mode.
 * Reads the mode from DataSaverContext via useDataSaverMode hook.
 */
export function DataSaverBadge() {
  const { mode } = useDataSaverMode();
  const label = MODE_LABELS[mode];
  const colorClass = MODE_COLORS[mode];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
