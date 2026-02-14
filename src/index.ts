/**
 * ESLint Plugin Route Guard
 * Detects duplicate and conflicting routes across Express, Fastify, and NestJS
 */

import type { ESLint, Linter } from 'eslint';
import rules from './rules/index.js';
import expressConfig from './configs/express.js';
import fastifyConfig from './configs/fastify.js';
import nestjsConfig from './configs/nestjs.js';
import legacy from './configs/legacy.js';

type PluginConfig = {
  meta: {
    name: string;
    version: string;
  };
  configs: Record<string, Linter.FlatConfig>;
  rules: typeof rules;
};

// Create plugin object first
const plugin: PluginConfig = {
  meta: {
    name: 'eslint-plugin-route-guard',
    version: '0.1.0'
  },
  configs: {} as Record<string, Linter.FlatConfig>,
  rules
};

// Add configs after plugin is defined to avoid circular reference
plugin.configs.recommended = {
  name: 'route-guard/recommended',
  plugins: {
    'route-guard': plugin as unknown as ESLint.Plugin,
  },
  rules: {
    'route-guard/no-duplicate-routes': 'error',
  },
};

plugin.configs.express = {
  name: 'route-guard/express',
  plugins: {
    'route-guard': plugin as unknown as ESLint.Plugin,
  },
  rules: {
    'route-guard/no-duplicate-routes': ['error', expressConfig],
  },
};

plugin.configs.fastify = {
  name: 'route-guard/fastify',
  plugins: {
    'route-guard': plugin as unknown as ESLint.Plugin,
  },
  rules: {
    'route-guard/no-duplicate-routes': ['error', fastifyConfig],
  },
};

plugin.configs.nestjs = {
  name: 'route-guard/nestjs',
  plugins: {
    'route-guard': plugin as unknown as ESLint.Plugin,
  },
  rules: {
    'route-guard/no-duplicate-routes': ['error', nestjsConfig],
  },
};

// Default export for ESLint 9+ flat config
export default plugin;

// Named export for legacy ESLint 8.x
export const legacyPlugin = {
  rules,
  configs: {
    recommended: legacy,
  }
};
