import { useEffect, useMemo, useState } from "react";

type CacheEnvelope<T> = {
  data: T;
  savedAt: number;
};

function getStorageKey(key: string) {
  return `barberstudio:offline:${key}`;
}

export function useOfflineQueryCache<T>(key: string, liveData: T | undefined | null) {
  const storageKey = useMemo(() => getStorageKey(key), [key]);
  const [cached, setCached] = useState<CacheEnvelope<T> | null>(null);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      setCached(item ? (JSON.parse(item) as CacheEnvelope<T>) : null);
    } catch {
      setCached(null);
    }
  }, [storageKey]);

  useEffect(() => {
    if (liveData === undefined || liveData === null) return;

    const next = { data: liveData, savedAt: Date.now() };
    setCached(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Storage may be unavailable in private mode or full devices.
    }
  }, [liveData, storageKey]);

  return cached;
}
