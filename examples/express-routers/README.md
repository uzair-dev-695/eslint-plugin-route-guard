# Express Routers Example

Express application using Router instances to demonstrate router prefix tracking.

## Installation

```bash
npm install
```

## Run ESLint

```bash
npm run lint
```

## What This Demonstrates

- Router instance detection
- Prefix resolution from `app.use('/api', router)`
- Cross-file router tracking
- Duplicate detection across routers

## Expected Behavior

ESLint should detect:
1. Duplicate `/admin/users` route in `admin-router.js`
2. Conflict between main app and router (both define GET `/`)
