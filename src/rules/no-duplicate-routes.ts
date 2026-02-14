/**
 * ESLint Rule: no-duplicate-routes
 * 
 * Detects duplicate and conflicting route definitions across files in Express,
 * Fastify, and NestJS applications. Supports router prefixes, path normalization,
 * and cross-file route tracking.
 * 
 * @module rules/no-duplicate-routes
 * @since 0.1.0
 * 
 * @example
 * // Detects duplicate routes
 * app.get('/users', handler1);
 * app.get('/users', handler2); // Error: Duplicate route
 * 
 * @example
 * // Detects conflicting parameterized routes
 * app.get('/users/:id', handler1);
 * app.get('/users/:userId', handler2); // Error: Conflicting route
 */

import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { globalTracker, type RouteRegistration } from '../utils/route-tracker.js';
import { extractLiteralPath, isValidPath } from '../utils/path-extractor.js';
import { frameworkDetector, type FrameworkContext } from '../utils/framework-detector.js';
import { globalRouterTracker } from '../utils/router-tracker.js';
import { joinPaths } from '../utils/path-utils.js';
import { 
  normalizePathWithLevel, 
  detectPathConflict, 
  ConflictType,
  type NormalizationLevel 
} from '../utils/path-normalizer.js';
import { 
  extractControllerPrefix, 
  extractMethodRoutes, 
  isNestJSController 
} from '../utils/nestjs-detector.js';
import { matchesGlobPatterns } from '../utils/glob-matcher.js';

/**
 * Rule options interface.
 * 
 * Configures how the rule detects and reports duplicate routes.
 */
export interface RuleOptions {
  /** Manual framework override (auto-detected by default) */
  framework?: 'express' | 'fastify' | 'nestjs' | 'generic';
  /** Maximum router nesting depth to track */
  maxRouterDepth?: number;
  /** Enable debug logging to console */
  debug?: boolean;
  /** Path normalization configuration */
  pathNormalization?: {
    /** Normalization level (0=none, 1=params, 2=params+optional) */
    level?: NormalizationLevel;
    /** Warn when static and dynamic paths might conflict */
    warnOnStaticVsDynamic?: boolean;
    /** Preserve regex constraints in normalized paths */
    preserveConstraints?: boolean;
  };
  /** NestJS-specific options */
  nestjs?: {
    /** Global prefix applied to all routes */
    globalPrefix?: string;
  };
  /** Glob patterns to ignore */
  ignorePatterns?: string[];
  /** Glob patterns to include (only check these files) */
  includePatterns?: string[];
  /** HTTP methods to ignore */
  ignoreMethods?: string[];
  /** Report severity */
  severity?: 'error' | 'warn';
}

/**
 * HTTP methods supported for route detection.
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
  (name) => `https://github.com/uzair-dev-695/eslint-plugin-route-guard/blob/main/docs/rules/${name}.md`
);

export default createRule<[RuleOptions], 'duplicateRoute' | 'conflictingRoute'>({
  name: 'no-duplicate-routes',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow duplicate route definitions across files',
    },
    messages: {
      duplicateRoute: 'Duplicate route: {{method}} {{path}}\n  First defined: {{firstLocation}}\n  Also defined here',
      conflictingRoute: 'Conflicting route: {{method}} {{path}}\n  Conflict type: {{conflictType}}\n  First defined: {{firstLocation}}\n  {{conflictMessage}}',
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
          pathNormalization: {
            type: 'object',
            properties: {
              level: {
                type: 'number',
                enum: [0, 1, 2],
              },
              warnOnStaticVsDynamic: {
                type: 'boolean',
              },
              preserveConstraints: {
                type: 'boolean',
              },
            },
            additionalProperties: false,
          },
          nestjs: {
            type: 'object',
            properties: {
              globalPrefix: {
                type: 'string',
              },
            },
            additionalProperties: false,
          },
          ignorePatterns: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          includePatterns: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          ignoreMethods: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          severity: {
            type: 'string',
            enum: ['error', 'warn'],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ 
    debug: false, 
    maxRouterDepth: 5,
    pathNormalization: {
      level: 1,
      warnOnStaticVsDynamic: true,
      preserveConstraints: false,
    },
  }],
  create(context) {
    const options = context.options[0] || {};
    const debug = options.debug || false;
    const maxRouterDepth = options.maxRouterDepth || 5;
    const pathNormalizationConfig = options.pathNormalization || {
      level: 1,
      warnOnStaticVsDynamic: true,
      preserveConstraints: false,
    };
    const normalizationLevel = pathNormalizationConfig.level ?? 1;
    const warnOnConflicts = pathNormalizationConfig.warnOnStaticVsDynamic ?? true;
    const nestjsGlobalPrefix = options.nestjs?.globalPrefix;
    const ignorePatterns = options.ignorePatterns || [];
    const includePatterns = options.includePatterns || [];
    const ignoreMethods = (options.ignoreMethods || []).map(m => m.toUpperCase());
    const severity = options.severity || 'error';
    
    // Generate unique lint ID for this run
    const lintId = `${Date.now()}-${Math.random()}`;
    
    // Get source code for analysis
    const sourceCode = context.sourceCode || context.getSourceCode();
    const filename = context.filename || context.getFilename();
    
    // Framework detection context (set in Program visitor)
    let frameworkContext: FrameworkContext | null = null;
    
    // Skip this file if it matches ignore patterns
    let shouldSkipFile = false;

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

      // Check if method should be ignored
      if (ignoreMethods.includes(method)) {
        debugLog(`Skipping ignored method: ${method}`);
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

      const normalizedPath = normalizePathWithLevel(
        effectivePath,
        normalizationLevel,
        pathNormalizationConfig.preserveConstraints
      );

      const loc = node.loc;
      const route: RouteRegistration = {
        method,
        path: normalizedPath,
        file: filename,
        line: loc.start.line,
        column: loc.start.column,
        node,
        framework: frameworkContext?.type,
      };

      debugLog(`Registering route: ${method} ${effectivePath} (normalized: ${normalizedPath}) at ${filename}:${route.line}:${route.column}`);

      const existingRoute = globalTracker.register(route);
      
      if (existingRoute) {
        const firstLocation = `${existingRoute.file}:${existingRoute.line}:${existingRoute.column}`;
        
        const conflict = detectPathConflict(effectivePath, existingRoute.path, normalizationLevel);
        
        debugLog(`DUPLICATE/CONFLICT DETECTED: ${method} ${effectivePath}`);
        debugLog(`  First: ${firstLocation}`);
        debugLog(`  Second: ${filename}:${route.line}:${route.column}`);
        debugLog(`  Conflict type: ${conflict.type}`);

        if (conflict.type === ConflictType.EXACT_DUPLICATE || conflict.type === ConflictType.PARAM_NAME_CONFLICT) {
          context.report({
            node,
            messageId: severity === 'warn' ? 'conflictingRoute' : 'duplicateRoute',
            data: {
              method,
              path: effectivePath,
              firstLocation,
              conflictType: conflict.type,
              conflictMessage: conflict.message,
            },
          });
        } else if (warnOnConflicts && conflict.type !== ConflictType.NONE) {
          context.report({
            node,
            messageId: 'conflictingRoute',
            data: {
              method,
              path: effectivePath,
              conflictType: conflict.type,
              firstLocation,
              conflictMessage: conflict.message,
            },
          });
        }
      }
    }

    function processNestJSController(node: TSESTree.ClassDeclaration): void {
      if (!frameworkContext || frameworkContext.type !== 'nestjs') {
        return;
      }

      if (!isNestJSController(node)) {
        return;
      }

      const controllerPrefix = extractControllerPrefix(node);
      if (controllerPrefix === null) {
        return;
      }

      debugLog(`NestJS Controller detected with prefix: '${controllerPrefix}'`);

      const routes = extractMethodRoutes(node, controllerPrefix);
      
      for (const nestRoute of routes) {
        // Check if method should be ignored
        if (ignoreMethods.includes(nestRoute.method)) {
          debugLog(`Skipping ignored method: ${nestRoute.method}`);
          continue;
        }

        let effectivePath = controllerPrefix && nestRoute.path
          ? joinPaths(controllerPrefix, nestRoute.path)
          : controllerPrefix || nestRoute.path;

        if (nestjsGlobalPrefix) {
          effectivePath = joinPaths(nestjsGlobalPrefix, effectivePath);
          debugLog(`Applied NestJS global prefix '${nestjsGlobalPrefix}': ${effectivePath}`);
        }

        const normalizedPath = normalizePathWithLevel(
          effectivePath,
          normalizationLevel,
          pathNormalizationConfig.preserveConstraints
        );

        const loc = nestRoute.node.loc;
        const route: RouteRegistration = {
          method: nestRoute.method,
          path: normalizedPath,
          file: filename,
          line: loc.start.line,
          column: loc.start.column,
          node: nestRoute.node,
          framework: 'nestjs',
        };

        debugLog(`Registering NestJS route: ${route.method} ${effectivePath} (normalized: ${normalizedPath}) at ${filename}:${route.line}:${route.column}`);

        const existingRoute = globalTracker.register(route);
        
        if (existingRoute) {
          const firstLocation = `${existingRoute.file}:${existingRoute.line}:${existingRoute.column}`;
          
          const conflict = detectPathConflict(effectivePath, existingRoute.path, normalizationLevel);
          
          debugLog(`DUPLICATE/CONFLICT DETECTED: ${route.method} ${effectivePath}`);
          debugLog(`  First: ${firstLocation}`);
          debugLog(`  Second: ${filename}:${route.line}:${route.column}`);
          debugLog(`  Conflict type: ${conflict.type}`);

          if (conflict.type === ConflictType.EXACT_DUPLICATE || conflict.type === ConflictType.PARAM_NAME_CONFLICT) {
            context.report({
              node: nestRoute.node,
              messageId: severity === 'warn' ? 'conflictingRoute' : 'duplicateRoute',
              data: {
                method: route.method,
                path: effectivePath,
                firstLocation,
                conflictType: conflict.type,
                conflictMessage: conflict.message,
              },
            });
          } else if (warnOnConflicts && conflict.type !== ConflictType.NONE) {
            context.report({
              node: nestRoute.node,
              messageId: 'conflictingRoute',
              data: {
                method: route.method,
                path: effectivePath,
                conflictType: conflict.type,
                firstLocation,
                conflictMessage: conflict.message,
              },
            });
          }
        }
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
        
        // Check ignore patterns
        if (ignorePatterns.length > 0 && matchesGlobPatterns(filename, ignorePatterns)) {
          shouldSkipFile = true;
          debugLog(`File matches ignore patterns, skipping: ${filename}`);
          return;
        }
        
        // Check include patterns
        if (includePatterns.length > 0 && !matchesGlobPatterns(filename, includePatterns)) {
          shouldSkipFile = true;
          debugLog(`File does not match include patterns, skipping: ${filename}`);
          return;
        }
        
        // Detect framework
        frameworkContext = frameworkDetector.detect(node, options, filename, debug);
        
        debugLog(`Framework: ${frameworkContext.type} (confidence: ${frameworkContext.confidence}, detected from: ${frameworkContext.detectedFrom})`);
        
        if (frameworkContext.type === 'generic') {
          debugLog(`Warning: No specific framework detected, using generic mode. HTTP methods will be detected on any object.`);
        }
      },

      ClassDeclaration(node) {
        if (shouldSkipFile) return;
        processNestJSController(node);
      },

      VariableDeclarator(node) {
        if (shouldSkipFile) return;
        processRouterCreation(node);
      },

      ExportNamedDeclaration(node) {
        if (shouldSkipFile) return;
        processExportDeclaration(node);
      },

      ImportDeclaration(node) {
        if (shouldSkipFile) return;
        processImportDeclaration(node);
      },

      CallExpression(node) {
        if (shouldSkipFile) return;
        processPrefixApplication(node);
        processRouteCall(node);
      },
    };
  },
});