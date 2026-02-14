# Configuration Reference

Complete reference for all configuration options in eslint-plugin-route-guard.

## Table of Contents

- [Overview](#overview)
- [Basic Configuration](#basic-configuration)
- [Option Reference](#option-reference)
- [Preset Configurations](#preset-configurations)
- [Configuration Examples](#configuration-examples)

## Overview

The `no-duplicate-routes` rule accepts a configuration object with options for framework detection, path normalization, router tracking, file filtering, and more.

**Configuration Schema:**

```typescript
interface RouteGuardOptions {
  // Framework
  framework?: 'express' | 'fastify' | 'nestjs' | 'generic' | 'auto';
  
  // Path normalization
  pathNormalization?: {
    level?: 0 | 1 | 2;
    warnOnStaticVsDynamic?: boolean;
    preserveConstraints?: boolean;
  };
  
  // Router prefix resolution
  routerPrefixes?: {
    enabled?: boolean;
    maxDepth?: number;
  };
  
  // File filtering
  ignorePatterns?: string[];
  includePatterns?: string[];
  
  // Method filtering
  ignoreMethods?: string[];
  
  // Error reporting
  severity?: 'error' | 'warn';
  
  // NestJS-specific
  nestjs?: {
    globalPrefix?: string;
  };
  
  // Debugging
  debug?: boolean;
}
```

## Basic Configuration

### Minimal (Use Defaults)

```javascript
{
  "rules": {
    "route-guard/no-duplicate-routes": "error"
  }
}
```

**Defaults:**
- Auto framework detection
- Normalization level 1
- Router prefixes enabled
- No file/method filtering
- Report as errors

### With Options

```javascript
{
  "rules": {
    "route-guard/no-duplicate-routes": ["error", {
      "framework": "express",
      "pathNormalization": {
        "level": 1
      }
    }]
  }
}
```

## Option Reference

### `framework`

**Type:** `'express' | 'fastify' | 'nestjs' | 'generic' | 'auto'`  
**Default:** `'auto'`

Manually specify the framework.

**Values:**
- `'auto'` - Auto-detect from imports (recommended)
- `'express'` - Force Express detection
- `'fastify'` - Force Fastify detection
- `'nestjs'` - Force NestJS detection
- `'generic'` - Detect HTTP methods on any object

**When to use:**
- Auto-detection fails
- Mixed frameworks in monorepo (configure per directory)
- Custom framework not auto-detected

**Example:**

```javascript
{
  framework: 'express'
}
```

### `pathNormalization.level`

**Type:** `0 | 1 | 2`  
**Default:** `1`

Path comparison normalization level.

**Levels:**

| Level | Description | `/users/:id` vs `/users/:userId` |
|-------|-------------|----------------------------------|
| 0 | No normalization | Different routes (no error) |
| 1 | Normalize params | Same route (error) |
| 2 | Params + constraints | Same route (error) |

**Examples:**

**Level 0:**
```javascript
// No normalization - exact path matching
app.get('/users/:id', handler);
app.get('/users/:userId', handler);  // ✅ No error (different names)
```

**Level 1:**
```javascript
// Normalize parameter names
app.get('/users/:id', handler);
app.get('/users/:userId', handler);  // ❌ ERROR: Duplicate
```

**Level 2:**
```javascript
// Normalize params and constraints
app.get('/users/:id(\\d+)', handler);
app.get('/users/:userId(\\d+)', handler);  // ❌ ERROR: Duplicate
app.get('/users/:slug([a-z]+)', handler);  // ⚠️ WARNING: Different constraint
```

**Recommendation:** Use level 1 for most projects.

### `pathNormalization.warnOnStaticVsDynamic`

**Type:** `boolean`  
**Default:** `true`

Warn when static and dynamic segments conflict.

**Example:**

```javascript
// warnOnStaticVsDynamic: true
app.get('/users/admin', getAdmin);  // Static
app.get('/users/:id', getUser);     // Dynamic
// ⚠️ WARNING: Static route may never be reached

// warnOnStaticVsDynamic: false
// No warning
```

**When to disable:**
- You're confident about route order
- False positives in your codebase
- Using framework that handles this (Fastify)

### `pathNormalization.preserveConstraints`

**Type:** `boolean`  
**Default:** `true`

Consider regex constraints when comparing routes.

**Example:**

```javascript
// preserveConstraints: true
app.get('/users/:id(\\d+)', handler);  // Numbers
app.get('/users/:id([a-z]+)', handler);  // Letters
// ⚠️ WARNING: Different constraints

// preserveConstraints: false
app.get('/users/:id(\\d+)', handler);
app.get('/users/:id([a-z]+)', handler);
// ❌ ERROR: Duplicate (constraints ignored)
```

### `routerPrefixes.enabled`

**Type:** `boolean`  
**Default:** `true`

Enable router prefix tracking (Express/Fastify).

**Example:**

```javascript
// enabled: true
const router = express.Router();
router.get('/profile', handler);  // /profile
app.use('/users', router);        // Prefix: /users
// Effective: GET /users/profile ✅

// enabled: false
// Prefix not tracked, route seen as GET /profile only
```

**When to disable:**
- Not using routers/plugins
- Performance optimization (minimal)
- Debugging prefix issues

### `routerPrefixes.maxDepth`

**Type:** `number` (1-10)  
**Default:** `5`

Maximum router nesting depth.

**Example:**

```javascript
// Depth 1
app.use('/api', router1);

// Depth 2
router1.use('/v1', router2);

// Depth 3
router2.use('/users', router3);

// Depth 4
router3.use('/posts', router4);

// Depth 5
router4.use('/comments', router5);

// maxDepth: 5 → all prefixes resolved
// maxDepth: 3 → stops at depth 3
```

**Performance:** Lower values = faster analysis.

**Recommendation:** 3-5 for most projects.

### `ignorePatterns`

**Type:** `string[]` (glob patterns)  
**Default:** `[]`

Files/directories to exclude.

**Glob Syntax:**
- `*` - Matches single directory
- `**` - Matches any directories (recursive)
- `*.test.ts` - Matches test files
- `__tests__` - Matches directory

**Common Patterns:**

```javascript
{
  ignorePatterns: [
    // Test files
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/__tests__/**',
    '**/__mocks__/**',
    
    // Generated code
    '**/generated/**',
    '**/*.generated.ts',
    
    // Build output
    '**/dist/**',
    '**/build/**',
    
    // Legacy code
    '**/legacy/**',
    '**/deprecated/**',
    
    // Specific files
    'src/old-routes.ts'
  ]
}
```

### `includePatterns`

**Type:** `string[]` (glob patterns)  
**Default:** `[]` (all files)

Only check files matching these patterns.

**Example:**

```javascript
{
  includePatterns: [
    'src/routes/**',
    'src/api/**',
    'src/controllers/**',
    'apps/*/src/**/*.controller.ts'  // Monorepo
  ]
}
```

**Performance:** Significantly faster on large codebases.

**Use when:**
- Large project with many non-route files
- Monorepo (scope to specific packages)
- Only certain directories contain routes

### `ignoreMethods`

**Type:** `string[]` (case-insensitive)  
**Default:** `[]`

HTTP methods to skip.

**Example:**

```javascript
{
  ignoreMethods: ['OPTIONS', 'HEAD']
}
```

**Common use cases:**
- Auto-generated OPTIONS handlers
- HEAD requests derived from GET
- Custom/proprietary methods

**Supported values:** GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, ALL

### `severity`

**Type:** `'error' | 'warn'`  
**Default:** `'error'`

Report level for duplicates.

**Example:**

```javascript
// Report as warnings
{
  severity: 'warn'
}
```

**Use `warn` when:**
- Gradually adopting rule in legacy codebase
- Duplicates acceptable in your architecture
- Want visibility without blocking

### `nestjs.globalPrefix`

**Type:** `string`  
**Default:** `''`

Global prefix for all NestJS routes.

**Example:**

```javascript
{
  nestjs: {
    globalPrefix: 'api'
  }
}
```

**Matches:**

```typescript
// main.ts
app.setGlobalPrefix('api');

// Controller
@Controller('users')
class UsersController {
  @Get(':id')
  get() {}  // Effective: GET /api/users/:id
}
```

### `debug`

**Type:** `boolean`  
**Default:** `false`

Enable detailed logging.

**Example:**

```javascript
{
  debug: true
}
```

**Output:**

```
[no-duplicate-routes] Processing file: src/routes.ts
[no-duplicate-routes] Framework: express (confidence: 0.9)
[no-duplicate-routes] Registering: GET /users at line 10
```

**Use when:**
- Troubleshooting detection issues
- Verifying framework detection
- Debugging prefix resolution

## Preset Configurations

### Recommended (Default)

```javascript
import routeGuard from 'eslint-plugin-route-guard';

export default [routeGuard.configs.recommended];
```

**Settings:**
- Auto framework detection
- Normalization level 1
- Router prefixes enabled
- Error severity

### Express Preset

```javascript
export default [routeGuard.configs.express];
```

**Optimized for:**
- Express framework
- Router prefix resolution
- Common Express patterns

### Fastify Preset

```javascript
export default [routeGuard.configs.fastify];
```

**Optimized for:**
- Fastify framework
- Plugin registration patterns
- Fastify-specific syntax

### NestJS Preset

```javascript
export default [routeGuard.configs.nestjs];
```

**Optimized for:**
- NestJS decorators
- TypeScript support
- Controller-based routing

### Legacy Preset

```javascript
// .eslintrc.js (ESLint 8)
module.exports = {
  extends: ['plugin:route-guard/recommended']
};
```

## Configuration Examples

### Strict Configuration

Maximum duplicate detection:

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      pathNormalization: {
        level: 2,  // Normalize everything
        warnOnStaticVsDynamic: true,
        preserveConstraints: true
      },
      routerPrefixes: {
        enabled: true,
        maxDepth: 10  // Deep nesting
      },
      severity: 'error'
    }]
  }
}
```

### Relaxed Configuration

Minimal detection:

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['warn', {
      pathNormalization: {
        level: 0,  // Exact matching only
        warnOnStaticVsDynamic: false
      },
      severity: 'warn'
    }]
  }
}
```

### Performance-Optimized

Large codebase:

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      includePatterns: [
        'src/routes/**',
        'src/api/**'
      ],
      ignorePatterns: [
        '**/*.test.ts',
        '**/legacy/**'
      ],
      routerPrefixes: {
        maxDepth: 3  // Limit depth
      }
    }]
  }
}
```

### Monorepo Configuration

Nx/Turborepo:

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      includePatterns: [
        'apps/*/src/**/*.ts',
        'libs/*/src/**/*.controller.ts'
      ],
      ignorePatterns: [
        '**/*.spec.ts',
        'apps/e2e/**'
      ]
    }]
  }
}
```

### TypeScript Configuration

With type checking:

```javascript
import routeGuard from 'eslint-plugin-route-guard';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json'
      }
    }
  },
  routeGuard.configs.recommended
];
```

## Related Guides

- [Express Guide](./express.md)
- [Fastify Guide](./fastify.md)
- [NestJS Guide](./nestjs.md)
- [Rule Documentation](../rules/no-duplicate-routes.md)
