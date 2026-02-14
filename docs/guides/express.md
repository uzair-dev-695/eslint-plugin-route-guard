# Express Integration Guide

Complete guide for using eslint-plugin-route-guard with Express.js applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Framework Detection](#framework-detection)
- [Router Prefix Resolution](#router-prefix-resolution)
- [Common Patterns](#common-patterns)
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

export default [routeGuard.configs.express];
```

**3. Run ESLint:**

```bash
npx eslint .
```

## Framework Detection

The plugin automatically detects Express from imports:

### Auto-Detected Patterns

```javascript
// ✅ Detected as Express
import express from 'express';
const app = express();

// ✅ Detected as Express
const express = require('express');
const app = express();

// ✅ Detected as Express
import { Router } from 'express';
const router = Router();

// ✅ Detected as Express
const { Router } = require('express');
```

### Manual Override

If auto-detection fails, manually specify:

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      framework: 'express'
    }]
  }
}
```

## Router Prefix Resolution

Express routers are tracked across files, and prefixes are automatically resolved.

### Basic Router Usage

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();

router.get('/profile', getProfile);  // Route: /profile on router
router.post('/avatar', updateAvatar);  // Route: /avatar on router

module.exports = router;

// app.js
const userRouter = require('./routes/users');
app.use('/api/users', userRouter);  // Prefix: /api/users

// Effective routes:
// GET /api/users/profile
// POST /api/users/avatar
```

### Nested Routers

```javascript
// routes/admin/users.js
const router = express.Router();
router.get('/', listAdminUsers);    // Route: /
router.delete('/:id', deleteUser);  // Route: /:id

// routes/admin/index.js
const adminUsersRouter = require('./users');
const adminRouter = express.Router();
adminRouter.use('/users', adminUsersRouter);  // Prefix: /users

// app.js
app.use('/api/admin', adminRouter);  // Prefix: /api/admin

// Effective routes (3 levels deep):
// GET /api/admin/users
// DELETE /api/admin/users/:id
```

### Maximum Nesting Depth

By default, the plugin resolves up to 5 levels of router nesting:

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      routerPrefixes: {
        maxDepth: 5  // Adjust if you have deeper nesting
      }
    }]
  }
}
```

**Why limit depth?**
- Performance: Deeper nesting requires more analysis
- Clarity: Deeply nested routers are harder to maintain
- Practical: Most applications don't exceed 3-4 levels

## Common Patterns

### Pattern 1: Modular Routes

```javascript
// routes/users.js
const router = express.Router();

router.get('/', getAllUsers);        // GET /users (with prefix)
router.get('/:id', getUserById);     // GET /users/:id
router.post('/', createUser);        // POST /users
router.put('/:id', updateUser);      // PUT /users/:id
router.delete('/:id', deleteUser);   // DELETE /users/:id

module.exports = router;

// app.js
app.use('/users', require('./routes/users'));
```

**Plugin behavior:**
- ✅ Tracks router prefixes correctly
- ✅ Detects duplicates within the router
- ✅ Detects duplicates across different routers if prefixes match

### Pattern 2: Versioned APIs

```javascript
// routes/v1/users.js
router.get('/:id', getUserV1);

// routes/v2/users.js
router.get('/:id', getUserV2);

// app.js
app.use('/api/v1', require('./routes/v1/users'));
app.use('/api/v2', require('./routes/v2/users'));

// Effective routes:
// GET /api/v1/:id  (v1)
// GET /api/v2/:id  (v2)
// ✅ No conflict - different prefixes
```

### Pattern 3: Resource Nesting

```javascript
// routes/posts.js
const router = express.Router();
router.get('/:postId/comments', getPostComments);
router.post('/:postId/comments', createComment);

// app.js
app.use('/api/posts', require('./routes/posts'));

// Effective routes:
// GET /api/posts/:postId/comments
// POST /api/posts/:postId/comments
```

### Pattern 4: Middleware Routers

```javascript
// middleware/auth.js
function authMiddleware(req, res, next) { /* auth logic */ }

// routes/protected.js
const router = express.Router();
router.use(authMiddleware);  // ✅ Middleware, not a route

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);

// ✅ Plugin ignores middleware, only checks route handlers
```

### Pattern 5: Method-Specific Routing

```javascript
// ✅ Same path, different methods - OK
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// ❌ Same path, same method - ERROR
router.get('/users/:id', getUser);
router.get('/users/:id', getUserDetails);  // Duplicate!
```

## Best Practices

### 1. Organize Routes by Resource

```javascript
// Good: One router per resource
// routes/users.js
// routes/posts.js
// routes/comments.js

// app.js
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
```

### 2. Use Consistent Parameter Names

```javascript
// Less maintainable (triggers warnings with normalization level 1+)
router.get('/users/:id', getUser);
router.get('/users/:userId', getUserProfile);  // ⚠️ Different param name

// Better: Consistent naming
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
```

### 3. Define Static Routes Before Dynamic

```javascript
// ❌ Bad: Dynamic route defined first
router.get('/users/:id', getUser);       // Catches /users/admin
router.get('/users/admin', getAdmin);    // Never reached!

// ✅ Good: Static routes first
router.get('/users/admin', getAdmin);    // Matched first
router.get('/users/:id', getUser);       // Matched for other IDs
```

**Plugin behavior:**
- With `warnOnStaticVsDynamic: true` (default), warns about potential conflicts
- Consider route order in your code

### 4. Use Path Constraints for Different Types

```javascript
// ✅ Good: Different constraints for different types
router.get('/users/:id(\\d+)', getUserById);       // Numeric IDs
router.get('/users/:slug([a-z-]+)', getUserBySlug);  // Slug strings

// With preserveConstraints: true (default), these are treated as different routes
```

### 5. Avoid Deep Router Nesting

```javascript
// ❌ Avoid: Too deeply nested (hard to track)
app.use('/api', router1);
  router1.use('/v1', router2);
    router2.use('/users', router3);
      router3.use('/posts', router4);
        router4.use('/comments', router5);  // 5 levels deep!

// ✅ Better: Flatter structure
app.use('/api/v1/users/posts/comments', commentsRouter);
```

## Configuration

### Recommended Configuration

```javascript
// eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';

export default [
  routeGuard.configs.express,
  {
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        pathNormalization: {
          level: 1,  // Normalize :id vs :userId
          warnOnStaticVsDynamic: true,
          preserveConstraints: true
        },
        routerPrefixes: {
          enabled: true,
          maxDepth: 5
        },
        ignorePatterns: [
          '**/*.test.js',
          '**/__tests__/**'
        ]
      }]
    }
  }
];
```

### Large Express App Configuration

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      includePatterns: [
        'routes/**',
        'api/**',
        'controllers/**'
      ],
      ignorePatterns: [
        '**/*.test.js',
        '**/test-helpers/**',
        '**/mocks/**'
      ],
      routerPrefixes: {
        maxDepth: 3  // Reduce if not deeply nested
      }
    }]
  }
}
```

### Development vs Production

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'route-guard/no-duplicate-routes': [
        process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        {
          severity: process.env.NODE_ENV === 'production' ? 'error' : 'warn'
        }
      ]
    }
  }
];
```

## Troubleshooting

### Routes Not Detected

**Problem:** Plugin doesn't detect routes in your Express app.

**Solutions:**

1. **Check import style:**
   ```javascript
   // ✅ Detected
   import express from 'express';
   const app = express();
   
   // ✅ Detected
   const express = require('express');
   
   // ❌ Not detected (dynamic require)
   const app = require(getFrameworkName())();
   ```

2. **Enable debug mode:**
   ```javascript
   { debug: true }
   ```
   Check if framework is detected correctly.

3. **Manual override:**
   ```javascript
   { framework: 'express' }
   ```

### Router Prefixes Not Resolved

**Problem:** Prefixes from `app.use()` not being applied.

**Possible causes:**

1. **Dynamic prefix:**
   ```javascript
   // ❌ Not supported
   const prefix = '/api';
   app.use(prefix, router);
   
   // ✅ Supported
   app.use('/api', router);
   ```

2. **Cross-file router resolution:**
   - Plugin uses heuristics to match exported/imported routers
   - May not work with complex module resolution
   - Use debug mode to verify

3. **Nesting depth exceeded:**
   ```javascript
   { routerPrefixes: { maxDepth: 10 } }  // Increase if needed
   ```

### False Positives

**Problem:** Plugin reports duplicates that aren't really duplicates.

**Solutions:**

1. **Different routers, same variable name:**
   ```javascript
   // Use ignorePatterns for specific files
   { ignorePatterns: ['routes/legacy/**'] }
   ```

2. **Parameter name differences:**
   ```javascript
   // Reduce normalization level
   { pathNormalization: { level: 0 } }
   ```

3. **Conditional routes:**
   ```javascript
   // Plugin may detect both branches
   if (config.enableFeature) {
     app.get('/feature', handler1);
   } else {
     app.get('/feature', handler2);
   }
   
   // Solution: Use ignorePatterns or severity: 'warn'
   ```

## Examples

See [examples/express-basic](../../examples/express-basic/) and [examples/express-routers](../../examples/express-routers/) for working examples.

## Related Guides

- [Configuration Reference](./configuration.md)
- [Performance Guide](../advanced/performance.md)
- [Rule Documentation](../rules/no-duplicate-routes.md)
