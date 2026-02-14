/**
 * NestJS-specific configuration preset.
 * 
 * Optimized for NestJS applications with decorator-based routing support.
 * Detects @Controller, @Get, @Post, and other HTTP method decorators.
 * 
 * @since 0.1.0
 * 
 * @example
 * // Use in flat config
 * import routeGuard from 'eslint-plugin-route-guard';
 * 
 * export default [routeGuard.configs.nestjs];
 */

const nestjsConfig = {
  /** Framework type */
  framework: 'nestjs' as const,
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

export default nestjsConfig;
