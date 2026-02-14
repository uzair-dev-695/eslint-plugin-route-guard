import type { FrameworkContext } from './framework-detector';

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

export class PerformanceCache<K, V> {
  private cache = new Map<K, V>();
  private hits = 0;
  private misses = 0;
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hits++;
      this.cache.delete(key);
      this.cache.set(key, value);
    } else {
      this.misses++;
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
    };
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }
}

export const pathNormalizationCache = new PerformanceCache<string, string>(2000);
export const frameworkDetectionCache = new PerformanceCache<string, FrameworkContext>(500);
export const routerPrefixCache = new PerformanceCache<string, string>(1000);

export function clearAllCaches(): void {
  pathNormalizationCache.clear();
  frameworkDetectionCache.clear();
  routerPrefixCache.clear();
}

export function getAllCacheStats() {
  return {
    pathNormalization: pathNormalizationCache.getStats(),
    frameworkDetection: frameworkDetectionCache.getStats(),
    routerPrefix: routerPrefixCache.getStats(),
  };
}
