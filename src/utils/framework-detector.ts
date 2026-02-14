import type { TSESTree } from '@typescript-eslint/utils';
import { frameworkDetectionCache } from './performance-cache';

export interface FrameworkContext {
  type: 'express' | 'fastify' | 'nestjs' | 'generic';
  confidence: number;
  detectedFrom: 'imports' | 'config' | 'heuristic';
}

export class FrameworkDetector {
  detect(
    program: TSESTree.Program,
    options: { framework?: string },
    filePath: string,
    debug = false
  ): FrameworkContext {
    if (frameworkDetectionCache.get(filePath)) {
      const cached = frameworkDetectionCache.get(filePath)!;
      if (debug) {
        console.log(`[FrameworkDetector] Using cached detection for ${filePath}: ${cached.type} (${cached.confidence})`);
      }
      return cached;
    }

    if (options.framework) {
      const ctx: FrameworkContext = {
        type: options.framework as FrameworkContext['type'],
        confidence: 1.0,
        detectedFrom: 'config',
      };
      
      if (debug) {
        console.log(`[FrameworkDetector] Manual override: ${ctx.type}`);
      }
      
      frameworkDetectionCache.set(filePath, ctx);
      return ctx;
    }

    const imports = program.body.filter(
      (node): node is TSESTree.ImportDeclaration => node.type === 'ImportDeclaration'
    );

    if (debug) {
      console.log(`[FrameworkDetector] Analyzing ${imports.length} import statements`);
    }

    const hasExpressImport = imports.some((imp) => {
      if (imp.source.type === 'Literal' && typeof imp.source.value === 'string') {
        return imp.source.value === 'express';
      }
      return false;
    });

    if (hasExpressImport) {
      const ctx: FrameworkContext = {
        type: 'express',
        confidence: 0.9,
        detectedFrom: 'imports',
      };
      
      if (debug) {
        console.log(`[FrameworkDetector] Detected Express from imports`);
      }
      
      frameworkDetectionCache.set(filePath, ctx);
      return ctx;
    }

    const hasFastifyImport = imports.some((imp) => {
      if (imp.source.type === 'Literal' && typeof imp.source.value === 'string') {
        return imp.source.value === 'fastify';
      }
      return false;
    });

    if (hasFastifyImport) {
      const ctx: FrameworkContext = {
        type: 'fastify',
        confidence: 0.9,
        detectedFrom: 'imports',
      };
      
      if (debug) {
        console.log(`[FrameworkDetector] Detected Fastify from imports`);
      }
      
      frameworkDetectionCache.set(filePath, ctx);
      return ctx;
    }

    const hasNestJSImport = imports.some((imp) => {
      if (imp.source.type === 'Literal' && typeof imp.source.value === 'string') {
        const value = imp.source.value;
        return value.startsWith('@nestjs/');
      }
      return false;
    });

    if (hasNestJSImport) {
      const ctx: FrameworkContext = {
        type: 'nestjs',
        confidence: 0.9,
        detectedFrom: 'imports',
      };
      
      if (debug) {
        console.log(`[FrameworkDetector] Detected NestJS from imports`);
      }
      
      frameworkDetectionCache.set(filePath, ctx);
      return ctx;
    }

    const ctx: FrameworkContext = {
      type: 'generic',
      confidence: 0.5,
      detectedFrom: 'heuristic',
    };
    
    if (debug) {
      console.log(`[FrameworkDetector] No specific framework detected, using generic mode`);
    }
    
    frameworkDetectionCache.set(filePath, ctx);
    return ctx;
  }

  clearCache(): void {
    frameworkDetectionCache.clear();
  }

  getCacheSize(): number {
    return frameworkDetectionCache.getStats().size;
  }
}

export const frameworkDetector = new FrameworkDetector();
