/**
 * Cross-file route tracking for duplicate detection
 * Manages route registrations across multiple files in a single ESLint run
 */

import type { TSESTree } from '@typescript-eslint/utils';

/**
 * Route registration information
 */
export interface RouteRegistration {
  /** HTTP method (uppercase: GET, POST, etc.) */
  method: string;
  /** Route path (literal string only in MVP) */
  path: string;
  /** Absolute file path where route is defined */
  file: string;
  /** Line number (1-based) */
  line: number;
  /** Column number (0-based) */
  column: number;
  /** AST node reference */
  node: TSESTree.Node;
  /** Detected framework (optional) */
  framework?: string;
}

/**
 * Tracks routes across files during a single ESLint lint run
 * Supports watch mode by isolating state per lint run
 */
export class RouteTracker {
  private routes = new Map<string, RouteRegistration>();
  private currentLintId: string | null = null;

  /**
   * Reset tracker for a new lint run
   * Clears all routes if lint ID changes (watch mode support)
   * 
   * @param lintId - Unique identifier for this lint run
   */
  reset(lintId: string): void {
    if (this.currentLintId !== lintId) {
      this.routes.clear();
      this.currentLintId = lintId;
    }
  }

  /**
   * Register a route and check for duplicates
   * 
   * @param route - Route registration to add
   * @returns Existing route if duplicate found, null if route is new
   */
  register(route: RouteRegistration): RouteRegistration | null {
    const key = `${route.method}:${route.path}`;
    const existing = this.routes.get(key);
    
    if (existing) {
      return existing; // Return first occurrence for error reporting
    }
    
    this.routes.set(key, route);
    return null;
  }

  /**
   * Get all registered routes (for debugging)
   * 
   * @returns Array of all route registrations
   */
  getRoutes(): RouteRegistration[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get current lint run ID
   * 
   * @returns Current lint ID or null if not initialized
   */
  getCurrentLintId(): string | null {
    return this.currentLintId;
  }

  /**
   * Clear all routes (for testing)
   */
  clear(): void {
    this.routes.clear();
    this.currentLintId = null;
  }
}

/**
 * Global route tracker instance
 * Shared across all files in a single ESLint run
 */
export const globalTracker = new RouteTracker();
