/**
 * Fastify-specific configuration preset.
 * 
 * Optimized for Fastify applications with plugin registration detection.
 * 
 * @since 0.1.0
 * 
 * @example
 * // Use in flat config
 * import routeGuard from 'eslint-plugin-route-guard';
 * 
 * export default [routeGuard.configs.fastify];
 */

const fastifyConfig = {
  /** Framework type */
  framework: 'fastify' as const,
  /** Path normalization settings */
  pathNormalization: {
    /** Normalization level (2 = normalize parameter names and optional segments) */
    level: 2 as const,
    /** Warn when static and dynamic paths might conflict */
    warnOnStaticVsDynamic: true,
    /** Preserve regex constraints in normalized paths */
    preserveConstraints: true,
  },
};

export default fastifyConfig;
