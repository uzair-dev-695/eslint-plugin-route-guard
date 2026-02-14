/**
 * Fastify-specific configuration preset
 * Optimized for Fastify applications
 */

const fastifyConfig = {
  framework: 'fastify' as const,
  pathNormalization: {
    level: 2 as const,
    warnOnStaticVsDynamic: true,
    preserveConstraints: true,
  },
};

export default fastifyConfig;
