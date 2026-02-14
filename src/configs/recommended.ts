/**
 * Recommended configuration for ESLint 9+ Flat Config.
 * 
 * Enables duplicate route detection with sensible defaults that work
 * across all supported frameworks (Express, Fastify, NestJS).
 * 
 * @since 0.1.0
 * 
 * @example
 * // Use in flat config
 * import routeGuard from 'eslint-plugin-route-guard';
 * 
 * export default [routeGuard.configs.recommended];
 */

const recommended = {
  /** Configuration name */
  name: 'route-guard/recommended',
  /** ESLint rules */
  rules: {
    // Rules will be added in Phase 1+
    // 'route-guard/no-duplicate-routes': 'error'
  }
};

export default recommended;
