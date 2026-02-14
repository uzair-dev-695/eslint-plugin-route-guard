/**
 * NestJS-specific configuration preset
 * Optimized for NestJS applications with decorator-based routing
 */

const nestjsConfig = {
  framework: 'nestjs' as const,
  pathNormalization: {
    level: 2 as const,
    warnOnStaticVsDynamic: true,
    preserveConstraints: true,
  },
};

export default nestjsConfig;
