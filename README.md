# eslint-plugin-route-guard

[![npm version](https://img.shields.io/npm/v/eslint-plugin-route-guard.svg)](https://www.npmjs.com/package/eslint-plugin-route-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ESLint plugin to detect duplicate and conflicting routes across Express, Fastify, and NestJS applications.

## Features

- 🔍 **Cross-file detection** - Find duplicate routes across your entire codebase
- 🧩 **Router prefix resolution** - Correctly resolves Express router prefixes and nested routes (Phase 2)
- 🚀 **Multi-framework support** - Works with Express, Fastify, NestJS, and generic HTTP methods
- 🎯 **Auto-detection** - Automatically detects your framework from imports
- 🔧 **Path normalization** - Configurable normalization levels for parameter matching (Phase 3)
- ⚙️ **Advanced configuration** - File patterns, method filtering, custom severity (Phase 4)
- 🏷️ **NestJS decorators** - Full support for @Controller and HTTP method decorators (Phase 4)
- 📦 **Framework presets** - Pre-configured settings for Express, Fastify, and NestJS (Phase 4)
- ⚡ **Fast & efficient** - Optimized for large projects with hundreds of routes
- 📝 **TypeScript first** - Written in TypeScript with full type safety

## Installation

```bash
npm install --save-dev eslint-plugin-route-guard
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

**Current Limitations:**

❌ **Dynamic prefixes** - `app.use(variable, router)` skipped (static analysis limitation)
❌ **Dynamic paths skipped** - Template literals with expressions ignored
❌ **Computed paths skipped** - `'/api' + '/users'` not analyzed
❌ **Conditional routes** - Routes inside if statements may be missed
❌ **Async registration** - Routes in async functions may be missed
❌ **Deep nesting** - Router depth beyond limit (default 5) not resolved

**Future phases will add:**
- Performance optimization and caching (Phase 5)
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
- ⏳ **Phase 5** - Performance optimization
- ⏳ **Phase 6** - Developer experience & tooling
- ⏳ **Phase 7** - Production hardening

See [project-planning-v2.md](.agent/project-planning-v2.md) for detailed roadmap.

### Current Metrics (Phase 4)

- **Tests:** 225 passing across 9 test files
  - Path utilities: 30 tests
  - Path normalization: 52 tests (Phase 3)
  - Router tracking: 20 tests  - Route tracking: 11 tests
  - Path extraction: 20 tests
  - Framework detection: 15 tests
  - NestJS detector: 14 tests (Phase 4)
  - Rule integration: 48 tests
  - Smoke tests: 15 tests
- **Coverage:** >90% overall (targeting 95%+)
- **Build:** CJS + ESM outputs
- **Performance:** <500ms for 1000+ routes with nested routers

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
