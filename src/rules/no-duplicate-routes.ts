/**
 * ESLint Rule: no-duplicate-routes
 * Detects duplicate route definitions across files
 */

import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { globalTracker, type RouteRegistration } from '../utils/route-tracker.js';
import { extractLiteralPath, isValidPath } from '../utils/path-extractor.js';
import { frameworkDetector, type FrameworkContext } from '../utils/framework-detector.js';

/**
 * Rule options interface
 */
export interface RuleOptions {
  /** Manual framework override */
  framework?: 'express' | 'fastify' | 'nestjs' | 'generic';
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * HTTP methods to detect
 */
const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',
  'all',
]);

/**
 * Create rule with TypeScript utils
 */
const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/user/eslint-plugin-route-guard/blob/main/docs/rules/${name}.md`
);

export default createRule<[RuleOptions], 'duplicateRoute'>({
  name: 'no-duplicate-routes',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow duplicate route definitions across files',
    },
    messages: {
      duplicateRoute: 'Duplicate route: {{method}} {{path}}\n  First defined: {{firstLocation}}\n  Also defined here',
    },
    schema: [
      {
        type: 'object',
        properties: {
          framework: {
            type: 'string',
            enum: ['express', 'fastify', 'nestjs', 'generic'],
          },
          debug: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ debug: false }],
  create(context) {
    const options = context.options[0] || {};
    const debug = options.debug || false;
    
    // Generate unique lint ID for this run
    const lintId = `${Date.now()}-${Math.random()}`;
    
    // Get source code for analysis
    const sourceCode = context.sourceCode || context.getSourceCode();
    const filename = context.filename || context.getFilename();
    
    // Framework detection context (set in Program visitor)
    let frameworkContext: FrameworkContext | null = null;

    /**
     * Log debug message if debug mode enabled
     */
    function debugLog(message: string): void {
      if (debug) {
        console.log(`[no-duplicate-routes] ${message}`);
      }
    }

    /**
     * Check if a method name is an HTTP method
     */
    function isHttpMethod(name: string): boolean {
      return HTTP_METHODS.has(name.toLowerCase());
    }

    /**
     * Extract method name from member expression
     */
    function extractMethodName(node: TSESTree.MemberExpression): string | null {
      if (node.property.type === 'Identifier') {
        const methodName = node.property.name;
        if (isHttpMethod(methodName)) {
          return methodName.toUpperCase();
        }
      }
      return null;
    }

    /**
     * Process a route registration call expression
     */
    function processRouteCall(node: TSESTree.CallExpression): void {
      // Must be a member expression: app.get(), router.post(), etc.
      if (node.callee.type !== 'MemberExpression') {
        return;
      }

      // Extract method name (get, post, etc.)
      const method = extractMethodName(node.callee);
      if (!method) {
        return;
      }

      // Extract path from first argument
      const firstArg = node.arguments[0];
      if (!firstArg) {
        debugLog(`Skipped route: ${method} - no arguments provided`);
        return;
      }

      const path = extractLiteralPath(firstArg, debug);
      if (!path) {
        // Not a literal path - skip (dynamic path)
        return;
      }

      if (!isValidPath(path)) {
        debugLog(`Skipped route: ${method} - empty path`);
        return;
      }

      // Create route registration
      const loc = node.loc;
      const route: RouteRegistration = {
        method,
        path,
        file: filename,
        line: loc.start.line,
        column: loc.start.column,
        node,
        framework: frameworkContext?.type,
      };

      debugLog(`Registering route: ${method} ${path} at ${filename}:${route.line}:${route.column}`);

      // Register route and check for duplicates
      const existingRoute = globalTracker.register(route);
      
      if (existingRoute) {
        // Duplicate found!
        const firstLocation = `${existingRoute.file}:${existingRoute.line}:${existingRoute.column}`;
        
        debugLog(`DUPLICATE DETECTED: ${method} ${path}`);
        debugLog(`  First: ${firstLocation}`);
        debugLog(`  Second: ${filename}:${route.line}:${route.column}`);

        context.report({
          node,
          messageId: 'duplicateRoute',
          data: {
            method,
            path,
            firstLocation,
          },
        });
      }
    }

    return {
      /**
       * Reset tracker and detect framework at the start of each file
       */
      Program(node) {
        globalTracker.reset(lintId);
        debugLog(`Initialized lint run: ${lintId}`);
        debugLog(`Processing file: ${filename}`);
        
        // Detect framework
        frameworkContext = frameworkDetector.detect(node, options, filename, debug);
        
        debugLog(`Framework: ${frameworkContext.type} (confidence: ${frameworkContext.confidence}, detected from: ${frameworkContext.detectedFrom})`);
        
        if (frameworkContext.type === 'generic') {
          debugLog(`Warning: No specific framework detected, using generic mode. HTTP methods will be detected on any object.`);
        }
      },

      /**
       * Process all call expressions to detect route registrations
       */
      CallExpression(node) {
        processRouteCall(node);
      },
    };
  },
});
