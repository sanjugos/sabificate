import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { DataSaverMode } from '../../../contracts/types';

const STORAGE_KEY = 'sabificate:data-saver-mode';

const DATA_SAVER_TIERS: DataSaverMode[] = ['full', 'data_saver', 'ultra_light'];

function loadSaved(): DataSaverMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && DATA_SAVER_TIERS.includes(stored as DataSaverMode)) {
      return stored as DataSaverMode;
    }
  } catch {
    // localStorage unavailable
  }
  return 'data_saver';
}

interface DataSaverContextValue {
  mode: DataSaverMode;
  setMode: (mode: DataSaverMode) => void;
}

const DataSaverContext = createContext<DataSaverContextValue | null>(null);

export function DataSaverProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataSaverMode>(loadSaved);

  const setMode = useCallback((next: DataSaverMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <DataSaverContext.Provider value={{ mode, setMode }}>
      {children}
    </DataSaverContext.Provider>
  );
}

export function useDataSaverMode(): DataSaverContextValue {
  const ctx = useContext(DataSaverContext);
  if (!ctx) {
    throw new Error('useDataSaverMode must be used within DataSaverProvider');
  }
  return ctx;
}
