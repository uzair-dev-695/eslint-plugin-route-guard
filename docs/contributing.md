# Contributing to eslint-plugin-route-guard

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](../CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## How to Contribute

### Ways to Contribute

- 🐛 **Report bugs** - Found an issue? Let us know!
- ✨ **Suggest features** - Have an idea? Open an issue!
- 📝 **Improve documentation** - Fix typos, clarify examples
- 🔧 **Fix bugs** - Submit a PR for reported issues
- 🚀 **Add features** - Implement new functionality
- 🧪 **Write tests** - Improve test coverage
- 🎨 **Add examples** - Create example projects

### Good First Issues

Look for issues labeled `good first issue` or `help wanted`:

https://github.com/user/eslint-plugin-route-guard/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22

## Development Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 (or yarn/pnpm)
- **Git**

### Perimeter Setup

1. **Fork the repository**

   Click "Fork" on GitHub: https://github.com/user/eslint-plugin-route-guard

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/eslint-plugin-route-guard.git
   cd eslint-plugin-route-guard
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Run tests**

   ```bash
   npm test
   ```

   All tests should pass ✅

6. **Create a branch**

   ```bash
   git checkout -b feature/my-feature
   # or
   git checkout -b fix/bug-description
   ```

## Project Structure

```
eslint-plugin-route-guard/
├── src/                    # Source code
│   ├── index.ts           # Plugin entry point
│   ├── rules/             # ESLint rules
│   │   ├── index.ts
│   │   └── no-duplicate-routes.ts
│   ├── configs/           # Preset configurations
│   │   ├── express.ts
│   │   ├── fastify.ts
│   │   ├── nestjs.ts
│   │   ├── recommended.ts
│   │   └── legacy.ts
│   └── utils/             # Utility functions
│       ├── framework-detector.ts
│       ├── path-normalizer.ts
│       ├── route-tracker.ts
│       ├── router-tracker.ts
│       ├── nestjs-detector.ts
│       ├── performance-cache.ts
│       └── ...
├── tests/                 # Test files
│   ├── rules/             # Rule tests
│   ├── utils/             # Utility tests
│   ├── fixtures/          # Test fixtures
│   └── performance/       # Performance tests
├── docs/                  # Documentation
├── examples/              # Example projects
├── .agent/                # Agent prompts & planning
└── dist/                  # Build output (generated)
```

## Making Changes

### Workflow

1. **Create a branch** from `main`
2. **Make your changes**
3. **Write tests** for new code
4. **Run tests** to ensure nothing broke
5. **Build the project** to verify it compiles
6. **Update documentation** if needed
7. **Commit your changes** with clear messages
8. **Push to your fork**
9. **Open a Pull Request**

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for Koa framework
fix: resolve router prefix tracking issue
docs: update README with new examples
test: add tests for path normalization
refactor: simplify framework detection logic
perf: optimize route caching strategy
chore: update dependencies
```

**Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Refactoring
- `perf`: Performance improvement
- `chore`: Build/tooling changes

### Code Style

- **TypeScript** for all source code
- **Strict mode** enabled
- **ESLint** for linting (run `npm run lint`)
- **Prettier** configuration (auto-format on save)

### Writing Code

**Follow existing patterns:**

```typescript
// Good: Follows project style
export function detectFramework(sourceCode: TSESTree.Program): FrameworkType {
  // Implementation
}

// Bad: Different style
export const detectFramework = (sourceCode) => {
  // Implementation
};
```

**Add JSDoc comments:**

```typescript
/**
 * Detects the web framework used in the source code.
 * 
 * @param sourceCode - The AST program node
 * @returns The detected framework type
 */
export function detectFramework(sourceCode: TSESTree.Program): FrameworkType {
  // Implementation
}
```

**Handle edge cases:**

```typescript
// Handle null/undefined
if (!path || typeof path !== 'string') {
  return null;
}

// Handle empty arrays
if (routes.length === 0) {
  return [];
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run coverage

# Run specific test file
npm test -- path-normalizer.test.ts
```

### Writing Tests

Tests use **Vitest** and **@typescript-eslint/rule-tester**.

**File Naming:**
- `src/utils/foo.ts` → `tests/utils/foo.test.ts`
- Test files mirror source structure

**Example Test:**

```typescript
import { describe, it, expect } from 'vitest';
import { normalizePath } from '../../src/utils/path-normalizer';

describe('normalizePath', () => {
  it('should normalize parameter names', () => {
    const result = normalizePath('/users/:id', 1);
    expect(result).toBe('/users/:param');
  });
  
  it('should handle empty paths', () => {
    const result = normalizePath('', 1);
    expect(result).toBe('');
  });
});
```

**Rule Testing:**

```typescript
import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-duplicate-routes';

const ruleTester = new RuleTester();

ruleTester.run('no-duplicate-routes', rule, {
  valid: [
    {
      code: "app.get('/users', handler);",
    },
  ],
  invalid: [
    {
      code: `
        app.get('/users', handler1);
        app.get('/users', handler2);
      `,
      errors: [{ messageId: 'duplicateRoute' }],
    },
  ],
});
```

### Test Coverage

- **Target:** >90% coverage
- **Critical code:** 100% coverage
- **New features:** Must have tests

Check coverage:

```bash
npm run coverage
```

Open `coverage/index.html` to view detailed report.

## Pull Request Process

### Before Submitting

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Code is linted: `npm run lint`
- [ ] Type-checking passes: `npm run typecheck`
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated (for features/fixes)
- [ ] Examples added/updated (if needed)

### Submitting PR

1. **Push your branch** to your fork
2. **Open a Pull Request** on GitHub
3. **Fill out the PR template** completely
4. **Link related issues** (Fixes #123)
5. **Request review** from maintainers

### PR Title

Follow Conventional Commits:

```
feat: add support for Koa framework
fix: resolve cross-file router tracking issue
docs: improve README troubleshooting section
```

### PR Description

Include:

- **What** changed
- **Why** it changed
- **How** to test
- **Screenshots** (if UI-related)
- **Breaking changes** (if any)

### Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, PR will be merged
- Delete your branch after merge

### After Merge

- Pull latest `main` to your fork
- Delete your feature branch
- Thank you for contributing! 🎉

## Coding Standards

### TypeScript

- Use strict TypeScript
- Prefer explicit types over `any`
- Use interfaces for objects
- Export types when needed

### Naming Conventions

- **Functions:** camelCase (`detectFramework`)
- **Classes:** PascalCase (`RouteTracker`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_DEPTH`)
- **Files:** kebab-case (`framework-detector.ts`)

### Error Handling

```typescript
// Throw descriptive errors
throw new Error(`Invalid normalization level: ${level}`);

// Return null for expected failures
if (!isValidPath(path)) {
  return null;
}
```

### Performance

- Use caching where appropriate
- Avoid unnecessary iterations
- Consider algorithmic complexity
- Profile before optimizing

## Issue Reporting

### Bug Reports

Include:

- **Description:** What happened vs what you expected
- **Reproduction:** Minimal code to reproduce
- **Environment:** Node version, framework, ESLint version
- **Configuration:** Your ESLint config
- **Error messages:** Full error output

Use the [Bug Report template](https://github.com/user/eslint-plugin-route-guard/issues/new?template=bug_report.md).

### Feature Requests

Include:

- **Use case:** Why is this needed?
- **Proposal:** How should it work?
- **Alternatives:** What else have you considered?
- **Examples:** Code samples showing the feature

Use the [Feature Request template](https://github.com/user/eslint-plugin-route-guard/issues/new?template=feature_request.md).

### Questions

- Check existing issues first
- Search documentation
- Use GitHub Discussions for questions
- Stack Overflow for general ESLint questions

## Getting Help

- **Documentation:** [docs/](../docs/)
- **Examples:** [examples/](../examples/)
- **Issues:** https://github.com/user/eslint-plugin-route-guard/issues
- **Discussions:** https://github.com/user/eslint-plugin-route-guard/discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors are recognized in:
- README.md
- CHANGELOG.md
- GitHub Contributors page

Thank you for making this project better! 🚀
