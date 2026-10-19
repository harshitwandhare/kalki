"use client";

import { useState, useEffect } from "react";

/**
 * A custom hook that provides a state that is persisted in localStorage.
 *
 * @param key The key to use in localStorage.
 * @param defaultValue The default value to use if no value is found in localStorage.
 * @returns A state and a function to update it.
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    // Prevent SSR access to localStorage
    if (typeof window === "undefined") {
      return defaultValue;
    }
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}
