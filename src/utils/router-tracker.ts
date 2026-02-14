/**
 * Router tracking utility for prefix resolution
 * Tracks Express Router() and Fastify plugin registrations
 * Associates prefixes with router instances across file scopes
 */

import type { TSESTree } from '@typescript-eslint/utils';
import { joinPaths, isRootPath } from './path-utils';

/**
 * Router binding information
 */
export interface RouterBinding {
  /** Router variable name (e.g., 'userRouter', 'router') */
  identifier: string;
  /** Framework type */
  framework: 'express' | 'fastify' | 'generic';
  /** Accumulated prefix chain */
  prefixes: string[];
  /** Nesting depth (1-based) */
  depth: number;
  /** File where router is defined */
  file: string;
  /** Whether router is exported */
  exported: boolean;
}

/**
 * Export tracking for cross-file resolution
 */
interface RouterExport {
  identifier: string;
  file: string;
  binding: RouterBinding;
}

/**
 * Import tracking for cross-file resolution
 */
interface RouterImport {
  identifier: string;
  localName: string;
  from: string;
  file: string;
}

/**
 * Configuration options for router tracking
 */
export interface RouterTrackerOptions {
  /** Maximum router nesting depth */
  maxDepth?: number;
  /** Warn on dynamic prefixes */
  warnOnDynamicPrefix?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Router tracker class
 * Tracks router creation, prefix application, and cross-file usage
 */
export class RouterTracker {
  public options: Required<RouterTrackerOptions>;
  
  /** Router bindings for current file */
  private bindings = new Map<string, RouterBinding>();
  
  /** Exported routers (cross-file tracking) */
  private exports = new Map<string, RouterExport[]>();
  
  /** Imported routers (cross-file tracking) */
  private imports = new Map<string, RouterImport[]>();
  
  /** Current file being analyzed */
  private currentFile = '';

  constructor(options: RouterTrackerOptions = {}) {
    this.options = {
      maxDepth: options.maxDepth ?? 5,
      warnOnDynamicPrefix: options.warnOnDynamicPrefix ?? true,
      debug: options.debug ?? false,
    };
  }

  /**
   * Reset tracker for new file analysis
   */
  resetFile(filePath: string): void {
    this.currentFile = filePath;
    this.bindings.clear();
    this.log(`Reset for file: ${filePath}`);
  }

  /**
   * Reset all tracking data (new lint run)
   */
  reset(): void {
    this.bindings.clear();
    this.exports.clear();
    this.imports.clear();
    this.currentFile = '';
    this.log('Full reset');
  }

  /**
   * Detect router creation and register binding
   * Supports:
   * - const router = express.Router()
   * - const router = Router() (imported)
   * - const { Router } = require('express')
   * 
   * @param node - Variable declarator or call expression
   * @param framework - Detected framework
   * @returns true if router binding was created
   */
  detectRouterCreation(
    node: TSESTree.VariableDeclarator | TSESTree.CallExpression,
    framework: 'express' | 'fastify' | 'generic'
  ): boolean {
    if (node.type === 'VariableDeclarator') {
      // const router = express.Router() or Router()
      if (
        node.id.type === 'Identifier' &&
        node.init?.type === 'CallExpression'
      ) {
        const callee = node.init.callee;
        
        // Check for express.Router() or fastify.Router()
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          (callee.property.name === 'Router' || callee.property.name === 'router')
        ) {
          this.registerBinding(node.id.name, framework);
          return true;
        }
        
        // Check for Router() (imported function)
        if (
          callee.type === 'Identifier' &&
          (callee.name === 'Router' || callee.name === 'router')
        ) {
          this.registerBinding(node.id.name, framework);
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Register a router binding
   */
  private registerBinding(identifier: string, framework: 'express' | 'fastify' | 'generic'): void {
    const binding: RouterBinding = {
      identifier,
      framework,
      prefixes: [],
      depth: 0,
      file: this.currentFile,
      exported: false,
    };
    
    this.bindings.set(identifier, binding);
    this.log(`Registered router binding: ${identifier} (${framework})`);
  }

  detectPrefixApplication(node: TSESTree.CallExpression): {
    targetRouter: string | null;
    prefix: string | null;
    isDynamic: boolean;
  } | null {
    if (
      node.callee.type !== 'MemberExpression' ||
      node.callee.property.type !== 'Identifier' ||
      node.callee.property.name !== 'use'
    ) {
      return null;
    }

    if (node.arguments.length < 2) {
      return null;
    }

    const prefixArg = node.arguments[0];
    const routerArg = node.arguments[1];

    if (!prefixArg || !routerArg) {
      return null;
    }

    let prefix: string | null = null;
    let isDynamic = false;

    if (prefixArg.type === 'Literal' && typeof prefixArg.value === 'string') {
      prefix = prefixArg.value;
    } else if (
      prefixArg.type === 'TemplateLiteral' &&
      prefixArg.expressions.length === 0
    ) {
      prefix = prefixArg.quasis[0]?.value.cooked ?? null;
    } else {
      isDynamic = true;
      this.log('Skipping dynamic prefix (not a literal string)');
    }

    let targetRouter: string | null = null;
    if (routerArg.type === 'Identifier') {
      targetRouter = routerArg.name;
    }

    return { targetRouter, prefix, isDynamic };
  }

  applyPrefix(identifier: string, prefix: string): boolean {
    const binding = this.bindings.get(identifier);
    
    if (!binding) {
      this.log(`Warning: Cannot apply prefix to unknown router '${identifier}'`);
      return false;
    }

    if (isRootPath(prefix)) {
      this.log(`Skipping empty/root prefix for router '${identifier}'`);
      return true;
    }

    const newDepth = binding.depth + 1;
    if (newDepth > this.options.maxDepth) {
      this.log(
        `Warning: Router nesting depth (${newDepth}) exceeds maximum (${this.options.maxDepth}). ` +
        `Prefix resolution may be incomplete for '${identifier}'.`
      );
      return false;
    }

    binding.prefixes.push(prefix);
    binding.depth = newDepth;
    
    this.log(`Applied prefix '${prefix}' to router '${identifier}' (depth: ${newDepth})`);
    return true;
  }

  getEffectivePrefix(identifier: string): string | null {
    const binding = this.bindings.get(identifier);
    
    if (!binding) {
      const imported = this.resolveImportedRouter(identifier);
      if (imported) {
        return imported;
      }
      return null;
    }

    if (binding.prefixes.length === 0) {
      return null;
    }

    return joinPaths(...binding.prefixes);
  }

  markExported(identifier: string): void {
    const binding = this.bindings.get(identifier);
    
    if (binding) {
      binding.exported = true;
      
      // Add to global exports
      const exportInfo: RouterExport = {
        identifier,
        file: this.currentFile,
        binding,
      };
      
      const existing = this.exports.get(identifier) ?? [];
      existing.push(exportInfo);
      this.exports.set(identifier, existing);
      
      this.log(`Marked router '${identifier}' as exported from ${this.currentFile}`);
    }
  }

  registerImport(identifier: string, localName: string, from: string): void {
    const importInfo: RouterImport = {
      identifier,
      localName,
      from,
      file: this.currentFile,
    };
    
    const existing = this.imports.get(localName) ?? [];
    existing.push(importInfo);
    this.imports.set(localName, existing);
    
    this.log(`Registered import: ${identifier} as ${localName} from ${from}`);
  }

  private resolveImportedRouter(localName: string): string | null {
    const exportMatches = this.exports.get(localName);
    
    if (!exportMatches || exportMatches.length === 0) {
      return null;
    }

    if (exportMatches.length > 1) {
      this.log(
        `Warning: Multiple exports found for '${localName}'. ` +
        `Cross-file resolution uncertain (using first match).`
      );
    }

    const match = exportMatches[0];
    if (!match) {
      return null;
    }

    const prefix = joinPaths(...match.binding.prefixes);
    this.log(`Resolved imported router '${localName}' with prefix: ${prefix}`);
    return prefix;
  }

  getBindings(): Map<string, RouterBinding> {
    return new Map(this.bindings);
  }

  private log(message: string): void {
    if (this.options.debug) {
      console.log(`[RouterTracker] ${message}`);
    }
  }
}

export const globalRouterTracker = new RouterTracker();
