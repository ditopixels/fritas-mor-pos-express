
import { useState, useEffect } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class LocalCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

export const localCache = new LocalCache();

// Hook para usar cache local con fallback a React Query
export const useLocalCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
) => {
  const [data, setData] = useState<T | null>(localCache.get<T>(key));
  const [isLoading, setIsLoading] = useState(!localCache.has(key));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (localCache.has(key)) {
      setData(localCache.get<T>(key));
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchFn();
        localCache.set(key, result, ttlMs);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [key, ttlMs]);

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      localCache.clear(key);
      const result = await fetchFn();
      localCache.set(key, result, ttlMs);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch };
};
