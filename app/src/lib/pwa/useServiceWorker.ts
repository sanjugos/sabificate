import { useState, useEffect, useCallback, useRef } from 'react';

interface ServiceWorkerState {
  needsUpdate: boolean;
  isRegistered: boolean;
  applyUpdate: () => void;
}

export function useServiceWorker(): ServiceWorkerState {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [wbInstance, setWbInstance] = useState<{
    messageSkipWaiting: () => void;
  } | null>(null);
  const userAppliedRef = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    async function register() {
      const { Workbox } = await import('workbox-window');
      if (cancelled) return;

      const wb = new Workbox('/sw.js');

      wb.addEventListener('waiting', () => {
        setNeedsUpdate(true);
      });

      wb.addEventListener('controlling', () => {
        if (userAppliedRef.current) {
          window.location.reload();
        }
      });

      await wb.register();
      if (!cancelled) {
        setIsRegistered(true);
        setWbInstance(wb);
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (wbInstance) {
      userAppliedRef.current = true;
      wbInstance.messageSkipWaiting();
    }
  }, [wbInstance]);

  return { needsUpdate, isRegistered, applyUpdate };
}
