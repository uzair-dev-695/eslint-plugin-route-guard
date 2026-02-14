/**
 * Express-specific configuration preset.
 * 
 * Optimized for Express.js applications with router support and prefix tracking.
 * 
 * @since 0.1.0
 * 
 * @example
 * // Use in flat config
 * import routeGuard from 'eslint-plugin-route-guard';
 * 
 * export default [routeGuard.configs.express];
 */

const expressConfig = {
  /** Framework type */
  framework: 'express' as const,
  /** Path normalization settings */
  pathNormalization: {
    /** Normalization level (2 = normalize parameter names and optional segments) */
    level: 2 as const,
    /** Warn when static and dynamic paths might conflict */
    warnOnStaticVsDynamic: true,
    /** Preserve regex constraints in normalized paths */
    preserveConstraints: true,
  },
  /** Router prefix tracking configuration */
  routerPrefixes: {
    /** Enable router prefix resolution */
    enabled: true,
    /** Maximum nesting depth for routers */
    maxDepth: 5,
  },
};

export default expressConfig;
