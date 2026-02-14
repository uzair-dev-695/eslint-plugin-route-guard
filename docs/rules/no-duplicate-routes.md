# no-duplicate-routes

Detect duplicate and conflicting route definitions across files.

## Rule Details

This rule identifies duplicate HTTP route registrations that would cause runtime conflicts or unexpected behavior. It performs static analysis across your entire codebase to find routes with identical METHOD:PATH combinations.

**Type:** Problem
**Category:** Possible Errors  
**Recommended:** Yes  
**Fixable:** No (manual fix required)

## Why This Rule Exists

Duplicate routes cause several issues:

1. **Unpredictable Behavior:** The second route definition may silently override the first
2. **Debugging Difficulty:** Hard to trace which handler is actually called
3. **Maintenance Issues:** Unclear which route definition is "correct"
4. **Framework Differences:** Some frameworks (Fastify) throw errors, others (Express) silently override

This rule catches these issues during development, before they reach production.

## When Not to Use It

- **Test Files:** Disable for test files where you intentionally create duplicate routes
- **Generated Code:** Disable for auto-generated route files
- **Example/Demo Code:** Disable for documentation or demonstration purposes

Use `ignorePatterns` to exclude specific files/directories.

## Examples

### ❌ Incorrect Code

```javascript
// Same file duplicates
const app = express();

app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.get('/users', (req, res) => {  // ERROR: Duplicate route
  res.json({ data: [] });
});
```

```javascript
// Cross-file duplicates
// file: routes/users.ts
app.get('/api/users/:id', getUserById);

// file: routes/profiles.ts
app.get('/api/users/:id', getProfileById);  // ERROR: Duplicate route
```

```javascript
// Same path, same method (different parameter names)
app.get('/posts/:id', getPost);
app.get('/posts/:postId', getPost);  // WARNING: Duplicate (with normalization level 1+)
```

### ✅ Correct Code

```javascript
// Different methods - OK
app.get('/users', getUsers);
app.post('/users', createUser);
app.delete('/users/:id', deleteUser);
```

```javascript
// Different paths - OK
app.get('/users', getUsers);
app.get('/posts', getPosts);
app.get('/users/:id/posts', getUserPosts);
```

```javascript
// Router prefixes resolved correctly
const userRouter = express.Router();
userRouter.get('/profile', getProfile);  // Route: /profile on router

const adminRouter = express.Router();
adminRouter.get('/profile', getAdminProfile);  // Route: /profile on different router

app.use('/api/users', userRouter);  // Effective: GET /api/users/profile
app.use('/api/admin', adminRouter);  // Effective: GET /api/admin/profile - OK, different prefixes
```

```javascript
// Parameter constraints (preserved with preserveConstraints: true)
app.get('/users/:id(\\d+)', getUserById);       // Only numeric IDs
app.get('/users/:slug([a-z-]+)', getUserBySlug);  // Only slugs - OK, different constraints
```

## Options

This rule accepts an options object with the following properties:

### `framework`

**Type:** `'express' | 'fastify' | 'nestjs' | 'generic' | 'auto'`  
**Default:** `'auto'`

Manually specify framework instead of auto-detection.

```javascript
{
  "rules": {
    "route-guard/no-duplicate-routes": ["error", {
      "framework": "express"
    }]
  }
}
```

**When to use:**
- Auto-detection fails or is unreliable
- Mixed framework project (specify per directory)
- Generic mode for custom frameworks

### `pathNormalization`

**Type:** `object`  
**Default:** `{ level: 1, warnOnStaticVsDynamic: true, preserveConstraints: true }`

Controls how routes are compared for duplication.

#### `pathNormalization.level`

**Type:** `0 | 1 | 2`  
**Default:** `1`

- **0 (none):** Exact path matching only. `/users/:id` ≠ `/users/:userId`
- **1 (params):** Normalize parameter names. `/users/:id` = `/users/:userId`
- **2 (full):** Normalize parameters and constraints. `/users/:id(\\d+)` = `/users/:userId(\\d+)`

```javascript
{
  "pathNormalization": {
    "level": 1  // Recommended for most projects
  }
}
```

**Example:**

```javascript
// Level 0: Different routes (no error)
app.get('/users/:id', handler1);
app.get('/users/:userId', handler2);  // No error

// Level 1: Same route (error)
app.get('/users/:id', handler1);
app.get('/users/:userId', handler2);  // ERROR: Duplicate

// Level 2: Considers constraints
app.get('/users/:id(\\d+)', handler1);      // Numbers only
app.get('/users/:userId(\\d+)', handler2);  // ERROR: Duplicate
app.get('/users/:slug([a-z]+)', handler3);  // Different constraint - WARNING
```

#### `pathNormalization.warnOnStaticVsDynamic`

**Type:** `boolean`  
**Default:** `true`

Warn when static and dynamic routes may conflict.

```javascript
{
  "pathNormalization": {
    "warnOnStaticVsDynamic": true
  }
}
```

**Example:**

```javascript
app.get('/users/admin', getAdmin);     // Static segment
app.get('/users/:id', getUser);        // Dynamic segment - WARNING
// The static route may never be reached if defined after the dynamic route
```

#### `pathNormalization.preserveConstraints`

**Type:** `boolean`  
**Default:** `true`

Whether to consider regex constraints when comparing routes.

```javascript
{
  "pathNormalization": {
    "preserveConstraints": true
  }
}
```

**Example:**

```javascript
// preserveConstraints: true
app.get('/users/:id(\\d+)', handler1);  // Numbers only
app.get('/users/:id([a-z]+)', handler2);  // Letters only - Different, WARNING

// preserveConstraints: false
app.get('/users/:id(\\d+)', handler1);
app.get('/users/:id([a-z]+)', handler2);  // ERROR: Duplicate (constraints ignored)
```

### `routerPrefixes`

**Type:** `object`  
**Default:** `{ enabled: true, maxDepth: 5 }`

Configure router prefix resolution (Express/Fastify).

#### `routerPrefixes.enabled`

**Type:** `boolean`  
**Default:** `true`

Enable/disable router prefix tracking.

```javascript
{
  "routerPrefixes": {
    "enabled": true  // Track app.use('/prefix', router)
  }
}
```

#### `routerPrefixes.maxDepth`

**Type:** `number` (1-10)  
**Default:** `5`

Maximum router nesting depth to resolve.

```javascript
{
  "routerPrefixes": {
    "maxDepth": 3  // Stop resolving after 3 levels
  }
}
```

**Example:**

```javascript
// Depth 1
app.use('/api', router1);

// Depth 2
router1.use('/v1', router2);

// Depth 3
router2.use('/users', router3);

// If maxDepth: 3, prefixes beyond depth 3 won't be resolved
```

### `ignorePatterns`

**Type:** `string[]` (glob patterns)  
**Default:** `[]`

Files to exclude from checking.

```javascript
{
  "ignorePatterns": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**",
    "**/generated/**"
  ]
}
```

**Common patterns:**
- Test files: `**/*.test.ts`, `**/*.spec.ts`, `**/__tests__/**`
- Generated code: `**/generated/**`, `**/*.generated.ts`
- Legacy code: `**/legacy/**`, `**/deprecated/**`
- Build output: `**/dist/**`, `**/build/**`

### `includePatterns`

**Type:** `string[]` (glob patterns)  
**Default:** `[]` (all files)

Only check files matching these patterns.

```javascript
{
  "includePatterns": [
    "src/routes/**",
    "src/api/**",
    "src/controllers/**"
  ]
}
```

**Use when:**
- Large codebase: Only check route directories
- Monorepo: Scope to specific packages
- Mixed content: Only route-related directories

### `ignoreMethods`

**Type:** `string[]`  
**Default:** `[]`

HTTP methods to exclude from checking (case-insensitive).

```javascript
{
  "ignoreMethods": ["OPTIONS", "HEAD"]
}
```

**Common use cases:**
- Automatically generated OPTIONS handlers
- HEAD requests auto-derived from GET
- Custom/non-standard methods you want to skip

**Supported methods:** GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, ALL

### `severity`

**Type:** `'error' | 'warn'`  
**Default:** `'error'`

Report duplicates as errors or warnings.

```javascript
{
  "severity": "warn"  // Report as warnings instead of errors
}
```

**Use `warn` when:**
- Gradually adopting the rule in existing codebase
- Duplicates are acceptable in your architecture
- You want awareness without blocking builds

### `nestjs`

**Type:** `object`  
**Default:** `{ globalPrefix: '' }`

NestJS-specific configuration.

#### `nestjs.globalPrefix`

**Type:** `string`  
**Default:** `''`

Global prefix applied to all NestJS routes.

```javascript
{
  "nestjs": {
    "globalPrefix": "api"  // app.setGlobalPrefix('api')
  }
}
```

**Example:**

```typescript
// NestJS controller
@Controller('users')
export class UsersController {
  @Get(':id')
  getUser() {}  // Route: /users/:id
}

// With globalPrefix: 'api'
// Effective route: GET /api/users/:id
```

### `debug`

**Type:** `boolean`  
**Default:** `false`

Enable detailed debug logging.

```javascript
{
  "debug": true
}
```

**Output example:**

```
[no-duplicate-routes] Processing file: src/routes/users.ts
[no-duplicate-routes] Framework: express (confidence: 0.9, from: imports)
[no-duplicate-routes] Registering route: GET /api/users at src/routes/users.ts:15:3
[no-duplicate-routes] Router prefix applied: /api
```

**Use when:**
- Troubleshooting detection issues
- Verifying framework detection
- Understanding prefix resolution
- Debugging normalization behavior

## Configuration Examples

### Minimal Configuration

```javascript
{
  "rules": {
    "route-guard/no-duplicate-routes": "error"
  }
}
```

Uses all defaults: auto-detection, normalization level 1, router tracking enabled.

### Strict Configuration

```javascript
{
  "rules": {
    "route-guard/no-duplicate-routes": ["error", {
      "pathNormalization": {
        "level": 2,  // Normalize parameters and constraints
        "warnOnStaticVsDynamic": true,
        "preserveConstraints": true
      },
      "ignorePatterns": ["**/*.test.ts"]
    }]
  }
}
```

Maximum duplicate detection with constraint checking.

### Relaxed Configuration

```javascript
{
  "rules": {
    "route-guard/no-duplicate-routes": ["warn", {
      "pathNormalization": {
        "level": 0,  // Exact matching only
        "warnOnStaticVsDynamic": false
      },
      "severity": "warn"
    }]
  }
}
```

Minimal detection, warnings only.

### Large Project Configuration

```javascript
{
  "rules": {
    "route-guard/no-duplicate-routes": ["error", {
      "includePatterns": ["src/routes/**", "src/api/**"],
      "ignorePatterns": ["**/*.test.ts", "**/legacy/**"],
      "ignoreMethods": ["OPTIONS", "HEAD"],
      "routerPrefixes": {
        "maxDepth": 3
      }
    }]
  }
}
```

Optimized for performance on large codebases.

### NestJS Configuration

```javascript
{
  "rules": {
    "route-guard/no-duplicate-routes": ["error", {
      "framework": "nestjs",
      "nestjs": {
        "globalPrefix": "api"
      },
      "pathNormalization": {
        "level": 1
      }
    }]
  }
}
```

NestJS-specific with global prefix.

## Error Messages

### Duplicate Route

```
Duplicate route detected: GET /api/users/:id
  First defined:  src/routes/users.ts:15:3
  Also defined here
  Tip: Consider merging these handlers or using different paths.
```

### Static vs Dynamic Conflict

```
Potential route conflict: GET /api/users/admin
  Static route:  /api/users/admin at src/admin.ts:10:3
  Dynamic route: /api/users/:id at src/users.ts:20:3
  Warning: The static route will never be reached if defined after the dynamic route.
```

### Max Depth Exceeded

```
Router nesting depth exceeds maximum (5)
  At: src/deeply/nested/router.ts:30:3
  Tip: Consider flattening your router structure or increasing maxDepth option.
```

## Related Resources

- [Express Guide](../guides/express.md)
- [Fastify Guide](../guides/fastify.md)
- [NestJS Guide](../guides/nestjs.md)
- [Configuration Reference](../guides/configuration.md)
- [Performance Guide](../advanced/performance.md)

## Version History

- **v0.1.0** (Phase 1): Initial implementation - basic duplicate detection
- **v0.2.0** (Phase 2): Router prefix resolution
- **v0.3.0** (Phase 3): Path normalization
- **v0.4.0** (Phase 4): Multi-framework support, NestJS decorators, configuration options
- **v0.5.0** (Phase 5): Performance optimization, caching
