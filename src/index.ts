/**
 * ESLint Plugin Route Guard
 * Detects duplicate and conflicting routes across Express, Fastify, and NestJS
 */

import rules from './rules/index.js';
import recommended from './configs/recommended.js';
import legacy from './configs/legacy.js';

const plugin = {
  meta: {
    name: 'eslint-plugin-route-guard',
    version: '0.1.0'
  },
  configs: {
    recommended
  },
  rules
};

// Default export for ESLint 9+ flat config
export default plugin;

// Named export for legacy ESLint 8.x
export const legacyPlugin = {
  rules,
  configs: {
    recommended: legacy
  }
};
