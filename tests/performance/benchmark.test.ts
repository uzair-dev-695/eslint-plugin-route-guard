import { describe, it, expect, beforeEach } from 'vitest';
import { RuleTester } from '@typescript-eslint/rule-tester';
import noDuplicateRoutes from '../../src/rules/no-duplicate-routes';
import {
  generateLargeProject,
  generateMixedProject,
  getTotalRoutes,
} from './fixtures-generator';
import {
  clearAllCaches,
  getAllCacheStats,
  pathNormalizationCache,
} from '../../src/utils/performance-cache';
import { globalTracker } from '../../src/utils/route-tracker';

describe('Performance Benchmarks', () => {
  let ruleTester: RuleTester;

  beforeEach(() => {
    globalTracker.clear();
    clearAllCaches();
    
    ruleTester = new RuleTester({
      languageOptions: {
        parser: require('@typescript-eslint/parser'),
      },
    });
  });

  it('should handle 50 routes (small project) efficiently', () => {
    const files = generateLargeProject({
      fileCount: 10,
      routesPerFile: 5,
      framework: 'express',
    });

    expect(getTotalRoutes(files)).toBe(50);

    const start = performance.now();
    
    files.forEach(file => {
      ruleTester.run('no-duplicate-routes', noDuplicateRoutes, {
        valid: [{ code: file.content }],
        invalid: [],
      });
    });

    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(1000);
  });

  it('should handle 500 routes (medium project) efficiently', () => {
    const files = generateLargeProject({
      fileCount: 25,
      routesPerFile: 20,
      framework: 'express',
    });

    expect(getTotalRoutes(files)).toBe(500);

    const start = performance.now();
    
    files.forEach(file => {
      ruleTester.run('no-duplicate-routes', noDuplicateRoutes, {
        valid: [{ code: file.content }],
        invalid: [],
      });
    });

    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(3000);
  });

  it('should handle 1000 routes in <5000ms', () => {
    const files = generateLargeProject({
      fileCount: 50,
      routesPerFile: 20,
      framework: 'express',
    });

    expect(getTotalRoutes(files)).toBe(1000);

    const start = performance.now();
    
    files.forEach(file => {
      ruleTester.run('no-duplicate-routes', noDuplicateRoutes, {
        valid: [{ code: file.content }],
        invalid: [],
      });
    });

    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });

  it('should demonstrate cache statistics tracking', () => {
    const files = generateLargeProject({
      fileCount: 20,
      routesPerFile: 25,
      framework: 'express',
    });

    clearAllCaches();
    
    files.forEach(file => {
      ruleTester.run('no-duplicate-routes', noDuplicateRoutes, {
        valid: [{ code: file.content }],
        invalid: [],
      });
    });

    const stats = getAllCacheStats();
    
    expect(stats).toHaveProperty('pathNormalization');
    expect(stats).toHaveProperty('frameworkDetection');
    expect(stats).toHaveProperty('routerPrefix');
    expect(stats.pathNormalization).toHaveProperty('hits');
    expect(stats.pathNormalization).toHaveProperty('misses');
    expect(stats.pathNormalization).toHaveProperty('size');
  });

  it('should handle mixed project sizes', () => {
    const files = generateMixedProject(10, 10, 5);
    
    const totalRoutes = getTotalRoutes(files);
    expect(totalRoutes).toBeGreaterThan(0);

    const start = performance.now();
    
    files.forEach(file => {
      ruleTester.run('no-duplicate-routes', noDuplicateRoutes, {
        valid: [{ code: file.content }],
        invalid: [],
      });
    });

    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });

  it('should clear caches between lint runs', () => {
    const files = generateLargeProject({
      fileCount: 5,
      routesPerFile: 10,
      framework: 'express',
    });

    files.forEach(file => {
      ruleTester.run('no-duplicate-routes', noDuplicateRoutes, {
        valid: [{ code: file.content }],
        invalid: [],
      });
    });

    globalTracker.clear();
    
    const statsAfterClear = getAllCacheStats();
    expect(statsAfterClear.pathNormalization.size).toBe(0);
    expect(statsAfterClear.frameworkDetection.size).toBe(0);
    expect(statsAfterClear.routerPrefix.size).toBe(0);
  });

  it('should demonstrate cache statistics tracking', () => {
    const files = generateLargeProject({
      fileCount: 10,
      routesPerFile: 5,
      framework: 'express',
    });

    files.forEach(file => {
      ruleTester.run('no-duplicate-routes', noDuplicateRoutes, {
        valid: [{ code: file.content }],
        invalid: [],
      });
    });

    const stats = getAllCacheStats();
    expect(stats).toHaveProperty('pathNormalization');
    expect(stats).toHaveProperty('frameworkDetection');
    expect(stats).toHaveProperty('routerPrefix');
  });
});

describe('Memory Usage', () => {
  beforeEach(() => {
    globalTracker.clear();
    clearAllCaches();
  });

  it('should limit cache size to prevent memory bloat', () => {
    const files = generateLargeProject({
      fileCount: 100,
      routesPerFile: 20,
      framework: 'express',
    });

    const ruleTester = new RuleTester({
      languageOptions: {
        parser: require('@typescript-eslint/parser'),
      },
    });

    files.forEach(file => {
      ruleTester.run('no-duplicate-routes', noDuplicateRoutes, {
        valid: [{ code: file.content }],
        invalid: [],
      });
    });

    const stats = getAllCacheStats();
    
    expect(stats.pathNormalization.size).toBeLessThanOrEqual(2000);
    expect(stats.frameworkDetection.size).toBeLessThanOrEqual(500);
    expect(stats.routerPrefix.size).toBeLessThanOrEqual(1000);
  });

  it('should clear routes after lint run', () => {
    const files = generateLargeProject({
      fileCount: 10,
      routesPerFile: 10,
      framework: 'express',
    });

    const ruleTester = new RuleTester({
      languageOptions: {
        parser: require('@typescript-eslint/parser'),
      },
    });

    files.forEach(file => {
      ruleTester.run('no-duplicate-routes', noDuplicateRoutes, {
        valid: [{ code: file.content }],
        invalid: [],
      });
    });

    globalTracker.clear();
    
    expect(globalTracker.getRoutes().length).toBe(0);
  });
});
