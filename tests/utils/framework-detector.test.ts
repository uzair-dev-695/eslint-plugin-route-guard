import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FrameworkDetector } from '../../src/utils/framework-detector';
import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

describe('FrameworkDetector', () => {
  let detector: FrameworkDetector;

  beforeEach(() => {
    detector = new FrameworkDetector();
  });

  function createProgram(imports: Array<{ source: string }>): TSESTree.Program {
    return {
      type: AST_NODE_TYPES.Program,
      body: imports.map((imp) => ({
        type: 'ImportDeclaration',
        source: {
          type: 'Literal',
          value: imp.source,
          raw: `'${imp.source}'`,
        },
        specifiers: [],
      })) as any,
      sourceType: 'module',
      loc: {} as any,
      range: [0, 0],
      comments: [],
      tokens: [],
    };
  }

  describe('Express detection', () => {
    it('detects Express from import', () => {
      const program = createProgram([{ source: 'express' }]);
      const ctx = detector.detect(program, {}, 'test.ts');

      expect(ctx.type).toBe('express');
      expect(ctx.confidence).toBe(0.9);
      expect(ctx.detectedFrom).toBe('imports');
    });

    it('caches Express detection', () => {
      const program = createProgram([{ source: 'express' }]);
      
      detector.detect(program, {}, 'test.ts');
      const cached = detector.detect(program, {}, 'test.ts');

      expect(cached.type).toBe('express');
      expect(detector.getCacheSize()).toBe(1);
    });
  });

  describe('Fastify detection', () => {
    it('detects Fastify from import', () => {
      const program = createProgram([{ source: 'fastify' }]);
      const ctx = detector.detect(program, {}, 'test.ts');

      expect(ctx.type).toBe('fastify');
      expect(ctx.confidence).toBe(0.9);
      expect(ctx.detectedFrom).toBe('imports');
    });
  });

  describe('NestJS detection', () => {
    it('detects NestJS from @nestjs/common import', () => {
      const program = createProgram([{ source: '@nestjs/common' }]);
      const ctx = detector.detect(program, {}, 'test.ts');

      expect(ctx.type).toBe('nestjs');
      expect(ctx.confidence).toBe(0.9);
      expect(ctx.detectedFrom).toBe('imports');
    });

    it('detects NestJS from @nestjs/core import', () => {
      const program = createProgram([{ source: '@nestjs/core' }]);
      const ctx = detector.detect(program, {}, 'test.ts');

      expect(ctx.type).toBe('nestjs');
    });
  });

  describe('Generic fallback', () => {
    it('falls back to generic when no framework detected', () => {
      const program = createProgram([{ source: 'some-other-lib' }]);
      const ctx = detector.detect(program, {}, 'test.ts');

      expect(ctx.type).toBe('generic');
      expect(ctx.confidence).toBe(0.5);
      expect(ctx.detectedFrom).toBe('heuristic');
    });

    it('uses generic for empty imports', () => {
      const program = createProgram([]);
      const ctx = detector.detect(program, {}, 'test.ts');

      expect(ctx.type).toBe('generic');
    });
  });

  describe('Manual override', () => {
    it('respects manual framework override', () => {
      const program = createProgram([{ source: 'express' }]);
      const ctx = detector.detect(program, { framework: 'fastify' }, 'test.ts');

      expect(ctx.type).toBe('fastify');
      expect(ctx.confidence).toBe(1.0);
      expect(ctx.detectedFrom).toBe('config');
    });

    it('caches manual override', () => {
      const program = createProgram([]);
      
      detector.detect(program, { framework: 'express' }, 'override.ts');
      const cached = detector.detect(program, {}, 'override.ts');

      expect(cached.type).toBe('express');
      expect(cached.confidence).toBe(1.0);
    });
  });

  describe('Caching', () => {
    it('caches detection per file', () => {
      const program1 = createProgram([{ source: 'express' }]);
      const program2 = createProgram([{ source: 'fastify' }]);

      detector.detect(program1, {}, 'file1.ts');
      detector.detect(program2, {}, 'file2.ts');

      expect(detector.getCacheSize()).toBe(2);
    });

    it('clears cache', () => {
      const program = createProgram([{ source: 'express' }]);
      detector.detect(program, {}, 'test.ts');

      expect(detector.getCacheSize()).toBe(1);

      detector.clearCache();

      expect(detector.getCacheSize()).toBe(0);
    });
  });

  describe('Debug logging', () => {
    it('logs detection when debug enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const program = createProgram([{ source: 'express' }]);

      detector.detect(program, {}, 'test.ts', true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Detected Express from imports')
      );

      consoleSpy.mockRestore();
    });

    it('logs cache hits when debug enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const program = createProgram([{ source: 'express' }]);

      detector.detect(program, {}, 'test.ts');
      detector.detect(program, {}, 'test.ts', true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using cached detection')
      );

      consoleSpy.mockRestore();
    });

    it('logs import count when debug enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const program = createProgram([{ source: 'other' }]);

      detector.detect(program, {}, 'test.ts', true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analyzing')
      );

      consoleSpy.mockRestore();
    });

    it('logs manual override when debug enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const program = createProgram([]);

      detector.detect(program, { framework: 'express' }, 'test.ts', true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Manual override: express')
      );

      consoleSpy.mockRestore();
    });
  });
});
