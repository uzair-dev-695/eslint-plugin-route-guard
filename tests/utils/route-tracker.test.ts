/**
 * Unit tests for RouteTracker utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RouteTracker, type RouteRegistration } from '../../src/utils/route-tracker';

describe('RouteTracker', () => {
  let tracker: RouteTracker;

  beforeEach(() => {
    tracker = new RouteTracker();
  });

  describe('reset()', () => {
    it('should clear routes when lint ID changes', () => {
      const route: RouteRegistration = {
        method: 'GET',
        path: '/users',
        file: 'test.ts',
        line: 1,
        column: 0,
        node: {} as any,
      };

      tracker.reset('lint-1');
      tracker.register(route);
      
      expect(tracker.getRoutes()).toHaveLength(1);

      // Different lint ID should clear routes
      tracker.reset('lint-2');
      expect(tracker.getRoutes()).toHaveLength(0);
    });

    it('should not clear routes when lint ID is the same', () => {
      const route: RouteRegistration = {
        method: 'GET',
        path: '/users',
        file: 'test.ts',
        line: 1,
        column: 0,
        node: {} as any,
      };

      tracker.reset('lint-1');
      tracker.register(route);
      
      expect(tracker.getRoutes()).toHaveLength(1);

      // Same lint ID should not clear routes
      tracker.reset('lint-1');
      expect(tracker.getRoutes()).toHaveLength(1);
    });
  });

  describe('register()', () => {
    beforeEach(() => {
      tracker.reset('test-lint');
    });

    it('should register new route and return null', () => {
      const route: RouteRegistration = {
        method: 'GET',
        path: '/users',
        file: 'test.ts',
        line: 1,
        column: 0,
        node: {} as any,
      };

      const result = tracker.register(route);
      
      expect(result).toBeNull();
      expect(tracker.getRoutes()).toHaveLength(1);
    });

    it('should detect duplicate route and return first occurrence', () => {
      const route1: RouteRegistration = {
        method: 'GET',
        path: '/users',
        file: 'test1.ts',
        line: 1,
        column: 0,
        node: {} as any,
      };

      const route2: RouteRegistration = {
        method: 'GET',
        path: '/users',
        file: 'test2.ts',
        line: 5,
        column: 2,
        node: {} as any,
      };

      tracker.register(route1);
      const duplicate = tracker.register(route2);
      
      expect(duplicate).toEqual(route1);
      expect(tracker.getRoutes()).toHaveLength(1); // Only first registered
    });

    it('should treat different methods as different routes', () => {
      const route1: RouteRegistration = {
        method: 'GET',
        path: '/users',
        file: 'test.ts',
        line: 1,
        column: 0,
        node: {} as any,
      };

      const route2: RouteRegistration = {
        method: 'POST',
        path: '/users',
        file: 'test.ts',
        line: 2,
        column: 0,
        node: {} as any,
      };

      const result1 = tracker.register(route1);
      const result2 = tracker.register(route2);
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(tracker.getRoutes()).toHaveLength(2);
    });

    it('should treat different paths as different routes', () => {
      const route1: RouteRegistration = {
        method: 'GET',
        path: '/users',
        file: 'test.ts',
        line: 1,
        column: 0,
        node: {} as any,
      };

      const route2: RouteRegistration = {
        method: 'GET',
        path: '/posts',
        file: 'test.ts',
        line: 2,
        column: 0,
        node: {} as any,
      };

      const result1 = tracker.register(route1);
      const result2 = tracker.register(route2);
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(tracker.getRoutes()).toHaveLength(2);
    });
  });

  describe('getRoutes()', () => {
    beforeEach(() => {
      tracker.reset('test-lint');
    });

    it('should return empty array initially', () => {
      expect(tracker.getRoutes()).toEqual([]);
    });

    it('should return all registered routes', () => {
      const routes: RouteRegistration[] = [
        {
          method: 'GET',
          path: '/users',
          file: 'test.ts',
          line: 1,
          column: 0,
          node: {} as any,
        },
        {
          method: 'POST',
          path: '/users',
          file: 'test.ts',
          line: 2,
          column: 0,
          node: {} as any,
        },
      ];

      routes.forEach((r) => tracker.register(r));
      
      expect(tracker.getRoutes()).toHaveLength(2);
    });
  });

  describe('getCurrentLintId()', () => {
    it('should return null initially', () => {
      expect(tracker.getCurrentLintId()).toBeNull();
    });

    it('should return current lint ID after reset', () => {
      tracker.reset('my-lint-id');
      expect(tracker.getCurrentLintId()).toBe('my-lint-id');
    });
  });

  describe('clear()', () => {
    it('should clear all routes and lint ID', () => {
      tracker.reset('lint-1');
      tracker.register({
        method: 'GET',
        path: '/users',
        file: 'test.ts',
        line: 1,
        column: 0,
        node: {} as any,
      });

      expect(tracker.getRoutes()).toHaveLength(1);
      expect(tracker.getCurrentLintId()).toBe('lint-1');

      tracker.clear();

      expect(tracker.getRoutes()).toHaveLength(0);
      expect(tracker.getCurrentLintId()).toBeNull();
    });
  });
});
