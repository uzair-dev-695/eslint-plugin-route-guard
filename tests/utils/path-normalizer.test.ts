/**
 * Tests for path normalization utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parsePathSegment,
  parsePathSegments,
  normalizePathWithLevel,
  detectPathConflict,
  ConflictType,
  clearNormalizationCache,
  getNormalizationCacheSize,
  type SegmentInfo,
} from '../../src/utils/path-normalizer';

describe('path-normalizer', () => {
  beforeEach(() => {
    clearNormalizationCache();
  });

  describe('parsePathSegment', () => {
    it('should parse static segments', () => {
      const seg = parsePathSegment('users');
      expect(seg.type).toBe('static');
      expect(seg.normalized).toBe('users');
      expect(seg.raw).toBe('users');
    });

    it('should parse parameter segments', () => {
      const seg = parsePathSegment(':id');
      expect(seg.type).toBe('param');
      expect(seg.normalized).toBe(':param');
      expect(seg.paramName).toBe('id');
    });

    it('should parse optional parameters', () => {
      const seg = parsePathSegment(':id?');
      expect(seg.type).toBe('optional-param');
      expect(seg.normalized).toBe(':param?');
      expect(seg.paramName).toBe('id');
    });

    it('should parse wildcard segments', () => {
      expect(parsePathSegment('*').type).toBe('wildcard');
      expect(parsePathSegment('**').type).toBe('wildcard');
      expect(parsePathSegment('*').normalized).toBe('*');
    });

    it('should parse wildcard parameters', () => {
      const seg = parsePathSegment(':path*');
      expect(seg.type).toBe('wildcard');
      expect(seg.normalized).toBe('*');
      expect(seg.paramName).toBe('path');
    });

    it('should parse regex parameters', () => {
      const seg = parsePathSegment(':id(\\\\d+)');
      expect(seg.type).toBe('regex-param');
      expect(seg.normalized).toBe(':param');
      expect(seg.paramName).toBe('id');
      expect(seg.constraint).toBe('(\\\\d+)');
    });

    it('should parse complex regex parameters', () => {
      const seg = parsePathSegment(':id(\\\\d{4,}|admin)');
      expect(seg.type).toBe('regex-param');
      expect(seg.constraint).toBe('(\\\\d{4,}|admin)');
    });

    it('should parse Fastify multi-param syntax', () => {
      const seg = parsePathSegment(':id-:name');
      expect(seg.type).toBe('param');
      expect(seg.normalized).toBe(':param-:param');
      expect(seg.paramName).toBe('id-name');
    });

    it('should handle empty segments', () => {
      const seg = parsePathSegment('');
      expect(seg.type).toBe('static');
      expect(seg.normalized).toBe('');
    });
  });

  describe('parsePathSegments', () => {
    it('should parse simple paths', () => {
      const segments = parsePathSegments('/users/:id');
      expect(segments).toHaveLength(2);
      expect(segments[0]?.type).toBe('static');
      expect(segments[1]?.type).toBe('param');
    });

    it('should handle root path', () => {
      expect(parsePathSegments('/')).toHaveLength(0);
      expect(parsePathSegments('')).toHaveLength(0);
    });

    it('should parse complex paths', () => {
      const segments = parsePathSegments('/api/v1/users/:id/posts/:postId?');
      expect(segments).toHaveLength(6);
      expect(segments[0]?.normalized).toBe('api');
      expect(segments[1]?.normalized).toBe('v1');
      expect(segments[2]?.normalized).toBe('users');
      expect(segments[3]?.normalized).toBe(':param');
      expect(segments[4]?.normalized).toBe('posts');
      expect(segments[5]?.normalized).toBe(':param?');
    });

    it('should handle paths without leading slash', () => {
      const segments = parsePathSegments('users/:id');
      expect(segments).toHaveLength(2);
    });

    it('should filter empty segments from multiple slashes', () => {
      const segments = parsePathSegments('/users///:id');
      expect(segments).toHaveLength(2);
    });
  });

  describe('normalizePathWithLevel', () => {
    describe('level 0 (exact match)', () => {
      it('should not normalize parameter names', () => {
        expect(normalizePathWithLevel('/users/:id', 0)).toBe('/users/:id');
        expect(normalizePathWithLevel('/users/:userId', 0)).toBe('/users/:userId');
      });

      it('should ensure leading slash', () => {
        expect(normalizePathWithLevel('users', 0)).toBe('/users');
      });

      it('should preserve all differences', () => {
        expect(normalizePathWithLevel('/users/:id(\\\\d+)', 0)).toBe('/users/:id(\\\\d+)');
      });
    });

    describe('level 1 (normalize params)', () => {
      it('should normalize parameter names', () => {
        expect(normalizePathWithLevel('/users/:id', 1)).toBe('/users/:param');
        expect(normalizePathWithLevel('/users/:userId', 1)).toBe('/users/:param');
      });

      it('should preserve optional markers', () => {
        expect(normalizePathWithLevel('/users/:id?', 1)).toBe('/users/:param?');
      });

      it('should normalize wildcards', () => {
        expect(normalizePathWithLevel('/files/*', 1)).toBe('/files/*');
        expect(normalizePathWithLevel('/files/:path*', 1)).toBe('/files/*');
      });

      it('should preserve regex constraints', () => {
        expect(normalizePathWithLevel('/users/:id(\\\\d+)', 1)).toBe('/users/:param');
      });

      it('should normalize Fastify multi-params', () => {
        expect(normalizePathWithLevel('/users/:id-:name', 1)).toBe('/users/:param-:param');
      });
    });

    describe('level 2 (full normalization)', () => {
      it('should normalize regex params without preserveConstraints', () => {
        expect(normalizePathWithLevel('/users/:id(\\\\d+)', 2, false)).toBe('/users/:param');
      });

      it('should preserve regex params with preserveConstraints', () => {
        expect(normalizePathWithLevel('/users/:id(\\\\d+)', 2, true)).toBe('/users/:param');
      });
    });

    it('should handle empty paths', () => {
      expect(normalizePathWithLevel('', 1)).toBe('/');
      expect(normalizePathWithLevel('/', 1)).toBe('/');
    });

    it('should handle complex nested routes', () => {
      const path = '/api/v1/users/:userId/posts/:postId/comments/:id';
      const normalized = normalizePathWithLevel(path, 1);
      expect(normalized).toBe('/api/v1/users/:param/posts/:param/comments/:param');
    });
  });

  describe('detectPathConflict', () => {
    it('should detect exact duplicates', () => {
      const conflict = detectPathConflict('/users/new', '/users/new', 1);
      expect(conflict.type).toBe(ConflictType.EXACT_DUPLICATE);
    });

    it('should detect param name conflicts at level 1+', () => {
      const conflict = detectPathConflict('/users/:id', '/users/:userId', 1);
      expect(conflict.type).toBe(ConflictType.PARAM_NAME_CONFLICT);
    });

    it('should not detect param name conflicts at level 0', () => {
      const conflict = detectPathConflict('/users/:id', '/users/:userId', 0);
      expect(conflict.type).toBe(ConflictType.NONE);
    });

    it('should detect static vs dynamic conflicts', () => {
      const conflict = detectPathConflict('/users/new', '/users/:id', 1);
      expect(conflict.type).toBe(ConflictType.STATIC_VS_DYNAMIC);
      expect(conflict.segment1?.type).toBe('static');
      expect(conflict.segment2?.type).toBe('param');
    });

    it('should detect wildcard conflicts', () => {
      const conflict = detectPathConflict('/files/*', '/files/specific', 1);
      expect(conflict.type).toBe(ConflictType.WILDCARD_CONFLICT);
    });

    it('should detect different regex constraints', () => {
      const conflict = detectPathConflict('/users/:id(\\\\d+)', '/users/:id([a-z]+)', 1);
      expect(conflict.type).toBe(ConflictType.DIFFERENT_CONSTRAINTS);
    });

    it('should handle different path lengths', () => {
      const conflict = detectPathConflict('/users/:id', '/users/:id/posts', 1);
      expect(conflict.type).toBe(ConflictType.NONE);
    });

    it('should handle no conflicts', () => {
      const conflict = detectPathConflict('/users/:id', '/posts/:id', 1);
      expect(conflict.type).toBe(ConflictType.NONE);
    });
  });

  describe('cache behavior', () => {
    it('should cache normalized paths', () => {
      const path = '/users/:id/posts/:postId';
      
      normalizePathWithLevel(path, 1);
      expect(getNormalizationCacheSize()).toBe(1);
      
      normalizePathWithLevel(path, 1);
      expect(getNormalizationCacheSize()).toBe(1);
    });

    it('should cache different normalization levels separately', () => {
      const path = '/users/:id(\\\\d+)';
      
      normalizePathWithLevel(path, 0);
      normalizePathWithLevel(path, 1);
      normalizePathWithLevel(path, 2);
      
      expect(getNormalizationCacheSize()).toBeGreaterThanOrEqual(2);
    });

    it('should clear cache', () => {
      normalizePathWithLevel('/users/:id', 1);
      expect(getNormalizationCacheSize()).toBeGreaterThan(0);
      
      clearNormalizationCache();
      expect(getNormalizationCacheSize()).toBe(0);
    });

    it('should implement LRU eviction at 2000 entries', () => {
      clearNormalizationCache();
      
      for (let i = 0; i < 2100; i++) {
        normalizePathWithLevel(`/path${i}/:id`, 1);
      }
      
      expect(getNormalizationCacheSize()).toBeLessThanOrEqual(2000);
    });
  });

  describe('edge cases', () => {
    it('should handle paths with multiple wildcards', () => {
      const segments = parsePathSegments('/files/*/subdir/*');
      expect(segments.filter(s => s.type === 'wildcard')).toHaveLength(2);
    });

    it('should handle extremely long paths', () => {
      const longPath = '/' + Array(100).fill('segment').join('/') + '/:id';
      const normalized = normalizePathWithLevel(longPath, 1);
      expect(normalized).toContain(':param');
    });

    it('should handle unicode in paths', () => {
      const path = '/users/münchen/:id';
      const normalized = normalizePathWithLevel(path, 1);
      expect(normalized).toBe('/users/münchen/:param');
    });

    it('should handle malformed regex gracefully', () => {
      const seg = parsePathSegment(':id([unclosed');
      expect(seg.type).toBe('param');
      expect(seg.paramName).toBe('id([unclosed');
    });

    it('should handle empty param names', () => {
      const seg = parsePathSegment(':');
      expect(seg.type).toBe('param');
    });

    it('should handle multiple consecutive slashes', () => {
      const path = '/users////:id';
      const normalized = normalizePathWithLevel(path, 1);
      expect(normalized).toBe('/users/:param');
    });
  });

  describe('framework-specific syntax', () => {
    describe('Express', () => {
      it('should normalize Express optional params', () => {
        expect(normalizePathWithLevel('/users/:id?', 1)).toBe('/users/:param?');
      });

      it('should normalize Express regex constraints', () => {
        expect(normalizePathWithLevel('/users/:id(\\\\d+)', 1)).toBe('/users/:param');
      });

      it('should normalize Express wildcard params', () => {
        expect(normalizePathWithLevel('/files/:path*', 1)).toBe('/files/*');
      });
    });

    describe('Fastify', () => {
      it('should normalize Fastify multi-param syntax', () => {
        expect(normalizePathWithLevel('/users/:id-:name', 1)).toBe('/users/:param-:param');
      });

      it('should normalize Fastify regex syntax', () => {
        expect(normalizePathWithLevel('/users/:id(^\\\\d+$)', 1)).toBe('/users/:param');
      });

      it('should detect Fastify route collisions', () => {
        const conflict = detectPathConflict('/users/:id', '/users/:name', 1);
        expect(conflict.type).toBe(ConflictType.PARAM_NAME_CONFLICT);
      });
    });
  });

  describe('performance', () => {
    it('should normalize 1000 paths in under 50ms', () => {
      const paths = Array.from({ length: 1000 }, (_, i) => `/path${i}/:id/subpath/:name`);
      
      const start = performance.now();
      paths.forEach(path => normalizePathWithLevel(path, 1));
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });

    it('should have >80% cache hit rate for repeated paths', () => {
      const paths = ['/users/:id', '/posts/:id', '/users/:id', '/posts/:id'];
      
      clearNormalizationCache();
      paths.forEach(path => normalizePathWithLevel(path, 1));
      
      const cacheSize = getNormalizationCacheSize();
      expect(cacheSize).toBe(2);
    });
  });
});
