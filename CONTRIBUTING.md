# Contributing to eslint-plugin-route-guard

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/eslint-plugin-route-guard.git
cd eslint-plugin-route-guard
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Run tests**

```bash
npm test
```

5. **Run tests in watch mode**

```bash
npm run test:watch
```

6. **Check types**

```bash
npm run typecheck
```

7. **Generate coverage report**

```bash
npm run coverage
```

## Project Structure

```
eslint-plugin-route-guard/
├── src/
│   ├── index.ts              # Main plugin export
│   ├── configs/              # ESLint configurations
│   │   ├── recommended.ts    # Flat config (ESLint 9+)
│   │   └── legacy.ts         # Legacy config (ESLint 8)
│   ├── rules/                # Rule implementations
│   │   └── index.ts
│   └── utils/                # Shared utilities
│       └── index.ts
├── tests/
│   ├── fixtures/             # Test fixtures
│   ├── rules/                # Rule tests
│   └── utils/                # Utility tests
├── docs/                     # Additional documentation
└── .agent/                   # Project planning and prompts
```

## Development Workflow

### Writing Code

1. **TypeScript Strict Mode**: All code must compile with strict TypeScript settings
2. **No implicit any**: All types must be explicitly declared
3. **Code Style**: Follow existing patterns in the codebase
4. **Comments**: Add JSDoc comments for public APIs

### Writing Tests

1. **Test Coverage**: Aim for >90% coverage on new code
2. **Test Framework**: Use Vitest for all tests
3. **Test Structure**: Follow the existing test patterns
4. **Fixtures**: Add test fixtures for different frameworks

**Example test structure:**

```typescript
import { describe, it, expect } from 'vitest';

describe('MyRule', () => {
  it('should detect duplicate routes', () => {
    // Test implementation
  });

  it('should handle edge cases', () => {
    // Test implementation
  });
});
```

### Building

The project uses Rollup to build dual CJS/ESM outputs:

```bash
npm run build
```

This generates:
- `dist/index.cjs` - CommonJS bundle
- `dist/index.mjs` - ESM bundle
- `dist/index.d.ts` - TypeScript declarations
- Source maps for debugging

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run coverage
```

## Making Changes

### Branch Naming

- Feature: `feature/description`
- Bug fix: `fix/description`
- Documentation: `docs/description`
- Refactor: `refactor/description`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test changes
- `refactor`: Code refactoring
- `chore`: Build/tooling changes
- `perf`: Performance improvements

**Examples:**

```
feat(rules): add no-duplicate-routes rule

Implement basic duplicate route detection across files.
Supports Express, Fastify, and generic HTTP methods.

Closes #123
```

```
fix(utils): handle null in path normalization

Prevent crash when path is null or undefined.
```

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** with clear commit messages
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Ensure all tests pass** (`npm test`)
6. **Ensure TypeScript compiles** (`npm run typecheck`)
7. **Build successfully** (`npm run build`)
8. **Submit PR** with clear description

**PR Template:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing done

## Checklist
- [ ] Tests pass
- [ ] TypeScript compiles
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

## Code Review

All submissions require review. We use GitHub pull requests for this purpose.

**Review Criteria:**
- Code quality and style
- Test coverage
- Documentation completeness
- Backward compatibility
- Performance implications

## Releasing

Releases are managed by maintainers following semantic versioning.

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Publish to npm

## Questions?

- Open an issue for bugs or feature requests
- Use GitHub Discussions for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions help make this project better for everyone!
