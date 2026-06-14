import { useState, useEffect, useCallback, useRef } from 'react';
import { NETWORK_TIMEOUTS, SYNC } from '../../../contracts/shared/constants';

type EffectiveType = keyof typeof NETWORK_TIMEOUTS;

interface NetworkStatus {
  isOnline: boolean;
  measuredThroughput: number | null;
  effectiveType: EffectiveType;
  timeout: number;
}

function deriveEffectiveType(throughputKbps: number | null): EffectiveType {
  if (throughputKbps === null) return 'unknown';
  if (throughputKbps >= 2000) return '4g';
  if (throughputKbps >= 400) return '3g';
  if (throughputKbps >= 50) return '2g';
  return 'slow-2g';
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [measuredThroughput, setMeasuredThroughput] = useState<number | null>(
    null,
  );
  const samplesRef = useRef<number[]>([]);

  const recordSample = useCallback((throughputKbps: number) => {
    const samples = samplesRef.current;
    samples.push(throughputKbps);
    if (samples.length > SYNC.THROUGHPUT_SAMPLE_COUNT) {
      samples.shift();
    }
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    setMeasuredThroughput(Math.round(avg));
  }, []);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Expose recordSample on window for other modules to call after fetches
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__recordNetworkSample =
      recordSample;
    return () => {
      delete (window as unknown as Record<string, unknown>)
        .__recordNetworkSample;
    };
  }, [recordSample]);

  const effectiveType = deriveEffectiveType(measuredThroughput);
  const timeout = NETWORK_TIMEOUTS[effectiveType];

  return { isOnline, measuredThroughput, effectiveType, timeout };
}
