/**
 * Tests for path normalization utilities
 */

import { describe, it, expect } from 'vitest';
import { joinPaths, normalizePath, isRootPath, getPathSegments } from '../../src/utils/path-utils';

describe('path-utils', () => {
  describe('joinPaths', () => {
    it('should join simple paths', () => {
      expect(joinPaths('/api', '/users')).toBe('/api/users');
      expect(joinPaths('/api', 'users')).toBe('/api/users');
      expect(joinPaths('api', 'users')).toBe('/api/users');
    });

    it('should handle trailing slashes', () => {
      expect(joinPaths('/api/', '/users')).toBe('/api/users');
      expect(joinPaths('/api/', 'users/')).toBe('/api/users');
      expect(joinPaths('/api', '/users/')).toBe('/api/users');
    });

    it('should handle empty parts', () => {
      expect(joinPaths('', '/users')).toBe('/users');
      expect(joinPaths('/api', '')).toBe('/api');
      expect(joinPaths('', '', '/users')).toBe('/users');
    });

    it('should handle root prefix', () => {
      expect(joinPaths('/', '/users')).toBe('/users');
      expect(joinPaths('/', 'users')).toBe('/users');
      expect(joinPaths('/api', '/')).toBe('/api');
    });

    it('should handle multiple slashes', () => {
      expect(joinPaths('/api//', '/users')).toBe('/api/users');
      expect(joinPaths('/api', '//users')).toBe('/api/users');
      expect(joinPaths('//api//', '//users//')).toBe('/api/users');
    });

    it('should handle multiple parts', () => {
      expect(joinPaths('/api', '/v1', '/users')).toBe('/api/v1/users');
      expect(joinPaths('/api', '/v1', '/users', '/profile')).toBe('/api/v1/users/profile');
      expect(joinPaths('api', 'v1', 'users')).toBe('/api/v1/users');
    });

    it('should handle all empty parts', () => {
      expect(joinPaths('', '', '')).toBe('/');
      expect(joinPaths('/', '/', '/')).toBe('/');
    });

    it('should handle single part', () => {
      expect(joinPaths('/users')).toBe('/users');
      expect(joinPaths('users')).toBe('/users');
      expect(joinPaths('/')).toBe('/');
    });

    it('should handle path parameters', () => {
      expect(joinPaths('/api', '/users/:id')).toBe('/api/users/:id');
      expect(joinPaths('/users', '/:userId/posts')).toBe('/users/:userId/posts');
    });

    it('should handle complex nested routes', () => {
      expect(joinPaths('/api', '/v1', '/users', '/:id', '/posts', '/:postId'))
        .toBe('/api/v1/users/:id/posts/:postId');
    });
  });

  describe('normalizePath', () => {
    it('should normalize multiple slashes', () => {
      expect(normalizePath('/api//users')).toBe('/api/users');
      expect(normalizePath('//api/users')).toBe('/api/users');
      expect(normalizePath('/api///users///')).toBe('/api/users/');
    });

    it('should ensure leading slash', () => {
      expect(normalizePath('api/users')).toBe('/api/users');
      expect(normalizePath('users')).toBe('/users');
    });

    it('should preserve trailing slash', () => {
      expect(normalizePath('/users/')).toBe('/users/');
      expect(normalizePath('/api/users/')).toBe('/api/users/');
    });

    it('should handle root path', () => {
      expect(normalizePath('/')).toBe('/');
      expect(normalizePath('//')).toBe('/');
    });

    it('should handle empty string', () => {
      expect(normalizePath('')).toBe('/');
    });

    it('should handle paths with parameters', () => {
      expect(normalizePath('/users/:id')).toBe('/users/:id');
      expect(normalizePath('users/:id/posts')).toBe('/users/:id/posts');
    });

    it('should not remove trailing slash from root', () => {
      expect(normalizePath('/')).toBe('/');
      expect(normalizePath('//')).toBe('/');
    });
  });

  describe('isRootPath', () => {
    it('should identify root paths', () => {
      expect(isRootPath('/')).toBe(true);
      expect(isRootPath('')).toBe(true);
    });

    it('should identify non-root paths', () => {
      expect(isRootPath('/api')).toBe(false);
      expect(isRootPath('/users')).toBe(false);
      expect(isRootPath('api')).toBe(false);
    });
  });

  describe('getPathSegments', () => {
    it('should extract segments from simple paths', () => {
      expect(getPathSegments('/api/users')).toEqual(['api', 'users']);
      expect(getPathSegments('/users')).toEqual(['users']);
    });

    it('should handle root path', () => {
      expect(getPathSegments('/')).toEqual([]);
    });

    it('should handle paths with parameters', () => {
      expect(getPathSegments('/api/:id/posts')).toEqual(['api', ':id', 'posts']);
      expect(getPathSegments('/users/:userId')).toEqual(['users', ':userId']);
    });

    it('should handle paths with wildcards', () => {
      expect(getPathSegments('/files/*')).toEqual(['files', '*']);
      expect(getPathSegments('/api/*/users')).toEqual(['api', '*', 'users']);
    });

    it('should filter empty segments', () => {
      expect(getPathSegments('/api//users')).toEqual(['api', 'users']);
    });

    it('should handle complex paths', () => {
      expect(getPathSegments('/api/v1/users/:id/posts/:postId'))
        .toEqual(['api', 'v1', 'users', ':id', 'posts', ':postId']);
    });
  });

  describe('integration scenarios', () => {
    it('should handle router prefix resolution', () => {
      // Scenario: app.use('/api', router); router.get('/users', ...)
      const prefix = '/api';
      const route = '/users';
      const effective = joinPaths(prefix, route);
      expect(effective).toBe('/api/users');
    });

    it('should handle nested router prefixes', () => {
      // Scenario: app.use('/api', r1); r1.use('/v1', r2); r2.get('/users', ...)
      const prefixes = ['/api', '/v1'];
      const route = '/users';
      const effective = joinPaths(...prefixes, route);
      expect(effective).toBe('/api/v1/users');
    });

    it('should handle messy paths correctly', () => {
      // Real-world scenario with inconsistent slash usage
      const prefix1 = '/api/';
      const prefix2 = '/v1/';
      const route = '/users/';
      const effective = joinPaths(prefix1, prefix2, route);
      expect(effective).toBe('/api/v1/users');
    });

    it('should handle empty prefix gracefully', () => {
      // Scenario: app.use('', router); router.get('/users', ...)
      const prefix = '';
      const route = '/users';
      const effective = joinPaths(prefix, route);
      expect(effective).toBe('/users');
    });

    it('should handle root prefix gracefully', () => {
      // Scenario: app.use('/', router); router.get('/users', ...)
      const prefix = '/';
      const route = '/users';
      const effective = joinPaths(prefix, route);
      expect(effective).toBe('/users');
    });
  });
});
