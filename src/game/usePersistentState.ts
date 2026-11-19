import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/**
 * State saved on the phone with AsyncStorage. `ready` turns true once the
 * saved value (if any) has been read. Stored objects are merged over
 * `initial`, so new fields get their defaults after an update.
 */
export function usePersistentState<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) setValue((v) => ({ ...v, ...JSON.parse(raw) }));
      })
      .catch(() => {
        // Unreadable saved state: keep the defaults.
      })
      .finally(() => setReady(true));
  }, [key]);

  const update = useCallback(
    (patch: Partial<T>) => {
      setValue((prev) => {
        const next = { ...prev, ...patch };
        AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [key],
  );

  return [value, update, ready] as const;
}
