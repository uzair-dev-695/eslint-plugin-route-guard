/**
 * ESLint Rule: no-duplicate-routes
 * Detects duplicate route definitions across files
 */

import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { globalTracker, type RouteRegistration } from '../utils/route-tracker.js';
import { extractLiteralPath, isValidPath } from '../utils/path-extractor.js';
import { frameworkDetector, type FrameworkContext } from '../utils/framework-detector.js';
import { globalRouterTracker } from '../utils/router-tracker.js';
import { joinPaths } from '../utils/path-utils.js';

/**
 * Rule options interface
 */
export interface RuleOptions {
  /** Manual framework override */
  framework?: 'express' | 'fastify' | 'nestjs' | 'generic';
  /** Maximum router nesting depth */
  maxRouterDepth?: number;
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
          maxRouterDepth: {
            type: 'number',
            minimum: 1,
            maximum: 10,
          },
          debug: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ debug: false, maxRouterDepth: 5 }],
  create(context) {
    const options = context.options[0] || {};
    const debug = options.debug || false;
    const maxRouterDepth = options.maxRouterDepth || 5;
    
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
     * Get router identifier from call expression object
     * Returns the identifier name if it's a simple identifier
     */
    function getRouterIdentifier(node: TSESTree.MemberExpression): string | null {
      if (node.object.type === 'Identifier') {
        return node.object.name;
      }
      return null;
    }

    function processRouterCreation(node: TSESTree.VariableDeclarator): void {
      if (!frameworkContext) return;
      
      const framework = frameworkContext.type === 'nestjs' ? 'generic' : frameworkContext.type;
      const detected = globalRouterTracker.detectRouterCreation(node, framework);
      
      if (detected && node.id.type === 'Identifier') {
        debugLog(`Detected router creation: ${node.id.name}`);
      }
    }

    function processPrefixApplication(node: TSESTree.CallExpression): void {
      const prefixInfo = globalRouterTracker.detectPrefixApplication(node);
      
      if (!prefixInfo) return;

      const { targetRouter, prefix, isDynamic } = prefixInfo;

      if (isDynamic) {
        debugLog('Skipping dynamic prefix (variable or expression)');
        return;
      }

      if (targetRouter && prefix) {
        const applied = globalRouterTracker.applyPrefix(targetRouter, prefix);
        if (applied) {
          debugLog(`Applied prefix '${prefix}' to router '${targetRouter}'`);
        }
      }
    }

    function processExportDeclaration(node: TSESTree.ExportNamedDeclaration): void {
      if (node.declaration?.type === 'VariableDeclaration') {
        for (const declarator of node.declaration.declarations) {
          if (declarator.id.type === 'Identifier') {
            globalRouterTracker.markExported(declarator.id.name);
            debugLog(`Marked router as exported: ${declarator.id.name}`);
          }
        }
      }
    }

    function processImportDeclaration(node: TSESTree.ImportDeclaration): void {
      if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
        const from = node.source.value;
        
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            const importedName = specifier.imported.type === 'Identifier' 
              ? specifier.imported.name 
              : specifier.imported.value;
            const localName = specifier.local.name;
            
            globalRouterTracker.registerImport(importedName, localName, from);
            debugLog(`Registered import: ${importedName} as ${localName} from ${from}`);
          }
        }
      }
    }

    function processRouteCall(node: TSESTree.CallExpression): void {
      if (node.callee.type !== 'MemberExpression') {
        return;
      }

      const method = extractMethodName(node.callee);
      if (!method) {
        return;
      }

      const firstArg = node.arguments[0];
      if (!firstArg) {
        debugLog(`Skipped route: ${method} - no arguments provided`);
        return;
      }

      const path = extractLiteralPath(firstArg, debug);
      if (!path) {
        return;
      }

      if (!isValidPath(path)) {
        debugLog(`Skipped route: ${method} - empty path`);
        return;
      }

      let effectivePath = path;
      const routerIdentifier = getRouterIdentifier(node.callee);
      
      if (routerIdentifier) {
        const routerPrefix = globalRouterTracker.getEffectivePrefix(routerIdentifier);
        if (routerPrefix) {
          effectivePath = joinPaths(routerPrefix, path);
          debugLog(`Router '${routerIdentifier}' has prefix: ${routerPrefix}`);
          debugLog(`Effective path: ${path} -> ${effectivePath}`);
        }
      }

      const loc = node.loc;
      const route: RouteRegistration = {
        method,
        path: effectivePath,
        file: filename,
        line: loc.start.line,
        column: loc.start.column,
        node,
        framework: frameworkContext?.type,
      };

      debugLog(`Registering route: ${method} ${effectivePath} at ${filename}:${route.line}:${route.column}`);

      const existingRoute = globalTracker.register(route);
      
      if (existingRoute) {
        const firstLocation = `${existingRoute.file}:${existingRoute.line}:${existingRoute.column}`;
        
        debugLog(`DUPLICATE DETECTED: ${method} ${effectivePath}`);
        debugLog(`  First: ${firstLocation}`);
        debugLog(`  Second: ${filename}:${route.line}:${route.column}`);

        context.report({
          node,
          messageId: 'duplicateRoute',
          data: {
            method,
            path: effectivePath,
            firstLocation,
          },
        });
      }
    }

    return {
      Program(node) {
        globalTracker.reset(lintId);
        globalRouterTracker.resetFile(filename);
        globalRouterTracker.options.maxDepth = maxRouterDepth;
        globalRouterTracker.options.debug = debug;
        
        debugLog(`Initialized lint run: ${lintId}`);
        debugLog(`Processing file: ${filename}`);
        
        // Detect framework
        frameworkContext = frameworkDetector.detect(node, options, filename, debug);
        
        debugLog(`Framework: ${frameworkContext.type} (confidence: ${frameworkContext.confidence}, detected from: ${frameworkContext.detectedFrom})`);
        
        if (frameworkContext.type === 'generic') {
          debugLog(`Warning: No specific framework detected, using generic mode. HTTP methods will be detected on any object.`);
        }
      },

      VariableDeclarator(node) {
        processRouterCreation(node);
      },

      ExportNamedDeclaration(node) {
        processExportDeclaration(node);
      },

      ImportDeclaration(node) {
        processImportDeclaration(node);
      },

      CallExpression(node) {
        processPrefixApplication(node);
        processRouteCall(node);
      },
    };
  },
});