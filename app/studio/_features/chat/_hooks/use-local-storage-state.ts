"use client";

import type { SetStateAction } from "react";
import { useCallback, useRef, useSyncExternalStore } from "react";

function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (action: SetStateAction<T>) => void] {
  const listeners = useRef(new Set<() => void>());

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      listeners.current.add(onStoreChange);
      return () => { listeners.current.delete(onStoreChange); };
    },
    []
  );

  const getSnapshot = useCallback(
    () => {
      try {
        return localStorage.getItem(key) ?? JSON.stringify(defaultValue);
      } catch {
        return JSON.stringify(defaultValue);
      }
    },
    [key, defaultValue]
  );

  const getServerSnapshot = useCallback(
    () => JSON.stringify(defaultValue),
    [defaultValue]
  );

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const value: T = JSON.parse(raw) as T;

  const set = useCallback(
    (action: SetStateAction<T>) => {
      const prev = readStorage(key, defaultValue);
      const next = action instanceof Function ? action(prev) : action;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch { }
      listeners.current.forEach((l) => l());
    },
    [key, defaultValue]
  );

  return [value, set];
}
