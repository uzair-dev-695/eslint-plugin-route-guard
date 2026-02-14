# eslint-plugin-route-guard

[![npm version](https://img.shields.io/npm/v/eslint-plugin-route-guard.svg)](https://www.npmjs.com/package/eslint-plugin-route-guard)
[![Build Status](https://img.shields.io/github/actions/workflow/status/uzair-dev-695/eslint-plugin-route-guard/ci.yml?branch=main)](https://github.com/uzair-dev-695/eslint-plugin-route-guard/actions)
[![Coverage](https://img.shields.io/codecov/c/github/uzair-dev-695/eslint-plugin-route-guard)](https://codecov.io/gh/uzair-dev-695/eslint-plugin-route-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/eslint-plugin-route-guard.svg)](https://nodejs.org)

> ESLint plugin to detect duplicate and conflicting routes across Express, Fastify, and NestJS applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [ESLint 9+ (Flat Config)](#eslint-9-flat-config)
  - [ESLint 8.x (Legacy Config)](#eslint-8x-legacy-config)
  - [Framework-Specific Presets](#framework-specific-presets-phase-4)
- [Supported Frameworks](#supported-frameworks)
- [Rules](#rules)
- [Configuration](#configuration)
  - [Rule Options](#rule-options)
  - [Framework Options](#framework-options)
  - [Path Normalization Options](#path-normalization-options-phase-3)
  - [Router Configuration](#router-configuration-phase-2)
  - [File Filtering](#file-filtering-phase-4)
  - [Method Filtering](#method-filtering-phase-4)
  - [Error Reporting](#error-reporting-phase-4)
  - [NestJS Configuration](#nestjs-configuration-phase-4)
  - [Debug Mode](#debug-mode)
- [Advanced Examples](#advanced-examples)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Performance Tips](#performance-tips)
- [Migration Guide](#migration-guide)
- [Examples](#examples)
- [API Documentation](#api-documentation)
- [Current Capabilities](#current-capabilities)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Security](#security)

## Quick Start

Get started in 5 minutes:

**1. Install the plugin:**

```bash
npm install --save-dev eslint-plugin-route-guard
```

**2. Configure ESLint (Flat Config - ESLint 9+):**

```javascript
// eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';

export default [routeGuard.configs.recommended];
```

**3. Run ESLint:**

```bash
npx eslint .
```

**4. Fix duplicate routes:**

That's it! The plugin will now detect duplicate routes in your Express, Fastify, or NestJS application.

**Example output:**

```
error  Duplicate route detected: GET /users/profile
  First defined:  src/routes/users.ts:15:3
  Also defined here  (route-guard/no-duplicate-routes)
```

## Features

- 🔍 **Cross-file detection** - Find duplicate routes across your entire codebase
- 🧩 **Router prefix resolution** - Correctly resolves Express router prefixes and nested routes (Phase 2)
- 🚀 **Multi-framework support** - Works with Express, Fastify, NestJS, and generic HTTP methods
- 🎯 **Auto-detection** - Automatically detects your framework from imports
- 🔧 **Path normalization** - Configurable normalization levels for parameter matching (Phase 3)
- ⚙️ **Advanced configuration** - File patterns, method filtering, custom severity (Phase 4)
- 🏷️ **NestJS decorators** - Full support for @Controller and HTTP method decorators (Phase 4)
- 📦 **Framework presets** - Pre-configured settings for Express, Fastify, and NestJS (Phase 4)
- ⚡ **High performance** - Optimized caching for large codebases with 1000+ routes (Phase 5)
- 💾 **Smart caching** - LRU caches for path normalization, framework detection, and router prefixes (Phase 5)
- 📝 **TypeScript first** - Written in TypeScript with full type safety

## Installation

Install the plugin as a dev dependency using your preferred package manager:

**npm:**
```bash
npm install --save-dev eslint-plugin-route-guard
```

**yarn:**
```bash
yarn add --dev eslint-plugin-route-guard
```

**pnpm:**
```bash
pnpm add --save-dev eslint-plugin-route-guard
```

**Peer Dependencies:**

This plugin requires ESLint 8.0+ or 9.0+. Install ESLint if you haven't already:

```bash
npm install --save-dev eslint
```

**TypeScript Projects:**

If you're using TypeScript, you'll also need `@typescript-eslint/parser`:

```bash
npm install --save-dev @typescript-eslint/parser
```

## Requirements

- Node.js >= 18.0.0
- ESLint >= 8.0.0 || >= 9.0.0

## Usage

### ESLint 9+ (Flat Config)

```javascript
// eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';

export default [
  {
    plugins: {
      'route-guard': routeGuard
    },
    rules: {
      'route-guard/no-duplicate-routes': 'error'
    }
  }
];
```

Or use the recommended configuration:

```javascript
// eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';

export default [
  routeGuard.configs.recommended
];
```

### Framework-Specific Presets (Phase 4)

Use optimized presets for your framework:

```javascript
// For Express
import routeGuard from 'eslint-plugin-route-guard';
export default [routeGuard.configs.express];

// For Fastify
import routeGuard from 'eslint-plugin-route-guard';
export default [routeGuard.configs.fastify];

// For NestJS
import routeGuard from 'eslint-plugin-route-guard';
export default [routeGuard.configs.nestjs];
```

### ESLint 8.x (Legacy Config)

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['route-guard'],
  extends: ['plugin:route-guard/recommended'],
  rules: {
    'route-guard/no-duplicate-routes': 'error'
  }
};
```

## Supported Frameworks

- **Express** - Route definitions via `app.get()`, `router.post()`, etc. with full router prefix support
- **Fastify** - Route definitions via `fastify.get()`, `server.post()`, etc. with multi-param syntax
- **NestJS** - Decorator-based routes via `@Controller()`, `@Get()`, `@Post()`, etc. with global prefix support ✨ NEW!
- **Generic** - Any HTTP method calls (get, post, put, delete, patch, etc.)

## Rules

### `no-duplicate-routes`

Detects duplicate route definitions across files.

**Status:** ✅ Available (Phases 1-4 Complete)

**Examples of incorrect code:**

```javascript
// ❌ Same file duplicates
app.get('/users', getUsers);
app.get('/users', getUsersBackup);  // Error: Duplicate route

// ❌ Cross-file duplicates
// file1.ts
app.post('/api/data', handleData);

// file2.ts
app.post('/api/data', processData);  // Error: Duplicate route
```

**Examples of correct code:**

```javascript
// ✅ Different methods
app.get('/users', getUsers);
app.post('/users', createUser);

// ✅ Different paths
app.get('/users', getUsers);
app.get('/posts', getPosts);

// ✅ Different parameter names (normalized with level 1+)
app.get('/users/:id', getUser);
app.get('/users/:userId', getUserById);  // OK with level 0, WARNING with level 1+

// ✅ Router prefix resolution (Phase 2)
const userRouter = express.Router();
userRouter.get('/profile', getProfile);  // Route: /profile
app.use('/api/users', userRouter);       // Prefix: /api/users
// Effective path: /api/users/profile (no conflict)

app.get('/api/posts/profile', getPostProfile);  // Different path
```

**Note:** As of Phase 2, router prefixes are automatically resolved! As of Phase 3, path normalization detects parameter conflicts. As of Phase 4, NestJS decorators are fully supported!

## Configuration

### Rule Options

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      // Framework configuration
      framework: 'express',    // Manual framework override
      
      // Path normalization (Phase 3)
      pathNormalization: {
        level: 1,              // 0=none, 1=params, 2=params+constraints
        warnOnStaticVsDynamic: true,
        preserveConstraints: true
      },
      
      // Router configuration (Phase 2)
      routerPrefixes: {
        enabled: true,
        maxDepth: 5
      },
      
      // File filtering (Phase 4)
      ignorePatterns: ['**/*.test.ts', '**/generated/**'],
      includePatterns: ['src/**/*.ts'],
      
      // Method filtering (Phase 4)
      ignoreMethods: ['OPTIONS', 'HEAD'],
      
      // Error reporting (Phase 4)
      severity: 'error',       // 'error' or 'warn'
      
      // NestJS configuration (Phase 4)
      nestjs: {
        globalPrefix: 'api'    // Global prefix for NestJS routes
      },
      
      // Debug mode
      debug: false
    }]
  }
}
```

#### Framework Options

**`framework`** (optional): `'express' | 'fastify' | 'nestjs' | 'generic'`
- Manually specify framework instead of auto-detection
- Default: Auto-detected from imports

#### Path Normalization Options (Phase 3)

**`pathNormalization.level`** (optional): `0 | 1 | 2`
- `0`: No normalization - `/users/:id` ≠ `/users/:userId`
- `1`: Normalize parameter names - `/users/:id` = `/users/:userId`
- `2`: Normalize parameters + constraints - `/users/:id(\\d+)` = `/users/:userId(\\d+)`
- Default: `1`

**`pathNormalization.warnOnStaticVsDynamic`** (optional): `boolean`
- Warn when static and dynamic segments conflict (e.g., `/users/admin` vs `/users/:id`)
- Default: `true`

**`pathNormalization.preserveConstraints`** (optional): `boolean`
- When `true`, `/users/:id(\\d+)` ≠ `/users/:id([a-z]+)`
- When `false`, both are treated as identical
- Default: `true`

#### Router Configuration (Phase 2)

**`routerPrefixes.enabled`** (optional): `boolean`
- Enable router prefix tracking and resolution
- Default: `true`

**`routerPrefixes.maxDepth`** (optional): `number` (1-10)
- Maximum allowed router nesting depth for prefix resolution
- Default: `5`

#### File Filtering (Phase 4)

**`ignorePatterns`** (optional): `string[]`
- Glob patterns for files to skip
- Default: `[]`
- Example: `['**/*.test.ts', '**/generated/**', '**/__mocks__/**']`

**`includePatterns`** (optional): `string[]`
- Only check files matching these glob patterns
- Default: `[]` (check all files)
- Example: `['src/**/*.ts', 'routes/**/*.js']`

#### Method Filtering (Phase 4)

**`ignoreMethods`** (optional): `string[]`
- HTTP methods to ignore (case-insensitive)
- Default: `[]`
- Example: `['OPTIONS', 'HEAD']`

#### Error Reporting (Phase 4)

**`severity`** (optional): `'error' | 'warn'`
- Report duplicates as errors or warnings
- Default: `'error'`

#### NestJS Configuration (Phase 4)

**`nestjs.globalPrefix`** (optional): `string`
- Global prefix applied to all NestJS routes
- Default: `''` (no global prefix)
- Example: `'api'` → `/api/users/profile`

#### Debug Mode

**`debug`** (optional): `boolean`
- Enable detailed debug logging
- Default: `false`

### Debug Mode

Enable detailed logging to see route registration:

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', { debug: true }]
  }
}
```

Output example:
```
[no-duplicate-routes] Processing file: src/routes.ts
[no-duplicate-routes] Framework: express (confidence: 0.9, from: imports)
[no-duplicate-routes] Registering route: GET /users at src/routes.ts:5:3
```

## Advanced Examples

### Path Normalization (Phase 3)

```javascript
// Configure normalization level
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      pathNormalization: {
        level: 1  // Normalize parameter names
      }
    }]
  }
}
```

```javascript
// ❌ Duplicate with level 1+ normalization
app.get('/users/:id', getUser);
app.get('/users/:userId', getUserById);  // Warning: Parameter name differs

// ❌ Constraint conflict with level 2 normalization
app.get('/posts/:id(\\d+)', getPost);       // Only numbers
app.get('/posts/:postId([a-z]+)', getPost); // Only letters - Conflict!

// ⚠️ Static vs dynamic conflict warning
app.get('/users/admin', getAdmin);      // Static path
app.get('/users/:id', getUser);         // Dynamic path - Warning!
```

### NestJS Support (Phase 4)

```typescript
// NestJS controller with decorators
@Controller('users')
export class UsersController {
  @Get(':id')
  getUser() {}  // Route: GET /users/:id
  
  @Post()
  createUser() {}  // Route: POST /users
  
  @Delete(':id')
  deleteUser() {}  // Route: DELETE /users/:id
}

// With global prefix configuration
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      nestjs: {
        globalPrefix: 'api'  // All routes prefixed with /api
      }
    }]
  }
}
// Effective routes: GET /api/users/:id, POST /api/users, DELETE /api/users/:id
```

### File and Method Filtering (Phase 4)

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      // Ignore test files and generated code
      ignorePatterns: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/generated/**',
        '**/__mocks__/**'
      ],
      
      // Only check specific directories
      includePatterns: [
        'src/routes/**',
        'src/controllers/**'
      ],
      
      // Ignore OPTIONS and HEAD methods
      ignoreMethods: ['OPTIONS', 'HEAD'],
      
      // Report as warnings instead of errors
      severity: 'warn'
    }]
  }
}
```

### Framework Presets (Phase 4)

```javascript
// Use Express preset (includes router prefix tracking)
import routeGuard from 'eslint-plugin-route-guard';

export default [
  routeGuard.configs.express,
  {
    // Override specific options if needed
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        ignorePatterns: ['**/*.test.ts']
      }]
    }
  }
];
```

## Troubleshooting

### Plugin Not Detecting Duplicates

**Problem:** ESLint runs but doesn't report any duplicate routes.

**Solutions:**
1. **Verify plugin is loaded:** Check that the plugin appears in your ESLint config
2. **Check file patterns:** ESLint may not be checking your route files. Verify with: `npx eslint --debug <your-file>`
3. **Framework detection:** Enable debug mode to see if framework is detected: `{ debug: true }`
4. **Check ignored patterns:** Ensure route files aren't in `ignorePatterns`

**Example debug output:**
```bash
npx eslint src/routes.ts
```

### Routes in Functions Not Detected

**Problem:** Routes defined in functions or conditional blocks aren't detected.

**Explanation:** ESLint analyzes static code structure. Routes in dynamic contexts may be missed:
```javascript
// ⚠️ May not be detected
function registerRoutes() {
  app.get('/users', handler);
}

// ⚠️ Conditional routes may be missed
if (config.enableFeature) {
  app.get('/feature', handler);
}
```

**Solution:** Define routes at module level when possible, or accept this limitation.

### False Positives with Different Routers

**Problem:** Plugin reports duplicates for routes on different router instances.

**Current Limitation:** Cross-file router resolution uses heuristics. Use `ignorePatterns` to exclude specific files if needed:
```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      ignorePatterns: ['**/legacy-routes.ts']
    }]
  }
}
```

### Dynamic Paths Not Analyzed

**Problem:** Template literals with expressions are skipped.

**Explanation:** Dynamic paths cannot be statically analyzed:
```javascript
// ❌ Skipped (dynamic)
const prefix = '/api';
app.get(`${prefix}/users`, handler);

// ✅ Detected (static)
app.get('/api/users', handler);
```

**Workaround:** Use static string paths or router prefixes:
```javascript
const router = express.Router();
router.get('/users', handler);
app.use('/api', router);  // ✅ Prefix tracked
```

### Performance Issues with Large Codebase

**Problem:** ESLint runs slowly on large projects (500+ files).

**Solutions:**
1. **Use file patterns:** Limit checking to route files only:
   ```javascript
   { includePatterns: ['src/routes/**', 'src/controllers/**'] }
   ```
2. **Increase cache size:** Consider increasing normalization cache (see [Performance Tips](#performance-tips))
3. **Disable in dev:** Run only in CI/pre-commit for large projects
4. **Exclude test files:** Add test patterns to `ignorePatterns`

### ESLint Flat Config Not Working

**Problem:** Getting errors with `import routeGuard from 'eslint-plugin-route-guard'`.

**Solution:** Ensure you're using ESLint 9+ and have type: "module" in package.json or use .mjs extension:
```javascript
// eslint.config.mjs (note .mjs extension)
import routeGuard from 'eslint-plugin-route-guard';

export default [routeGuard.configs.recommended];
```

For CommonJS projects, use legacy config (see [Migration Guide](#migration-guide)).

## FAQ

### Q: Does this plugin work with Next.js or other frameworks?

**A:** Currently, the plugin supports Express, Fastify, and NestJS. Next.js uses file-based routing, which is different from programmatic routing. Support for Next.js may be added in future phases. You can use "generic" mode for basic detection:
```javascript
{ framework: 'generic' }
```

### Q: Can I use this plugin with JavaScript and TypeScript?

**A:** Yes! The plugin works with both JavaScript and TypeScript projects. For TypeScript projects, ensure you have `@typescript-eslint/parser` installed and configured.

### Q: Does the plugin require specific ESLint version?

**A:** The plugin requires ESLint 8.0+ or 9.0+. It supports both the legacy (.eslintrc) and modern flat config (eslint.config.js) formats.

### Q: How does router prefix resolution work?

**A:** The plugin tracks `app.use('/prefix', router)` calls and resolves the effective path by combining prefixes. For example:
```javascript
const userRouter = express.Router();
userRouter.get('/profile', handler);  // Route: /profile
app.use('/api/users', userRouter);    // Effective: /api/users/profile
```

See [docs/guides/express.md](docs/guides/express.md) for details.

### Q: What's the difference between normalization levels?

**A:** 
- **Level 0:** No normalization - `/users/:id` ≠ `/users/:userId` (different routes)
- **Level 1:** Normalize params - `/users/:id` = `/users/:userId` (same route)
- **Level 2:** Normalize params + constraints - `/users/:id(\d+)` = `/users/:userId(\d+)` (same route)

See [docs/guides/configuration.md](docs/guides/configuration.md) for details.

### Q: Can I report duplicates as warnings instead of errors?

**A:** Yes! Use the `severity` option:
```javascript
{ severity: 'warn' }
```

### Q: Does the plugin slow down ESLint?

**A:** The plugin is optimized for performance with LRU caching. Benchmarks:
- 50 routes: <1s
- 500 routes: <3s  
- 1000 routes: <5s

For very large codebases, use `includePatterns` to limit scope.

### Q: How do I ignore test files?

**A:** Use the `ignorePatterns` option:
```javascript
{
  ignorePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**']
}
```

### Q: Can I use this in a monorepo?

**A:** Yes! The plugin works in monorepos (Nx, Turborepo, pnpm workspaces, etc.). Use `includePatterns` and `ignorePatterns` to scope detection per package. See [docs/advanced/monorepos.md](docs/advanced/monorepos.md) for examples.

### Q: Does the plugin work in watch mode?

**A:** Yes! The plugin automatically resets its state for each lint run, so it works correctly with ESLint's watch mode and file watching tools.

### Q: How accurate is framework detection?

**A:** Framework detection is based on import analysis and is highly accurate (>95%). You can always override with the `framework` option if auto-detection fails.

### Q: What happens if framework detection fails?

**A:** The plugin falls back to "generic" mode, which detects HTTP method calls on any object. Enable debug mode to see detection confidence.

## Performance Tips

### 1. Use Include Patterns for Large Codebases

Instead of checking all files, limit to route directories:

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      includePatterns: ['src/routes/**', 'src/api/**', 'src/controllers/**']
    }]
  }
}
```

**Impact:** Can reduce lint time by 50-70% on large projects.

### 2. Ignore Test and Generated Files

Exclude files that don't contain production routes:

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      ignorePatterns: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/generated/**',
        '**/dist/**'
      ]
    }]
  }
}
```

**Impact:** Reduces number of files processed, improving speed.

### 3. Use Framework Presets

Framework-specific presets are optimized for each framework:

```javascript
// Instead of generic config
import routeGuard from 'eslint-plugin-route-guard';
export default [routeGuard.configs.express];  // Optimized for Express
```

**Impact:** Better performance and more accurate detection.

### 4. Enable Caching in CI

ESLint's built-in caching works well with this plugin:

```bash
npx eslint --cache --cache-location .eslintcache .
```

**Impact:** Subsequent runs only check changed files.

### 5. Lower Normalization Level if Not Needed

If you don't need parameter normalization, use level 0:

```javascript
{
  pathNormalization: { level: 0 }
}
```

**Impact:** Slight performance improvement for path processing.

### 6. Reduce Router Nesting Depth

If you don't have deeply nested routers, reduce max depth:

```javascript
{
  routerPrefixes: { maxDepth: 3 }
}
```

**Impact:** Reduces prefix resolution overhead.

### 7. Run Only in CI for Very Large Projects

For projects with 1000+ routes, consider running the rule only in CI:

```javascript
// eslint.config.js
export default [
  {
    plugins: { 'route-guard': routeGuard },
    rules: {
      'route-guard/no-duplicate-routes': process.env.CI ? 'error' : 'off'
    }
  }
];
```

**Impact:** Faster local development, comprehensive checking in CI.

## Migration Guide

### Migrating from ESLint 8 to ESLint 9

ESLint 9 introduced flat config format. Here's how to migrate:

**Before (ESLint 8 - .eslintrc.js):**

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['route-guard'],
  extends: ['plugin:route-guard/recommended'],
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      pathNormalization: { level: 1 }
    }]
  }
};
```

**After (ESLint 9 - eslint.config.js):**

```javascript
// eslint.config.js (or .mjs)
import routeGuard from 'eslint-plugin-route-guard';

export default [
  routeGuard.configs.recommended,
  {
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        pathNormalization: { level: 1 }
      }]
    }
  }
];
```

**Key Changes:**

1. **Import instead of require:** Use ES modules (`import`) instead of CommonJS (`require`)
2. **Array instead of object:** Config is an array of config objects
3. **No extends:** Use spread operator or direct config inclusion instead
4. **File extension:** Use `.mjs` extension or add `"type": "module"` to package.json

**TypeScript Projects:**

```javascript
// eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser
    }
  },
  routeGuard.configs.recommended
];
```

**Still Using ESLint 8?**

The plugin fully supports ESLint 8 legacy config. No migration needed:

```javascript
// .eslintrc.js (ESLint 8)
module.exports = {
  plugins: ['route-guard'],
  extends: ['plugin:route-guard/recommended']
};
```

### Migrating from Other Route Linters

If you're using custom scripts or other tools to detect route duplicates:

**Benefits of switching:**
- Integrated into existing ESLint workflow
- IDE integration (squiggles, autocomplete)
- Framework-aware detection (Express routers, NestJS decorators)
- Path normalization (`:id` vs `:userId`)
- Configurable severity and filtering
- Better performance with caching

**Migration steps:**
1. Install `eslint-plugin-route-guard`
2. Add to ESLint config (see [Quick Start](#quick-start))
3. Run ESLint to find duplicates
4. Remove old custom scripts
5. Update CI/CD pipelines to use ESLint

## Examples

Working example projects are available in the [`examples/`](examples/) directory:

- **[express-basic/](examples/express-basic/)** - Simple Express app with basic route detection
- **[express-routers/](examples/express-routers/)** - Express app demonstrating router prefix resolution
- **[fastify-basic/](examples/fastify-basic/)** - Basic Fastify routes
- **[nestjs-modules/](examples/nestjs-modules/)** - NestJS with decorators and controllers

Each example includes:
- Complete package.json with dependencies
- ESLint configuration showing plugin usage
- README explaining what the example demonstrates
- Sample routes (with intentional duplicates commented out)

To run an example:

```bash
cd examples/express-basic
npm install
npx eslint .
```

## API Documentation

All public APIs are documented with JSDoc comments. For detailed API documentation, see:

- [Configuration Schema](docs/guides/configuration.md) - Complete configuration reference
- [Rule API](docs/rules/no-duplicate-routes.md) - Rule details and options
- [Framework Guides](docs/guides/) - Framework-specific integration guides

## Current Capabilities

**Phase 1-4 (Current) Features:**

✅ **Literal string paths** - `'/users'`, `'/api/posts'`
✅ **Simple template literals** - `` `/users` ``
✅ **Cross-file detection** - Duplicates detected across entire codebase
✅ **Framework auto-detection** - Express, Fastify, NestJS detection from imports
✅ **HTTP methods** - GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, ALL
✅ **Router prefix resolution** - `app.use('/api', router)` prefixes tracked (Phase 2)
✅ **Nested router prefixes** - Up to 5 levels deep by default (Phase 2)
✅ **Cross-file router tracking** - Exported/imported routers resolved (Phase 2)
✅ **Edge case handling** - Empty prefixes, trailing slashes, multiple slashes (Phase 2)
✅ **Path normalization** - Configurable parameter name normalization (Phase 3)
✅ **Constraint detection** - Detect conflicts in regex constraints (Phase 3)
✅ **Static vs dynamic conflicts** - Warn on `/users/admin` vs `/users/:id` (Phase 3)
✅ **NestJS decorators** - Full @Controller, @Get, @Post, etc. support (Phase 4)
✅ **NestJS global prefix** - Apply global prefix to all NestJS routes (Phase 4)
✅ **File filtering** - Ignore/include patterns with glob support (Phase 4)
✅ **Method filtering** - Skip specific HTTP methods (Phase 4)
✅ **Configurable severity** - Report as error or warning (Phase 4)
✅ **Framework presets** - Pre-configured settings for each framework (Phase 4)
✅ **Performance optimized** - Centralized caching system with LRU eviction (Phase 5)
✅ **Large codebase ready** - Handles 1000+ routes efficiently (<5s) (Phase 5)
✅ **Memory efficient** - Cache overhead <1MB with automatic cleanup (Phase 5)

**Current Limitations:**

❌ **Dynamic prefixes** - `app.use(variable, router)` skipped (static analysis limitation)
❌ **Dynamic paths skipped** - Template literals with expressions ignored
❌ **Computed paths skipped** - `'/api' + '/users'` not analyzed
❌ **Conditional routes** - Routes inside if statements may be missed
❌ **Async registration** - Routes in async functions may be missed
❌ **Deep nesting** - Router depth beyond limit (default 5) not resolved

**Future phases will add:**
- Developer experience improvements (Phase 6)
- Production hardening and edge cases (Phase 7)

## Development

This project is under active development. Phase 0 (repository setup) is complete.

### Project Status

- ✅ **Phase 0** - Repository bootstrap, tooling setup - **COMPLETE**
- ✅ **Phase 1** - Basic duplicate detection (MVP) - **COMPLETE**
- ✅ **Phase 2** - Router awareness & prefix resolution - **COMPLETE**
- ✅ **Phase 3** - Advanced path handling & normalization - **COMPLETE** ✨
- ✅ **Phase 4** - Multi-framework support & configuration - **COMPLETE** ✨
- ✅ **Phase 5** - Performance optimization & scale - **COMPLETE** ✨
- ⏳ **Phase 6** - Developer experience & tooling
- ⏳ **Phase 7** - Production hardening

See [project-planning-v2.md](.agent/project-planning-v2.md) for detailed roadmap.

### Current Metrics (Phase 5)

- **Tests:** 249 passing across 11 test files
  - Path utilities: 30 tests
  - Path normalization: 52 tests (Phase 3)
  - Router tracking: 20 tests
  - Route tracking: 11 tests
  - Path extraction: 20 tests
  - Framework detection: 15 tests
  - NestJS detector: 14 tests (Phase 4)
  - Performance cache: 15 tests (Phase 5)
  - Performance benchmarks: 9 tests (Phase 5)
  - Rule integration: 48 tests
  - Smoke tests: 15 tests
- **Coverage:** >90% overall (targeting 95%+)
- **Build:** CJS + ESM outputs
- **Performance:** 
  - 50 routes: <1s
  - 500 routes: <3s
  - 1000 routes: <5s
  - Cache overhead: <1MB

### Phase 3 Highlights (Path Normalization)

**New Capabilities:**
- 🎯 Configurable normalization levels (0, 1, 2)
- 🎯 Parameter name normalization (`/users/:id` = `/users/:userId`)
- 🎯 Constraint detection and comparison
- 🎯 Static vs dynamic conflict warnings
- 🎯 LRU cache for performance (1000 entries)
- 🎯 Multi-framework syntax support (Express, Fastify, NestJS)
- 🎯 Wildcard segment detection

### Phase 4 Highlights (Multi-Framework & Configuration)

**New Capabilities:**
- 🏷️ Full NestJS decorator support (@Controller, @Get, @Post, etc.)
- 🏷️ NestJS global prefix configuration
- 🔧 File filtering with glob patterns (ignore/include)
- 🔧 HTTP method filtering (ignoreMethods)
- 🔧 Configurable severity (error vs warn)
- 🔧 Framework-specific preset configurations
- 🔧 Comprehensive configuration schema

### Phase 5 Highlights (Performance Optimization & Scale)

**New Capabilities:**
- ⚡ Centralized caching system with LRU eviction
- ⚡ Path normalization cache (2000 entries)
- ⚡ Framework detection cache (500 entries)
- ⚡ Router prefix cache (1000 entries)
- ⚡ Automatic cache clearing in watch mode
- ⚡ Cache statistics tracking (hits, misses, hit rate)
- ⚡ Memory-efficient implementation (<1MB overhead)
- ⚡ Performance benchmarks with automated regression tests
- ⚡ Large project fixture generator for testing

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT © 2026

See [LICENSE](LICENSE) for details.

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md) for reporting process.

## Acknowledgments

This plugin was inspired by the need for better route management in large-scale Node.js applications. Special thanks to the ESLint team and the TypeScript ESLint project for their excellent tooling.
