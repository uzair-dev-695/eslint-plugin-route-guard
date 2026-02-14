import eslintPluginRouteGuard from 'eslint-plugin-route-guard';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      'route-guard': eslintPluginRouteGuard,
    },
    rules: {
      'route-guard/no-duplicate-routes': 'error',
    },
  },
];
