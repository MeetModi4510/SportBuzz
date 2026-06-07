// src/utils/football/cacheManager.ts
export const CACHE_PREFIX = 'football:';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiryMinutes: number;
}

export const cacheManager = {
  set<T>(key: string, data: T, expiryMinutes: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiryMinutes,
    };
    try {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn('Failed to set localStorage cache', e);
    }
  },

  get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      const isExpired = Date.now() - item.timestamp > item.expiryMinutes * 60 * 1000;

      if (isExpired) {
        this.remove(key);
        return null;
      }
      return item.data;
    } catch (e) {
      console.warn('Failed to get localStorage cache', e);
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (e) {}
  },

  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}
  }
};
