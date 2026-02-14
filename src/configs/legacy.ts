/**
 * Recommended configuration for ESLint 8.x legacy config.
 * 
 * Use this configuration when using ESLint 8.x with `.eslintrc` config files.
 * For ESLint 9+ flat config, use the default export from the plugin instead.
 * 
 * @since 0.1.0
 * 
 * @example
 * // .eslintrc.js
 * module.exports = {
 *   plugins: ['route-guard'],
 *   extends: ['plugin:route-guard/recommended']
 * };
 */

const legacy = {
  /** ESLint plugins to load */
  plugins: ['route-guard'],
  /** ESLint rules configuration */
  rules: {
    // Rules will be added in Phase 1+
    // 'route-guard/no-duplicate-routes': 'error'
  }
};

export default legacy;
