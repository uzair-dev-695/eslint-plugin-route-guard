# eslint-plugin-route-guard

[![npm version](https://img.shields.io/npm/v/eslint-plugin-route-guard.svg)](https://www.npmjs.com/package/eslint-plugin-route-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> ESLint plugin to detect duplicate and conflicting routes across Express, Fastify, and NestJS applications.

## Features

- 🔍 **Cross-file detection** - Find duplicate routes across your entire codebase
- 🧩 **Router prefix resolution** - Correctly resolves Express router prefixes and nested routes (Phase 2)
- 🚀 **Multi-framework support** - Works with Express, Fastify, NestJS, and generic HTTP methods
- ⚡ **Fast & efficient** - Optimized for large projects with hundreds of routes
- 🎯 **Auto-detection** - Automatically detects your framework from imports
- 🔧 **Configurable** - Flexible options for path normalization and route matching
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

- **Express** - Route definitions via `app.get()`, `router.post()`, etc.
- **Fastify** - Route definitions via `fastify.get()`, `server.post()`, etc.
- **NestJS** - Decorator-based routes via `@Controller()`, `@Get()`, etc.
- **Generic** - Any HTTP method calls (get, post, put, delete, patch, etc.)

## Rules

### `no-duplicate-routes`

Detects duplicate route definitions across files.

**Status:** ✅ Available (Phase 1 MVP)

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

// ✅ Different parameter names (MVP treats as different)
app.get('/users/:id', getUser);
app.get('/users/:userId', getUserById);

// ✅ Router prefix resolution (Phase 2)
const userRouter = express.Router();
userRouter.get('/profile', getProfile);  // Route: /profile
app.use('/api/users', userRouter);       // Prefix: /api/users
// Effective path: /api/users/profile (no conflict)

app.get('/api/posts/profile', getPostProfile);  // Different path
```

**Note:** As of Phase 2, router prefixes are automatically resolved!

## Configuration

### Rule Options

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      framework: 'express',    // Manual framework override
      maxRouterDepth: 5,       // Maximum router nesting depth
      debug: false             // Enable debug logging
    }]
  }
}
```

**`framework`** (optional): `'express' | 'fastify' | 'nestjs' | 'generic'`
- Manually specify framework instead of auto-detection
- Default: Auto-detected from imports

**`maxRouterDepth`** (optional): `number` (1-10)
- Maximum allowed router nesting depth for prefix resolution
- Default: `5`
- When exceeded, a warning is emitted and prefix resolution stops

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

## Current Capabilities

**Phase 1 + Phase 2 (Current) Features:**

✅ **Literal string paths** - `'/users'`, `'/api/posts'`
✅ **Simple template literals** - `` `/users` ``
✅ **Cross-file detection** - Duplicates detected across entire codebase
✅ **Framework auto-detection** - Express, Fastify, NestJS detection from imports
✅ **HTTP methods** - GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, ALL
✅ **Router prefix resolution** - `app.use('/api', router)` prefixes tracked (Phase 2)
✅ **Nested router prefixes** - Up to 5 levels deep by default (Phase 2)
✅ **Cross-file router tracking** - Exported/imported routers resolved (Phase 2)
✅ **Edge case handling** - Empty prefixes, trailing slashes, multiple slashes (Phase 2)

**Current Limitations:**

❌ **Dynamic prefixes** - `app.use(variable, router)` skipped (static analysis limitation)
❌ **Path parameters not normalized** - `/users/:id` vs `/users/:userId` treated as different (Phase 3)
❌ **Dynamic paths skipped** - Template literals with expressions ignored
❌ **Computed paths skipped** - `'/api' + '/users'` not analyzed
❌ **Conditional routes** - Routes inside if statements may be missed
❌ **Async registration** - Routes in async functions may be missed
❌ **Deep nesting** - Router depth beyond limit (default 5) not resolved

**Future phases will add:**
- Path parameter normalization - `:id` vs `:userId` (Phase 3)
- Static vs dynamic route conflicts (Phase 3)
- NestJS decorator enhancements (Phase 4)
- Advanced configuration options (Phase 4)

## Development

This project is under active development. Phase 0 (repository setup) is complete.

### Project Status

- ✅ **Phase 0** - Repository bootstrap, tooling setup - **COMPLETE**
- ✅ **Phase 1** - Basic duplicate detection (MVP) - **COMPLETE**
- ✅ **Phase 2** - Router awareness & prefix resolution - **COMPLETE** ✨ NEW!
- ⏳ **Phase 3** - Advanced path handling & normalization
- ⏳ **Phase 4** - Multi-framework support & configuration
- ⏳ **Phase 5** - Performance optimization
- ⏳ **Phase 6** - Developer experience & tooling
- ⏳ **Phase 7** - Production hardening

See [project-planning-v2.md](.agent/project-planning-v2.md) for detailed roadmap.

### Phase 2 Metrics (Current)

- **Tests:** 159 passing (137 total + 22 Phase 2 integration)
  - Path utilities: 30 tests
  - Router tracking: 20 tests
  - Route tracking: 11 tests
  - Path extraction: 20 tests
  - Framework detection: 15 tests
  - Rule integration: 48 tests
  - Smoke tests: 15 tests
- **Coverage:** >90% overall (targeting 95%+)
- **Build:** CJS + ESM outputs
- **Performance:** <500ms for 1000+ routes with nested routers

### Phase 2 Highlights

**New Capabilities:**
- 🧩 Router creation detection (Express, Fastify)
- 🧩 Prefix application tracking via `app.use()`
- 🧩 Nested router prefix chains (up to 5 levels)
- 🧩 Effective path computation with normalization
- 🧩 Cross-file router export/import tracking (heuristic)
- 🧩 Max depth enforcement with warnings
- 🧩 Dynamic prefix detection and graceful skipping
- 🧩 Edge case handling (empty, root, trailing slashes)

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
