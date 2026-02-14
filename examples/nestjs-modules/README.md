# NestJS Modules Example

NestJS application with controllers demonstrating decorator-based route detection.

## Installation

```bash
npm install
```

## Run ESLint

```bash
npm run lint
```

## What This Demonstrates

- NestJS decorator detection (@Controller, @Get, @Post)
- Controller prefix resolution
- Module-based route organization
- Duplicate detection across controllers

## Expected Behavior

ESLint should detect the duplicate GET `/users` route in `users.controller.ts`.
