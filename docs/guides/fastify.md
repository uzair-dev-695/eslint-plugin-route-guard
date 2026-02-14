# Fastify Integration Guide

Complete guide for using eslint-plugin-route-guard with Fastify applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Framework Detection](#framework-detection)
- [Fastify Route Patterns](#fastify-route-patterns)  
- [Plugin Registration](#plugin-registration)
- [Best Practices](#best-practices)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Quick Start

**1. Install dependencies:**

```bash
npm install --save-dev eslint-plugin-route-guard
```

**2. Configure ESLint (Flat Config):**

```javascript
// eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';

export default [routeGuard.configs.fastify];
```

**3. Run ESLint:**

```bash
npx eslint .
```

## Framework Detection

The plugin automatically detects Fastify from imports:

### Auto-Detected Patterns

```javascript
// ✅ Detected as Fastify
import fastify from 'fastify';
const server = fastify();

// ✅ Detected as Fastify
import Fastify from 'fastify';
const app = Fastify();

// ✅ Detected as Fastify
const fastify = require('fastify');
const server = fastify();
```

### Manual Override

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      framework: 'fastify'
    }]
  }
}
```

## Fastify Route Patterns

### Basic Routes

```javascript
const fastify = require('fastify')();

fastify.get('/users', async (request, reply) => {
  return { users: [] };
});

fastify.post('/users', async (request, reply) => {
  // POST /users
});

fastify.get('/users/:id', async (request, reply) => {
  // GET /users/:id
});
```

### Route with Schema

```javascript
fastify.post('/users', {
  schema: {
    body: {
      type: 'object',
      properties: {
        name: { type: 'string' }
      }
    }
  },
  handler: async (request, reply) => {
    // Handler logic
  }
});

// ✅ Plugin ignores schema object, focuses on route registration
```

### HTTP Method Shortcuts

```javascript
fastify.get('/users', getUsers);
fastify.post('/users', createUser);
fastify.put('/users/:id', updateUser);
fastify.patch('/users/:id', patchUser);
fastify.delete('/users/:id', deleteUser);
fastify.head('/users', headUsers);
fastify.options('/users', optionsUsers);
fastify.all('/wildcard', handleAll);
```

### Route-Level Plugins

```javascript
fastify.route({
  method: 'GET',
  url: '/users/:id',
  handler: async (request, reply) => {
    return { id: request.params.id };
  }
});

// ✅ Plugin detects .route() calls
```

## Plugin Registration

Fastify plugins create route scopes, similar to Express routers.

### Basic Plugin

```javascript
// plugins/users.js
async function userRoutes(fastify, options) {
  fastify.get('/profile', async (req, reply) => {
    // GET /profile (within plugin scope)
  });
  
  fastify.post('/avatar', async (req, reply) => {
    // POST /avatar (within plugin scope)
  });
}

module.exports = userRoutes;

// app.js
fastify.register(require('./plugins/users'), { prefix: '/api/users' });

// Effective routes:
// GET /api/users/profile
// POST /api/users/avatar
```

### Nested Plugins

```javascript
// plugins/admin/users.js
async function adminUsers(fastify, options) {
  fastify.get('/', async () => {});    // GET /
  fastify.delete('/:id', async () => {});  // DELETE /:id
}

// plugins/admin/index.js
async function admin(fastify, options) {
  fastify.register(require('./users'), { prefix: '/users' });
  // Prefix: /users
}

// app.js
fastify.register(require('./plugins/admin'), { prefix: '/api/admin' });
// Prefix: /api/admin

// Effective routes:
// GET /api/admin/users
// DELETE /api/admin/users/:id
```

**Note:** Plugin prefix resolution works similarly to Express router prefixes.

### Auto-Prefix Plugin

```javascript
// plugins/users.js
module.exports = async function (fastify, opts) {
  fastify.get('/list', getUsers);
  fastify.post('/', createUser);
}

// app.js
fastify.register(require('./plugins/users'), { prefix: '/users' });

// Routes:
// GET /users/list
// POST /users
```

## Best Practices

### 1. Use Plugin-Based Architecture

```javascript
// Good: Modular plugins
// plugins/users.js
// plugins/posts.js
// plugins/comments.js

fastify.register(require('./plugins/users'), { prefix: '/api/users' });
fastify.register(require('./plugins/posts'), { prefix: '/api/posts' });
```

### 2. Leverage Fastify's Encapsulation

```javascript
// Each plugin is encapsulated
async function plugin1(fastify, opts) {
  fastify.get('/route', handler1);  // Scoped to plugin1
}

async function plugin2(fastify, opts) {
  fastify.get('/route', handler2);  // Different scope, no conflict
}

fastify.register(plugin1, { prefix: '/api/v1' });
fastify.register(plugin2, { prefix: '/api/v2' });

// ✅ No conflict:
// GET /api/v1/route
// GET /api/v2/route
```

### 3. Use fastify-plugin for Shared Routes

```javascript
const fp = require('fastify-plugin');

// This plugin's routes are NOT encapsulated
module.exports = fp(async function (fastify, opts) {
  fastify.get('/health', async () => ({ status: 'ok' }));
});

// ⚠️ Be careful with fastify-plugin - routes are shared across all scopes
```

### 4. Parameter Constraints

Fastify supports regex constraints in route parameters:

```javascript
// Numeric IDs only
fastify.get('/users/:id(^\\d+$)', getUserById);

// Alphanumeric slugs
fastify.get('/users/:slug(^[a-z0-9-]+$)', getUserBySlug);

// ✅ With preserveConstraints: true (default), these are different routes
```

### 5. Organize by HTTP Method

```javascript
// Clear organization
async function userPlugin(fastify, opts) {
  // GET routes
  fastify.get('/', listUsers);
  fastify.get('/:id', getUser);
  
  // POST routes
  fastify.post('/', createUser);
  
  // PUT routes
  fastify.put('/:id', updateUser);
  
  // DELETE routes
  fastify.delete('/:id', deleteUser);
}
```

## Configuration

### Recommended Configuration

```javascript
// eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';

export default [
  routeGuard.configs.fastify,
  {
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        pathNormalization: {
          level: 1,
          preserveConstraints: true
        },
        ignorePatterns: [
          '**/*.test.js',
          '**/test/**'
        ]
      }]
    }
  }
];
```

### With TypeScript

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
  routeGuard.configs.fastify
];
```

## Troubleshooting

### Routes in Plugins Not Detected

**Problem:** Routes inside Fastify plugins aren't detected.

**Possible causes:**

1. **Async function not recognized:**
   ```javascript
   // ✅ Detected
   async function plugin(fastify, opts) {
     fastify.get('/route', handler);
   }
   
   // ⚠️ May not be detected (inline registration)
   fastify.register(async (fastify, opts) => {
     fastify.get('/route', handler);
   });
   ```

2. **Enable debug mode:**
   ```javascript
   { debug: true }
   ```

### Plugin Prefixes Not Resolved

**Problem:** Prefixes from `fastify.register()` not applied.

**Solutions:**

1. **Ensure static prefix:**
   ```javascript
   // ✅ Supported
   fastify.register(plugin, { prefix: '/api' });
   
   // ❌ Not supported (dynamic)
   const prefix = '/api';
   fastify.register(plugin, { prefix });
   ```

2. **Check nesting depth:**
   ```javascript
   { routerPrefixes: { maxDepth: 5 } }
   ```

### False Positives with fastify-plugin

**Problem:** Plugin reports duplicates for routes in different scopes.

**Explanation:** `fastify-plugin` removes encapsulation, making routes global.

**Solution:**
```javascript
// If using fastify-plugin for shared utilities, routes are intentionally shared
// Use ignorePatterns if needed
{ ignorePatterns: ['plugins/shared/**'] }
```

## Examples

See [examples/fastify-basic](../../examples/fastify-basic/) for a working example.

## Fastify-Specific Notes

### Differences from Express

1. **Encapsulation:** Fastify plugins are encapsulated by default (unlike Express routers)
2. **Constraints:** Fastify supports regex constraints natively: `:id(\\d+)`
3. **Error Handling:** Fastify throws on duplicate routes (plugin detects before runtime)
4. **Performance:** Fastify optimizes route matching differently than Express

### Plugin vs Router

- **Express Router:** `const router = express.Router()`
- **Fastify Plugin:** `async function plugin(fastify, opts) {}`

Both support prefix resolution in this plugin.

## Related Guides

- [Configuration Reference](./configuration.md)
- [Performance Guide](../advanced/performance.md)
- [Rule Documentation](../rules/no-duplicate-routes.md)
