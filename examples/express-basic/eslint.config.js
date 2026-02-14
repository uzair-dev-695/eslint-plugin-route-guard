import eslintPluginRouteGuard from 'eslint-plugin-route-guard';

export default [
  {
    plugins: {
      'route-guard': eslintPluginRouteGuard,
    },
    rules: {
      'route-guard/no-duplicate-routes': 'error',
    },
  },
];
