/**
 * Express-specific configuration preset
 * Optimized for Express.js applications with router support
 */

const expressConfig = {
  framework: 'express' as const,
  pathNormalization: {
    level: 2 as const,
    warnOnStaticVsDynamic: true,
    preserveConstraints: true,
  },
  routerPrefixes: {
    enabled: true,
    maxDepth: 5,
  },
};

export default expressConfig;
