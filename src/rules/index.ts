/**
 * Rules registry
 * Export all rules here as they are implemented
 */

// Import rules
import noDuplicateRoutes from './no-duplicate-routes.js';

const rules = {
  'no-duplicate-routes': noDuplicateRoutes,
};

export default rules;
