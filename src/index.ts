/**
 * ESLint Plugin Route Guard
 * 
 * Detects duplicate and conflicting routes across Express, Fastify, and NestJS applications.
 * 
 * @module eslint-plugin-route-guard
 * @since 0.1.0
 * 
 * @example
 * // ESLint 9+ Flat Config
 * import routeGuard from 'eslint-plugin-route-guard';
 * 
 * export default [
 *   {
 *     plugins: { 'route-guard': routeGuard },
 *     rules: {
 *       'route-guard/no-duplicate-routes': 'error'
 *     }
 *   }
 * ];
 * 
 * @example
 * // Use framework-specific presets
 * import routeGuard from 'eslint-plugin-route-guard';
 * 
 * export default [
 *   routeGuard.configs.express, // Express preset
 *   // or routeGuard.configs.fastify
 *   // or routeGuard.configs.nestjs
 * ];
 */

import type { ESLint, Linter } from 'eslint';
import rules from './rules/index.js';
import expressConfig from './configs/express.js';
import fastifyConfig from './configs/fastify.js';
import nestjsConfig from './configs/nestjs.js';
import legacy from './configs/legacy.js';

/**
 * Plugin configuration type
 */
type PluginConfig = {
  /** Plugin metadata */
  meta: {
    /** Plugin name */
    name: string;
    /** Plugin version */
    version: string;
  };
  /** Framework-specific configuration presets */
  configs: Record<string, Linter.FlatConfig>;
  /** ESLint rules provided by this plugin */
  rules: typeof rules;
};

/**
 * The ESLint plugin object for route duplicate detection.
 * 
 * Provides rules and configuration presets for detecting duplicate routes
 * in Express, Fastify, and NestJS applications.
 * 
 * @since 0.1.0
 */
const plugin: PluginConfig = {
  meta: {
    name: 'eslint-plugin-route-guard',
    version: '0.1.0'
  },
  configs: {} as Record<string, Linter.FlatConfig>,
  rules
};

/**
 * Recommended configuration preset.
 * 
 * Enables duplicate route detection with sensible defaults for all frameworks.
 * 
 * @since 0.1.0
 */
plugin.configs.recommended = {
  name: 'route-guard/recommended',
  plugins: {
    'route-guard': plugin as unknown as ESLint.Plugin,
  },
  rules: {
    'route-guard/no-duplicate-routes': 'error',
  },
};

/**
 * Express-specific configuration preset.
 * 
 * Optimized for Express.js applications with router support and prefix tracking.
 * 
 * @since 0.1.0
 */
plugin.configs.express = {
  name: 'route-guard/express',
  plugins: {
    'route-guard': plugin as unknown as ESLint.Plugin,
  },
  rules: {
    'route-guard/no-duplicate-routes': ['error', expressConfig],
  },
};

/**
 * Fastify-specific configuration preset.
 * 
 * Optimized for Fastify applications with plugin registration detection.
 * 
 * @since 0.1.0
 */
plugin.configs.fastify = {
  name: 'route-guard/fastify',
  plugins: {
    'route-guard': plugin as unknown as ESLint.Plugin,
  },
  rules: {
    'route-guard/no-duplicate-routes': ['error', fastifyConfig],
  },
};

/**
 * NestJS-specific configuration preset.
 * 
 * Optimized for NestJS applications with decorator-based routing support.
 * 
 * @since 0.1.0
 */
plugin.configs.nestjs = {
  name: 'route-guard/nestjs',
  plugins: {
    'route-guard': plugin as unknown as ESLint.Plugin,
  },
  rules: {
    'route-guard/no-duplicate-routes': ['error', nestjsConfig],
  },
};

/**
 * Default export for ESLint 9+ flat config.
 * 
 * @example
 * import routeGuard from 'eslint-plugin-route-guard';
 * 
 * export default [routeGuard.configs.recommended];
 * 
 * @since 0.1.0
 */
export default plugin;

/**
 * Legacy plugin export for ESLint 8.x compatibility.
 * 
 * Use this for legacy `.eslintrc` configuration files.
 * 
 * @example
 * // .eslintrc.js
 * module.exports = {
 *   plugins: ['route-guard'],
 *   extends: ['plugin:route-guard/recommended']
 * };
 * 
 * @since 0.1.0
 */
export const legacyPlugin = {
  rules,
  configs: {
    recommended: legacy,
  }
};
