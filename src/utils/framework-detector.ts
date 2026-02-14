/**
 * Framework detection utility
 * Auto-detects web framework from imports and code patterns
 */

import type { TSESTree } from '@typescript-eslint/utils';

/**
 * Framework detection context
 */
export interface FrameworkContext {
  /** Detected framework type */
  type: 'express' | 'fastify' | 'nestjs' | 'generic';
  /** Confidence level (0-1) */
  confidence: number;
  /** How framework was detected */
  detectedFrom: 'imports' | 'config' | 'heuristic';
}

/**
 * Framework detector class
 * Analyzes imports and caches detection results per file
 */
export class FrameworkDetector {
  private cache = new Map<string, FrameworkContext>();

  /**
   * Detect framework from Program AST node
   * 
   * @param program - Program AST node
   * @param options - Manual framework override from config
   * @param filePath - Current file path for caching
   * @param debug - Enable debug logging
   * @returns Framework detection context
   */
  detect(
    program: TSESTree.Program,
    options: { framework?: string },
    filePath: string,
    debug = false
  ): FrameworkContext {
    // Check cache first
    if (this.cache.has(filePath)) {
      const cached = this.cache.get(filePath)!;
      if (debug) {
        console.log(`[FrameworkDetector] Using cached detection for ${filePath}: ${cached.type} (${cached.confidence})`);
      }
      return cached;
    }

    // Manual override from config takes highest precedence
    if (options.framework) {
      const ctx: FrameworkContext = {
        type: options.framework as FrameworkContext['type'],
        confidence: 1.0,
        detectedFrom: 'config',
      };
      
      if (debug) {
        console.log(`[FrameworkDetector] Manual override: ${ctx.type}`);
      }
      
      this.cache.set(filePath, ctx);
      return ctx;
    }

    // Analyze imports
    const imports = program.body.filter(
      (node): node is TSESTree.ImportDeclaration => node.type === 'ImportDeclaration'
    );

    if (debug) {
      console.log(`[FrameworkDetector] Analyzing ${imports.length} import statements`);
    }

    // Detect Express
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
      
      this.cache.set(filePath, ctx);
      return ctx;
    }

    // Detect Fastify
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
      
      this.cache.set(filePath, ctx);
      return ctx;
    }

    // Detect NestJS (decorator-based)
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
      
      this.cache.set(filePath, ctx);
      return ctx;
    }

    // Generic fallback - no framework detected
    const ctx: FrameworkContext = {
      type: 'generic',
      confidence: 0.5,
      detectedFrom: 'heuristic',
    };
    
    if (debug) {
      console.log(`[FrameworkDetector] No specific framework detected, using generic mode`);
    }
    
    this.cache.set(filePath, ctx);
    return ctx;
  }

  /**
   * Clear detection cache
   * Useful for testing or when files change
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (for debugging)
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

/**
 * Global framework detector instance
 */
export const frameworkDetector = new FrameworkDetector();
