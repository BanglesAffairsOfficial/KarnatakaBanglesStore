import { useEffect, useCallback } from "react";

/**
 * Custom hook to persist form data to localStorage and restore it on mount.
 * Automatically saves form data whenever it changes and restores it on component mount.
 */
export function useFormCache<T extends Record<string, any>>(
  key: string,
  state: T,
  setState: (state: T) => void,
  enabled: boolean = true
) {
  const cacheKey = `form_cache_${key}`;

  // Restore from cache on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setState(parsed);
        console.log(`[FormCache] Restored ${key}:`, parsed);
      }
    } catch (err) {
      console.error(`[FormCache] Failed to restore ${key}:`, err);
    }
  }, [key, cacheKey, setState, enabled]);

  // Save to cache whenever state changes
  useEffect(() => {
    if (!enabled) return;

    try {
      localStorage.setItem(cacheKey, JSON.stringify(state));
      console.log(`[FormCache] Saved ${key}`);
    } catch (err) {
      console.error(`[FormCache] Failed to save ${key}:`, err);
    }
  }, [state, key, cacheKey, enabled]);

  // Clear cache callback
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey);
      console.log(`[FormCache] Cleared ${key}`);
    } catch (err) {
      console.error(`[FormCache] Failed to clear ${key}:`, err);
    }
  }, [cacheKey, key]);

  return { clearCache };
}
