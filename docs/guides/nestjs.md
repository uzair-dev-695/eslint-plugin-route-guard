# NestJS Integration Guide

Complete guide for using eslint-plugin-route-guard with NestJS applications.

## Table of Contents

- [Quick Start](#quick-start)
- [Framework Detection](#framework-detection)
- [Controller Decorators](#controller-decorators)
- [Global Prefix](#global-prefix)
- [Module Organization](#module-organization)
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
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser
    }
  },
  routeGuard.configs.nestjs
];
```

**3. Run ESLint:**

```bash
npx eslint .
```

## Framework Detection

The plugin automatically detects NestJS from decorator usage:

### Auto-Detected Patterns

```typescript
// ✅ Detected as NestJS
import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {}
}

// ✅ Any @Controller decorator triggers NestJS detection
```

### Manual Override

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      framework: 'nestjs'
    }]
  }
}
```

## Controller Decorators

### @Controller Decorator

```typescript
@Controller('users')
export class UsersController {
  @Get()
  findAll() {}  // GET /users
  
  @Get(':id')
  findOne() {}  // GET /users/:id
}

// Controller prefix is prepended to all routes
```

### HTTP Method Decorators

```typescript
import { Controller, Get, Post, Put, Delete, Patch, Options, Head, All } from '@nestjs/common';

@Controller('posts')
export class PostsController {
  @Get()
  findAll() {}       // GET /posts
  
  @Get(':id')
  findOne() {}       // GET /posts/:id
  
  @Post()
  create() {}        // POST /posts
  
  @Put(':id')
  update() {}        // PUT /posts/:id
  
  @Patch(':id')
  patch() {}         // PATCH /posts/:id
  
  @Delete(':id')
  remove() {}        // DELETE /posts/:id
  
  @Options()
  options() {}       // OPTIONS /posts
  
  @Head()
  head() {}          // HEAD /posts
  
  @All('*')
  catchAll() {}      // ALL /posts/*
}
```

### Empty Decorators

```typescript
@Controller()  // No prefix
export class AppController {
  @Get()
  root() {}  // GET /
  
  @Get('health')
  health() {}  // GET /health
}
```

### Multiple Routes per Method

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne() {}
  
  @Get(':id')  // ❌ ERROR: Duplicate route
  findOneAgain() {} 
}
```

## Global Prefix

NestJS applications often use a global prefix:

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');  // Global prefix: /api
  await app.listen(3000);
}
```

### Configuring Global Prefix

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      nestjs: {
        globalPrefix: 'api'
      }
    }]
  }
}
```

**Example:**

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne() {}
}

// Without globalPrefix config: GET /users/:id
// With globalPrefix: 'api': GET /api/users/:id
```

## Module Organization

### Resource-Based Modules

```typescript
// users/users.controller.ts
@Controller('users')
export class UsersController {
  @Get()
  findAll() {}  // GET /users
  
  @Post()
  create() {}   // POST /users
}

// posts/posts.controller.ts
@Controller('posts')
export class PostsController {
  @Get()
  findAll() {}  // GET /posts (different controller, no conflict)
}
```

### Versioned Controllers

```typescript
// users/v1/users-v1.controller.ts
@Controller('v1/users')
export class UsersV1Controller {
  @Get(':id')
  findOne() {}  // GET /v1/users/:id
}

// users/v2/users-v2.controller.ts
@Controller('v2/users')
export class UsersV2Controller {
  @Get(':id')
  findOne() {}  // GET /v2/users/:id (different path, no conflict)
}
```

### Nested Resources

```typescript
@Controller('users/:userId/posts')
export class UserPostsController {
  @Get()
  findAll() {}      // GET /users/:userId/posts
  
  @Get(':id')
  findOne() {}      // GET /users/:userId/posts/:id
  
  @Post()
  create() {}       // POST /users/:userId/posts
}
```

##Best Practices

### 1. One Controller per Resource

```typescript
// ✅ Good: Focused controller
@Controller('users')
export class UsersController {
  @Get() findAll() {}
  @Get(':id') findOne() {}
  @Post() create() {}
  @Put(':id') update() {}
  @Delete(':id') remove() {}
}
```

### 2. Consistent Parameter Names

```typescript
// ❌ Inconsistent (triggers warnings with normalization level 1+)
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne() {}
  
  @Put(':userId')  // ⚠️ Different parameter name
  update() {}
}

// ✅ Consistent
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne() {}
  
  @Put(':id')
  update() {}
}
```

### 3. Use Proper HTTP Methods

```typescript
// ✅ RESTful design
@Controller('posts')
export class PostsController {
  @Get() findAll() {}           // List/search
  @Get(':id') findOne() {}      // Retrieve one
  @Post() create() {}            // Create
  @Put(':id') replace() {}       // Replace entire resource
  @Patch(':id') update() {}      // Partial update
  @Delete(':id') remove() {}     // Delete
}
```

### 4. Organize by Feature Module

```
src/
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── posts/
│   ├── posts.controller.ts
│   ├── posts.service.ts
│   └── posts.module.ts
└── app.module.ts
```

### 5. Avoid Duplicate Routes Across Controllers

```typescript
// ❌ Bad: Duplicate routes in different controllers  
@Controller('api/users')
export class UsersController {
  @Get(':id')
  findOne() {}
}

@Controller('api/users')  // Same prefix!
export class AdminUsersController {
  @Get(':id')  // ❌ ERROR: Duplicate route
  findOneAdmin() {}
}

// ✅ Good: Different prefixes
@Controller('api/users')
export class UsersController {
  @Get(':id')
  findOne() {}
}

@Controller('api/admin/users')  // Different prefix
export class AdminUsersController {
  @Get(':id')  // ✅ OK: Different path
  findOneAdmin() {}
}
```

## Configuration

### Recommended Configuration

```javascript
// eslint.config.js
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
  routeGuard.configs.nestjs,
  {
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        nestjs: {
          globalPrefix: 'api'  // Match your app.setGlobalPrefix()
        },
        pathNormalization: {
          level: 1
        },
        ignorePatterns: [
          '**/*.spec.ts',
          '**/test/**'
        ]
      }]
    }
  }
];
```

### With Monorepo

```javascript
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      includePatterns: [
        'apps/api/src/**/*.controller.ts',
        'libs/*/src/**/*.controller.ts'
      ],
      nestjs: {
        globalPrefix: 'api'
      }
    }]
  }
}
```

## Troubleshooting

### Decorators Not Detected

**Problem:** Plugin doesn't detect NestJS controllers.

**Solutions:**

1. **Ensure TypeScript parser:**
   ```javascript
   {
     languageOptions: {
       parser: '@typescript-eslint/parser'
     }
   }
   ```

2. **Check decorator imports:**
   ```typescript
   // ✅ Detected
   import { Controller, Get } from '@nestjs/common';
   
   // ❌ Not detected (wrong import)
   import { Controller } from './custom';
   ```

3. **Manual framework override:**
   ```javascript
   { framework: 'nestjs' }
   ```

### Global Prefix Not Applied

**Problem:** Routes don't include global prefix.

**Solution:** Configure the global prefix manually:

```javascript
{
  nestjs: {
    globalPrefix: 'api'  // Must match main.ts
  }
}
```

**Note:** The plugin cannot automatically detect `app.setGlobalPrefix()` from `main.ts` because it's runtime code. You must configure it in ESLint.

### Duplicate Routes Across Modules

**Problem:** Same route in different feature modules.

**Common cause:**

```typescript
// users/users.controller.ts
@Controller('api/users')
export class UsersController {}

// admin/users.controller.ts
@Controller('api/users')  // Same prefix!
export class AdminUsersController {}
```

**Solution:** Use different prefixes or scopes:

```typescript
@Controller('api/users')
@Controller('api/admin/users')
```

## NestJS-Specific Notes

### Decorator-Based Routing

- Plugin analyzes TypeScript decorators at AST level
- Requires `@typescript-eslint/parser`
- More static than Express/Fastify (better detection accuracy)

### Service Classes Are Ignored

**Important:** The plugin ONLY detects routes in controller classes (classes with `@Controller` decorator). Service classes are completely ignored, even if they make HTTP client calls.

```typescript
// ✅ This service is IGNORED - no route detection
@Injectable()
export class UsersService {
  constructor(private httpClient: HttpClient) {}
  
  async fetchExternalUsers() {
    // These HTTP calls are NOT detected as routes
    return this.httpClient.get('/external/api/users');
  }
  
  async createExternalUser(data: any) {
    // This is also ignored
    return this.httpClient.post('/external/api/users', data);
  }
}

// ✅ Only THIS controller is checked for routes
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  
  @Get()  // ✅ This IS detected as a route
  async findAll() {
    // Service call inside controller is fine
    return this.usersService.fetchExternalUsers();
  }
}
```

**Why this matters:**
- Express/Fastify use imperative routing: `app.get('/path', handler)`
- NestJS uses declarative routing: `@Get('/path')` on controller methods
- Service HTTP client calls (`httpClient.get()`, `axios.post()`) look like Express routes but are NOT
- The plugin correctly distinguishes between these patterns

**Supported service patterns (all ignored):**
- `@Injectable()` classes with HTTP client calls
- Plain classes with HTTP method calls
- Service-to-service method calls
- Any HTTP library calls inside non-controller classes (axios, fetch, etc.)

### Guards, Interceptors, and Pipes

```typescript
@Controller('users')
@UseGuards(AuthGuard)  // ✅ Ignored by plugin
export class UsersController {
  @Get(':id')
  @UseInterceptors(LoggingInterceptor)  // ✅ Ignored
  findOne(@Param('id') id: string) {}   // ✅ Route detected
}
```

Plugin focuses only on route decorators, ignoring middleware decorators.

### Method Decorators vs Route Decorators

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  @HttpCode(200)       // ✅ Ignored (not a route)
  @Header('X-Custom', 'value')  // ✅ Ignored
  findOne() {}         // ✅ Route detected
}
```

## Examples

See [examples/nestjs-modules](../../examples/nestjs-modules/) for a working example.

## Related Guides

- [Configuration Reference](./configuration.md)
- [Performance Guide](../advanced/performance.md)
- [Rule Documentation](../rules/no-duplicate-routes.md)
