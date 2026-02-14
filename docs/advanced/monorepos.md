# Monorepo Support Guide

Guide for using eslint-plugin-route-guard in monorepo projects (Nx, Turborepo, pnpm workspaces, Yarn workspaces, Lerna).

## Table of Contents

- [Overview](#overview)
- [Configuration Strategies](#configuration-strategies)
- [Nx Monorepo](#nx-monorepo)
- [Turborepo](#turborepo)
- [pnpm Workspaces](#pnpm-workspaces)
- [Yarn Workspaces](#yarn-workspaces)
- [Cross-Package Routes](#cross-package-routes)
- [Performance Optimization](#performance-optimization)

## Overview

Monorepos present unique challenges:
- Multiple packages with routes
- Shared route libraries
- Cross-package route conflicts
- Performance at scale

The plugin supports all major monorepo tools.

## Configuration Strategies

### Strategy 1: Root Configuration (Recommended)

Single ESLint config at root, scoped per package:

```javascript
// eslint.config.js (root)
import routeGuard from 'eslint-plugin-route-guard';

export default [
  {
    files: ['apps/**/*.ts', 'packages/**/*.ts'],
    ...routeGuard.configs.recommended
  },
  
  // API app
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        includePatterns: ['apps/api/src/**'],
        nestjs: { globalPrefix: 'api' }
      }]
    }
  },
  
  // Web app (no route checking)
  {
    files: ['apps/web/**/*.ts'],
    rules: {
      'route-guard/no-duplicate-routes': 'off'
    }
  }
];
```

**Pros:**
- Single configuration source
- Consistent rules across packages
- Easy to maintain

**Cons:**
- All packages linted together (slower)

### Strategy 2: Per-Package Configuration

Each package has its own ESLint config:

```javascript
// apps/api/eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';

export default [
  routeGuard.configs.nestjs,
  {
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        includePatterns: ['src/**'],
        nestjs: { globalPrefix: 'api' }
      }]
    }
  }
];
```

**Pros:**
- Faster (lint packages independently)
- Package-specific rules
- Parallelizable

**Cons:**
- Multiple configs to maintain
- No cross-package detection

### Strategy 3: Hybrid

Root config + package overrides:

```javascript
// eslint.config.js (root)
export default [routeGuard.configs.recommended];

// apps/api/eslint.config.js
import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
  {
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        nestjs: { globalPrefix: 'api' }
      }]
    }
  }
];
```

## Nx Monorepo

### Project Structure

```
/
├── apps/
│   ├── api/
│   │   └── src/
│   │       └── app/
│   │           └── users/
│   │               └── users.controller.ts
│   └── admin/
│       └── src/
│           └── app/
│               └── users/
│                   └── users.controller.ts
├── libs/
│   └── shared/
│       └── src/
│           └── controllers/
└── eslint.config.js
```

### Configuration

```javascript
// eslint.config.js
import routeGuard from 'eslint-plugin-route-guard';
import nxPlugin from '@nx/eslint-plugin';

export default [
  ...nxPlugin.configs['flat/base'],
  
  // Apps
  {
    files: ['apps/**/*.ts'],
    ...routeGuard.configs.nestjs
  },
  
  // API app
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        includePatterns: [
          'apps/api/src/**/*.controller.ts',
          'libs/*/src/**/*.controller.ts'
        ],
        nestjs: { globalPrefix: 'api' }
      }]
    }
  },
  
  // Admin app
  {
    files: ['apps/admin/**/*.ts'],
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        includePatterns: ['apps/admin/src/**/*.controller.ts'],
        nestjs: { globalPrefix: 'admin' }
      }]
    }
  }
];
```

### Per-Project Linting

```json
// apps/api/project.json
{
  "targets": {
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["apps/api/**/*.ts"]
      }
    }
  }
}
```

### Nx Commands

```bash
# Lint all projects
nx run-many --target=lint --all

# Lint specific project
nx lint api

# Lint affected projects
nx affected --target=lint
```

## Turborepo

### Project Structure

```
/
├── apps/
│   ├── api/
│   │   ├── eslint.config.js
│   │   └── src/routes/
│   └── web/
│       └── eslint.config.js
├── packages/
│   └── shared-routes/
│       └── eslint.config.js
└── turbo.json
```

### Root Configuration

```javascript
// eslint.config.js (root)
import routeGuard from 'eslint-plugin-route-guard';

export default [routeGuard.configs.recommended];
```

### App Configuration

```javascript
// apps/api/eslint.config.js
import rootConfig from '../../eslint.config.js';
import routeGuard from 'eslint-plugin-route-guard';

export default [
  ...rootConfig,
  {
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        includePatterns: ['src/routes/**'],
        framework: 'express'
      }]
    }
  }
];
```

### Turborepo Pipeline

```json
// turbo.json
{
  "pipeline": {
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

### Turbo Commands

```bash
# Lint all packages
turbo run lint

# Lint with cache
turbo run lint --cache-dir=.turbo

# Lint specific package
turbo run lint --filter=api
```

## pnpm Workspaces

### Project Structure

```
/
├── apps/
│   ├── api/
│   └── admin/
├── packages/
│   └── routes/
├── pnpm-workspace.yaml
└── eslint.config.js
```

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### ESLint Configuration

```javascript
// eslint.config.js (root)
import routeGuard from 'eslint-plugin-route-guard';

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**']
  },
  
  // All TypeScript files
  {
    files: ['apps/**/*.ts', 'packages/**/*.ts'],
    ...routeGuard.configs.recommended
  },
  
  // Per-app configuration
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      'route-guard/no-duplicate-routes': ['error', {
        includePatterns: ['apps/api/src/**']
      }]
    }
  }
];
```

### pnpm Commands

```bash
# Lint all workspaces
pnpm -r lint

# Lint specific workspace
pnpm --filter api lint

# Parallel linting
pnpm -r --parallel lint
```

## Yarn Workspaces

### Project Structure

```
/
├── packages/
│   ├── api/
│   │   ├── package.json
│   │   └── eslint.config.js
│   └── admin/
│       ├── package.json
│       └── eslint.config.js
├── package.json
└── eslint.config.js
```

### Root package.json

```json
{
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "lint": "yarn workspaces run lint"
  }
}
```

### Workspace package.json

```json
// packages/api/package.json
{
  "name": "@myapp/api",
  "scripts": {
    "lint": "eslint ."
  }
}
```

### Yarn Commands

```bash
# Lint all workspaces
yarn workspaces run lint

# Lint specific workspace
yarn workspace @myapp/api lint
```

## Cross-Package Routes

### Detecting Routes Across Packages

**Scenario:** Shared route libraries

```
/
├── apps/
│   └── api/
│       └── src/
│           └── main.ts (uses shared routes)
└── packages/
    └── routes/
        └── src/
            └── users.routes.ts
```

**Configuration:**

```javascript
// apps/api/eslint.config.js
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      // Include shared package routes
      includePatterns: [
        'apps/api/src/**',
        'packages/routes/src/**'
      ]
    }]
  }
}
```

**Note:** Cross-package detection only works when linting both packages together.

### Isolating Packages

Prevent false positives between independent apps:

```javascript
// apps/api/eslint.config.js
{
  includePatterns: ['apps/api/src/**']  // API routes only
}

// apps/admin/eslint.config.js
{
  includePatterns: ['apps/admin/src/**']  // Admin routes only
}
```

## Performance Optimization

### Parallel Linting

**Nx:**
```bash
nx run-many --target=lint --all --parallel=3
```

**Turborepo:**
```bash
turbo run lint --parallel
```

**pnpm:**
```bash
pnpm -r --parallel lint
```

### Incremental Linting

**Nx:**
```bash
nx affected --target=lint  # Only changed projects
```

**Turborepo:**
```bash
turbo run lint --filter=[HEAD^1]  # Only changed
```

### Caching

**ESLint Cache:**
```bash
npx eslint --cache --cache-location .eslintcache .
```

**Turborepo Cache:**
```json
{
  "pipeline": {
    "lint": {
      "outputs": [".eslintcache"]
    }
  }
}
```

**Nx Cache:**
Automatic - caches by default

### Aggressive Filtering

```javascript
{
  includePatterns: [
    'apps/*/src/routes/**',
    'apps/*/src/controllers/**',
    'packages/*/src/**/*.controller.ts'
  ],
  ignorePatterns: [
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/e2e/**',
    '**/test/**'
  ]
}
```

## Best Practices

### 1. Scope Per Application

```javascript
// apps/api-v1/eslint.config.js
{
  includePatterns: ['apps/api-v1/**']
}

// apps/api-v2/eslint.config.js
{
  includePatterns: ['apps/api-v2/**']
}
```

Prevents false positives between independent APIs.

### 2. Use Different Global Prefixes

```javascript
// apps/api/eslint.config.js
{
  nestjs: { globalPrefix: 'api' }
}

// apps/admin/eslint.config.js
{
  nestjs: { globalPrefix: 'admin' }
}
```

Different prefixes = no conflicts.

### 3. Shared Routes Library

If sharing route definitions:

```javascript
// packages/routes/eslint.config.js
{
  rules: {
    'route-guard/no-duplicate-routes': ['error', {
      // Check for duplicates within the library
      includePatterns: ['src/**']
    }]
  }
}
```

### 4. CI/CD Integration

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      # Nx
      - run: nx affected --target=lint
      
      # Or Turborepo
      - run: turbo run lint
      
      # Or pnpm
      - run: pnpm -r lint
```

## Troubleshooting

### Routes Not Detected Across Packages

**Problem:** Routes in shared packages not detected.

**Solution:** Use `includePatterns` to include shared packages:

```javascript
{
  includePatterns: [
    'apps/api/src/**',
    'packages/shared-routes/src/**'
  ]
}
```

### False Positives in Different Apps

**Problem:** Routes from different apps reported as duplicates.

**Solution:** Scope include patterns per app:

```javascript
// apps/api/eslint.config.js
{
  includePatterns: ['apps/api/**']  // Only this app
}
```

### Slow Linting in Large Monorepo

**Solutions:**
1. Use parallel linting: `--parallel`
2. Lint only affected: `nx affected`
3. Use aggressive `includePatterns`
4. Enable caching

## Summary

**Best Configuration:**
- **Root config** for shared rules
- **Per-package overrides** for specifics
- **Include patterns** to scope packages
- **Parallel linting** for speed

**Performance:**
- Nx: Use `affected` for incremental
- Turborepo: Enable caching
- pnpm: Use `--parallel`
- All: Use `includePatterns` aggressively

For more help, see [Performance Guide](./performance.md).
