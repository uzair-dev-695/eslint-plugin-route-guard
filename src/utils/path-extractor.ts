/**
 * Path extraction utilities for route detection
 * Handles literal strings and simple template literals
 */

import type { TSESTree } from '@typescript-eslint/utils';

/**
 * Extract literal path from AST node
 * Supports:
 * - String literals: '/users'
 * - Template literals WITHOUT expressions: `'/users'`
 * 
 * Skips (returns null):
 * - Template literals WITH expressions: `'/users/${id}'`
 * - Variables: userPath
 * - Computed expressions: '/users' + suffix
 * - Non-string types
 * 
 * @param node - AST node to extract path from
 * @param debug - Enable debug logging
 * @returns Extracted path string or null if not a literal
 */
export function extractLiteralPath(
  node: TSESTree.Node | null | undefined,
  debug = false
): string | null {
  if (!node) {
    if (debug) {
      console.log('[PathExtractor] Skipped: node is null or undefined');
    }
    return null;
  }

  // String literal: '/users'
  if (node.type === 'Literal' && typeof node.value === 'string') {
    const path = node.value;
    if (debug) {
      console.log(`[PathExtractor] Extracted string literal: "${path}"`);
    }
    return path;
  }

  // Template literal: `'/users'` (without expressions)
  if (node.type === 'TemplateLiteral') {
    // Template literal with expressions contains ${...}
    if (node.expressions.length > 0) {
      if (debug) {
        console.log('[PathExtractor] Skipped: template literal contains expressions');
      }
      return null;
    }

    // Simple template literal without expressions
    if (node.quasis.length === 1 && node.quasis[0]) {
      const path = node.quasis[0].value.cooked;
      if (path !== null && path !== undefined) {
        if (debug) {
          console.log(`[PathExtractor] Extracted template literal: "${path}"`);
        }
        return path;
      }
    }

    if (debug) {
      console.log('[PathExtractor] Skipped: template literal has invalid structure');
    }
    return null;
  }

  // All other node types (variables, computed, etc.)
  if (debug) {
    console.log(`[PathExtractor] Skipped: unsupported node type "${node.type}"`);
  }
  return null;
}

/**
 * Check if a node is a literal path (without extracting)
 * Useful for quick validation
 * 
 * @param node - AST node to check
 * @returns True if node is a literal path
 */
export function isLiteralPath(node: TSESTree.Node | null | undefined): boolean {
  if (!node) return false;

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return true;
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0 && node.quasis.length === 1) {
    return true;
  }

  return false;
}

/**
 * Validate that a path is non-empty
 * 
 * @param path - Path string to validate
 * @returns True if path is valid (non-empty)
 */
export function isValidPath(path: string | null): boolean {
  return path !== null && path !== undefined && path.trim().length > 0;
}
