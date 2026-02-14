# Custom Framework Support Guide

Guide for using eslint-plugin-route-guard with custom or unsupported frameworks.

## Table of Contents

- [Generic Mode](#generic-mode)
- [Adding Custom Framework Detection](#adding-custom-framework-detection)
- [Contributing Framework Support](#contributing-framework-support)
- [Limitations](#limitations)

## Generic Mode

For frameworks not explicitly supported (Express, Fastify, NestJS), use generic mode.

### What is Generic Mode?

Generic mode detects HTTP method calls on **any object**:

```javascript
// Works with any framework
myFramework.get('/users', handler);
customRouter.post('/posts', handler);
app.delete('/items/:id', handler);
```

### Enabling Generic Mode

**Manual Override:**

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      framework: 'generic'
    }]
  }
}
```

**Automatic Fallback:**

If no known framework is detected, generic mode is used automatically.

### What Generic Mode Detects

**HTTP Methods:**
- `get()`, `post()`, `put()`, `delete()`, `patch()`
- `head()`, `options()`, `all()`

**Pattern:**
```javascript
<identifier>.<method>(<path>, ...)
```

### Examples

**Koa:**
```javascript
const Koa = require('koa');
const Router = require('@koa/router');

const router = new Router();

router.get('/users', ctx => {});  // ✅ Detected
router.post('/users', ctx => {});  // ✅ Detected
```

**Hapi:**
```javascript
const Hapi = require('@hapi/hapi');

server.route({
  method: 'GET',        // ⚠️ Not detected (object syntax)
  path: '/users',
  handler: () => {}
});

// Alternative: Function calls might work
server.get('/users', handler);  // ✅ Detected if Hapi supports this
```

**Custom Framework:**
```javascript
const customApp = require('my-framework');

customApp.get('/api/users', handler);     // ✅ Detected
customApp.post('/api/posts', handler);     // ✅ Detected
customApp.delete('/api/items/:id', handler);  // ✅ Detected
```

### Generic Mode Limitations

**What's Not Supported:**
- ❌ Router prefix resolution (no `app.use('/prefix', router)`)
- ❌ Framework-specific syntax (decorators, object notation)
- ❌ Plugin/module registration tracking
- ❌ Framework-specific parameter syntax

**What Works:**
- ✅ Basic duplicate detection
- ✅ Cross-file detection
- ✅ Path normalization
- ✅ Method-based routing

### Configuration

**Recommended for Generic Mode:**

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      framework: 'generic',
      pathNormalization: {
        level: 1  // Still useful
      },
      routerPrefixes: {
        enabled: false  // Not supported in generic mode
      }
    }]
  }
}
```

## Adding Custom Framework Detection

Want the plugin to auto-detect your framework? You can:

### 1. Use Framework Override

Simplest approach:

```javascript
{
  framework: 'generic'  // Or specific if it matches Express/Fastify patterns
}
```

### 2. Mimic Supported Framework

If your framework uses similar patterns to Express/Fastify:

**Express-like:**
```javascript
// If your framework does this:
const app = myFramework();
app.get('/', handler);
const router = myFramework.Router();
router.use('/prefix', subRouter);

// Then use:
{ framework: 'express' }
```

**Fastify-like:**
```javascript
// If your framework does this:
const server = myFramework();
server.get('/', handler);
server.register(plugin, { prefix: '/api' });

// Then use:
{ framework: 'fastify' }
```

### 3. Request Feature

Open a GitHub issue requesting support for your framework:

https://github.com/uzair-dev-695/eslint-plugin-route-guard/issues

Include:
- Framework name and version
- Routing syntax examples
- Links to documentation
- Common patterns

## Contributing Framework Support

Want to add native support for a framework? Contribute!

### Requirements

1. **Popular Framework:** Significant user base
2. **Stable API:** Not frequently changing
3. **Static Analysis Friendly:** Routes determinable from AST

### Implementation Steps

**1. Framework Detection**

Add to `src/utils/framework-detector.ts`:

```typescript
export function detectFramework(sourceCode: string): FrameworkType {
  // Check imports
  if (sourceCode.includes("from 'your-framework'")) {
    return 'yourframework';
  }
  
  // Existing detection...
}
```

**2. Route Extraction**

Add to route extraction logic in `src/rules/no-duplicate-routes.ts`:

```typescript
if (framework === 'yourframework') {
  // Extract routes for your framework
  // Example: Look for specific AST patterns
  return extractYourFrameworkRoutes(node);
}
```

**3. Tests**

Add test fixtures in `tests/fixtures/yourframework/`:

```
tests/
└── fixtures/
    └── yourframework/
        ├── simple-routes.ts
        ├── router-prefixes.ts
        └── complex-nesting.ts
```

**4. Documentation**

Create `docs/guides/yourframework.md`:

```markdown
# YourFramework Integration Guide

## Quick Start
...

## Framework Detection
...

## Common Patterns
...
```

**5. Preset Configuration**

Add to `src/configs/yourframework.ts`:

```typescript
export default {
  plugins: { 'route-guard': plugin },
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      framework: 'yourframework'
    }]
  }
};
```

**6. Examples**

Create `examples/yourframework-basic/`:

```
examples/
└── yourframework-basic/
    ├── package.json
    ├── app.ts
    ├── eslint.config.js
    └── README.md
```

### Pull Request Checklist

- [ ] Framework detection implemented
- [ ] Route extraction logic added
- [ ] Tests passing (>90% coverage)
- [ ] Documentation created
- [ ] Preset configuration added
- [ ] Example project included
- [ ] README updated

## Limitations

### Current Framework Support

- ✅ Express (full support)
- ✅ Fastify (full support)
- ✅ NestJS (full support)
- ⚙️ Koa (generic mode)
- ⚙️ Hapi (partial - generic mode)
- ⚙️ Restify (generic mode)
- ⚙️ Custom frameworks (generic mode)

### Generic Mode Limitations

**Cannot Detect:**
- Object-based route definitions
- Dynamic route registration
- Runtime-computed paths
- Plugin/module scoping

**Example - Not Detected:**

```javascript
// Object syntax (Hapi)
server.route({
  method: 'GET',  // ❌ Not detected
  path: '/users'
});

// Dynamic paths
const basePath = '/api';
app.get(`${basePath}/users`, handler);  // ❌ Dynamic

// Conditional routes
if (config.enabled) {
  app.get('/feature', handler);  // ⚠️ May not be detected
}
```

**Example - Detected:**

```javascript
// Function call syntax
app.get('/users', handler);  // ✅ Detected
router.post('/posts', handler);  // ✅ Detected
```

## Workarounds

### For Unsupported Syntax

**Option 1:** Use supported patterns where possible

```javascript
// Instead of:
server.route({ method: 'GET', path: '/users' });

// Use:
server.get('/users', handler);  // If framework supports
```

**Option 2:** Document and ignore

```javascript
// eslint-disable-next-line route-guard/no-duplicate-routes
server.route({ method: 'GET', path: '/users' });
```

**Option 3:** Use `ignorePatterns`

```javascript
{
  ignorePatterns: ['src/legacy-routes/**']
}
```

### For Dynamic Routes

**Not Supported:**
```javascript
const prefix = '/api';
app.get(`${prefix}/users`, handler);
```

**Supported Alternative:**
```javascript
const router = app.Router();
router.get('/users', handler);
app.use('/api', router);  // Prefix tracked
```

## Examples

### Koa with Generic Mode

```javascript
// eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';

export default [
  {
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        framework: 'generic'
      }]
    }
  }
];

// app.js
const Koa = require('koa');
const Router = require('@koa/router');

const router = new Router();

router.get('/users', ctx => {});  // ✅ Detected
router.get('/users', ctx => {});  // ❌ ERROR: Duplicate
```

### Custom Framework

```javascript
// my-framework.js
class MyFramework {
  get(path, handler) { /* ... */ }
  post(path, handler) { /* ... */ }
}

const app = new MyFramework();

app.get('/api/users', handler);  // ✅ Detected
app.get('/api/users', handler);  // ❌ ERROR: Duplicate
```

## FAQs

### Q: Will my framework be supported?

**A:** Depends on:
- User demand
- Routing patterns (static analyzable?)
- Framework stability

Open an issue to request support.

### Q: Does generic mode work with decorators?

**A:** No, decorators require framework-specific support (like NestJS).

### Q: Can I mix frameworks?

**A:** Use separate ESLint configs for different directories:

```javascript
export default [
  {
    files: ['src/express/**'],
    rules: {
      'route-guard/no-duplicate-routes': ['error', { framework: 'express' }]
    }
  },
  {
    files: ['src/custom/**'],
    rules: {
      'route-guard/no-duplicate-routes': ['error', { framework: 'generic' }]
    }
  }
];
```

## Summary

**Generic Mode:**
- ✅ Works with most frameworks
- ✅ Basic duplicate detection
- ❌ No prefix resolution
- ❌ No framework-specific features

**Contributing:**
- Open issue to request framework
- Or submit PR with full implementation
- Follow contribution guidelines

For help, see [Contributing Guide](../contributing.md).
