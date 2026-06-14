import { useDataSaverMode } from '../../lib/pwa/useDataSaverMode';

const LABELS: Record<string, string> = {
  full: 'Full',
  data_saver: 'Data Saver',
  ultra_light: 'Ultra Light',
};

const COLORS: Record<string, string> = {
  full: 'bg-green-100 text-green-800',
  data_saver: 'bg-amber-100 text-amber-800',
  ultra_light: 'bg-red-100 text-red-800',
};

export function DataSaverBadge() {
  const { mode } = useDataSaverMode();

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[mode] ?? ''}`}
    >
      {LABELS[mode] ?? mode}
    </span>
  );
}
