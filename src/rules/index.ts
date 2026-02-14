/**
 * Rules registry for eslint-plugin-route-guard.
 * 
 * This module exports all ESLint rules provided by the plugin.
 * 
 * @module rules
 * @since 0.1.0
 */

// Import rules
import noDuplicateRoutes from './no-duplicate-routes.js';

/**
 * All rules provided by eslint-plugin-route-guard.
 * 
 * @since 0.1.0
 */
const rules = {
  /** Detects duplicate and conflicting route definitions */
  'no-duplicate-routes': noDuplicateRoutes,
};

export default rules;
