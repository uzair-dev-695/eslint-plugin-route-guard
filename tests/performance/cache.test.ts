import { describe, it, expect, beforeEach } from 'vitest';
import {
  PerformanceCache,
  pathNormalizationCache,
  frameworkDetectionCache,
  routerPrefixCache,
  clearAllCaches,
  getAllCacheStats,
} from '../../src/utils/performance-cache';

describe('PerformanceCache', () => {
  let cache: PerformanceCache<string, string>;

  beforeEach(() => {
    cache = new PerformanceCache<string, string>(3);
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should track cache hits', () => {
    cache.set('key1', 'value1');
    cache.get('key1');
    cache.get('key1');
    
    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(0);
  });

  it('should track cache misses', () => {
    cache.get('key1');
    cache.get('key2');
    
    const stats = cache.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(2);
  });

  it('should calculate hit rate correctly', () => {
    cache.set('key1', 'value1');
    cache.get('key1');
    cache.get('key1');
    cache.get('key2');
    
    const hitRate = cache.getHitRate();
    expect(hitRate).toBeCloseTo(0.6667, 3);
  });

  it('should return 0 hit rate when no operations', () => {
    expect(cache.getHitRate()).toBe(0);
  });

  it('should implement LRU eviction', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');
    
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
  });

  it('should move accessed items to end (LRU)', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.get('key1');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');
    
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeUndefined();
  });

  it('should clear all data and stats', () => {
    cache.set('key1', 'value1');
    cache.get('key1');
    cache.get('key2');
    
    cache.clear();
    
    const stats = cache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should track cache size', () => {
    cache.set('key1', 'value1');
    expect(cache.getStats().size).toBe(1);
    
    cache.set('key2', 'value2');
    expect(cache.getStats().size).toBe(2);
    
    cache.set('key3', 'value3');
    expect(cache.getStats().size).toBe(3);
    
    cache.set('key4', 'value4');
    expect(cache.getStats().size).toBe(3);
  });

  it('should handle updating existing keys', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key1', 'updated');
    
    expect(cache.get('key1')).toBe('updated');
    expect(cache.getStats().size).toBe(2);
  });
});

describe('Global caches', () => {
  beforeEach(() => {
    clearAllCaches();
  });

  it('should have separate caches for different purposes', () => {
    expect(pathNormalizationCache).toBeDefined();
    expect(frameworkDetectionCache).toBeDefined();
    expect(routerPrefixCache).toBeDefined();
  });

  it('should clear all caches with clearAllCaches', () => {
    pathNormalizationCache.set('path1', '/users');
    frameworkDetectionCache.set('file1', { type: 'express', confidence: 1, detectedFrom: 'imports' });
    routerPrefixCache.set('router1', '/api');
    
    clearAllCaches();
    
    expect(pathNormalizationCache.get('path1')).toBeUndefined();
    expect(frameworkDetectionCache.get('file1')).toBeUndefined();
    expect(routerPrefixCache.get('router1')).toBeUndefined();
  });

  it('should provide stats for all caches', () => {
    pathNormalizationCache.set('path1', '/users');
    frameworkDetectionCache.set('file1', { type: 'express', confidence: 1, detectedFrom: 'imports' });
    routerPrefixCache.set('router1', '/api');
    
    const stats = getAllCacheStats();
    
    expect(stats.pathNormalization.size).toBe(1);
    expect(stats.frameworkDetection.size).toBe(1);
    expect(stats.routerPrefix.size).toBe(1);
  });

  it('should track cache hits across all caches', () => {
    pathNormalizationCache.set('path1', '/users');
    pathNormalizationCache.get('path1');
    pathNormalizationCache.get('path1');
    
    frameworkDetectionCache.set('file1', { type: 'express', confidence: 1, detectedFrom: 'imports' });
    frameworkDetectionCache.get('file1');
    
    const stats = getAllCacheStats();
    
    expect(stats.pathNormalization.hits).toBe(2);
    expect(stats.frameworkDetection.hits).toBe(1);
  });
});
