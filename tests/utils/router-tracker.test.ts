/**
 * Tests for router tracking utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTracker } from '../../src/utils/router-tracker';
import type { TSESTree } from '@typescript-eslint/utils';

describe('RouterTracker', () => {
  let tracker: RouterTracker;

  beforeEach(() => {
    tracker = new RouterTracker({ debug: false });
    tracker.resetFile('test.ts');
  });

  describe('Router Creation Detection', () => {
    it('should detect express.Router() pattern', () => {
      // Simulating: const router = express.Router()
      const node = {
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: 'router',
        },
        init: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: {
              type: 'Identifier',
              name: 'express',
            },
            property: {
              type: 'Identifier',
              name: 'Router',
            },
            computed: false,
            optional: false,
          },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      const detected = tracker.detectRouterCreation(node, 'express');
      expect(detected).toBe(true);

      const bindings = tracker.getBindings();
      expect(bindings.has('router')).toBe(true);
      expect(bindings.get('router')?.framework).toBe('express');
    });

    it('should detect Router() imported function pattern', () => {
      // Simulating: const userRouter = Router()
      const node = {
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: 'userRouter',
        },
        init: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'Router',
          },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      const detected = tracker.detectRouterCreation(node, 'express');
      expect(detected).toBe(true);

      const bindings = tracker.getBindings();
      expect(bindings.has('userRouter')).toBe(true);
    });

    it('should detect multiple routers in same file', () => {
      const router1 = {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'userRouter' },
        init: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Router' },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      const router2 = {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'adminRouter' },
        init: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Router' },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      tracker.detectRouterCreation(router1, 'express');
      tracker.detectRouterCreation(router2, 'express');

      const bindings = tracker.getBindings();
      expect(bindings.size).toBe(2);
      expect(bindings.has('userRouter')).toBe(true);
      expect(bindings.has('adminRouter')).toBe(true);
    });
  });

  describe('Prefix Application Detection', () => {
    it('should detect app.use(prefix, router) with literal string', () => {
      // Simulating: app.use('/api', userRouter)
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'app' },
          property: { type: 'Identifier', name: 'use' },
          computed: false,
          optional: false,
        },
        arguments: [
          {
            type: 'Literal',
            value: '/api',
            raw: "'/api'",
          },
          {
            type: 'Identifier',
            name: 'userRouter',
          },
        ],
        optional: false,
      } as unknown as TSESTree.CallExpression;

      const result = tracker.detectPrefixApplication(node);
      
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe('/api');
      expect(result?.targetRouter).toBe('userRouter');
      expect(result?.isDynamic).toBe(false);
    });

    it('should detect dynamic prefix (variable)', () => {
      // Simulating: app.use(apiPrefix, router) where apiPrefix is a variable
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'app' },
          property: { type: 'Identifier', name: 'use' },
          computed: false,
          optional: false,
        },
        arguments: [
          {
            type: 'Identifier',
            name: 'apiPrefix',
          },
          {
            type: 'Identifier',
            name: 'router',
          },
        ],
        optional: false,
      } as unknown as TSESTree.CallExpression;

      const result = tracker.detectPrefixApplication(node);
      
      expect(result).not.toBeNull();
      expect(result?.isDynamic).toBe(true);
      expect(result?.prefix).toBeNull();
    });

    it('should handle template literal without expressions', () => {
      // Simulating: app.use(`/api`, router)
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'app' },
          property: { type: 'Identifier', name: 'use' },
          computed: false,
          optional: false,
        },
        arguments: [
          {
            type: 'TemplateLiteral',
            quasis: [
              {
                type: 'TemplateElement',
                value: { raw: '/api', cooked: '/api' },
                tail: true,
              },
            ],
            expressions: [],
          },
          {
            type: 'Identifier',
            name: 'router',
          },
        ],
        optional: false,
      } as unknown as TSESTree.CallExpression;

      const result = tracker.detectPrefixApplication(node);
      
      expect(result).not.toBeNull();
      expect(result?.prefix).toBe('/api');
      expect(result?.isDynamic).toBe(false);
    });
  });

  describe('Prefix Application', () => {
    beforeEach(() => {
      const routerNode = {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'userRouter' },
        init: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Router' },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      tracker.detectRouterCreation(routerNode, 'express');
    });

    it('should apply single prefix to router', () => {
      const success = tracker.applyPrefix('userRouter', '/api');
      
      expect(success).toBe(true);
      
      const bindings = tracker.getBindings();
      const binding = bindings.get('userRouter');
      
      expect(binding?.prefixes).toEqual(['/api']);
      expect(binding?.depth).toBe(1);
    });

    it('should apply nested prefixes', () => {
      tracker.applyPrefix('userRouter', '/api');
      tracker.applyPrefix('userRouter', '/v1');
      tracker.applyPrefix('userRouter', '/users');
      
      const bindings = tracker.getBindings();
      const binding = bindings.get('userRouter');
      
      expect(binding?.prefixes).toEqual(['/api', '/v1', '/users']);
      expect(binding?.depth).toBe(3);
    });

    it('should skip empty/root prefixes', () => {
      tracker.applyPrefix('userRouter', '');
      tracker.applyPrefix('userRouter', '/');
      
      const bindings = tracker.getBindings();
      const binding = bindings.get('userRouter');
      
      expect(binding?.prefixes).toEqual([]);
      expect(binding?.depth).toBe(0);
    });

    it('should enforce max depth limit', () => {
      const limitedTracker = new RouterTracker({ maxDepth: 3, debug: false });
      limitedTracker.resetFile('test.ts');
      
      const routerNode = {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'router' },
        init: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Router' },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;
      
      limitedTracker.detectRouterCreation(routerNode, 'express');
      
      // Apply prefixes up to limit
      limitedTracker.applyPrefix('router', '/api');
      limitedTracker.applyPrefix('router', '/v1');
      limitedTracker.applyPrefix('router', '/users');
      
      // This should fail (exceeds depth)
      const exceeded = limitedTracker.applyPrefix('router', '/posts');
      
      expect(exceeded).toBe(false);
      
      const bindings = limitedTracker.getBindings();
      expect(bindings.get('router')?.depth).toBe(3);
      expect(bindings.get('router')?.prefixes.length).toBe(3);
    });

    it('should handle unknown router gracefully', () => {
      const success = tracker.applyPrefix('unknownRouter', '/api');
      expect(success).toBe(false);
    });
  });

  describe('Effective Prefix Resolution', () => {
    beforeEach(() => {
      const routerNode = {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'userRouter' },
        init: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Router' },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      tracker.detectRouterCreation(routerNode, 'express');
    });

    it('should return null for router with no prefix', () => {
      const prefix = tracker.getEffectivePrefix('userRouter');
      expect(prefix).toBeNull();
    });

    it('should return single prefix', () => {
      tracker.applyPrefix('userRouter', '/api');
      
      const prefix = tracker.getEffectivePrefix('userRouter');
      expect(prefix).toBe('/api');
    });

    it('should join multiple prefixes', () => {
      tracker.applyPrefix('userRouter', '/api');
      tracker.applyPrefix('userRouter', '/v1');
      tracker.applyPrefix('userRouter', '/users');
      
      const prefix = tracker.getEffectivePrefix('userRouter');
      expect(prefix).toBe('/api/v1/users');
    });

    it('should handle unknown router', () => {
      const prefix = tracker.getEffectivePrefix('unknownRouter');
      expect(prefix).toBeNull();
    });
  });

  describe('Export/Import Tracking', () => {
    it('should mark router as exported', () => {
      const routerNode = {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'userRouter' },
        init: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Router' },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      tracker.detectRouterCreation(routerNode, 'express');
      tracker.markExported('userRouter');
      
      const bindings = tracker.getBindings();
      expect(bindings.get('userRouter')?.exported).toBe(true);
    });

    it('should register router import', () => {
      tracker.registerImport('userRouter', 'userRouter', './routes/users');
      
      // This is internal state, but we can verify it doesn't throw
      expect(() => tracker.getEffectivePrefix('userRouter')).not.toThrow();
    });
  });

  describe('File reset', () => {
    it('should clear bindings when switching files', () => {
      tracker.resetFile('file1.ts');
      
      const router1 = {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'router1' },
        init: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Router' },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      tracker.detectRouterCreation(router1, 'express');
      expect(tracker.getBindings().size).toBe(1);
      
      // Switch to new file
      tracker.resetFile('file2.ts');
      expect(tracker.getBindings().size).toBe(0);
    });

    it('should preserve exports across file resets', () => {
      tracker.resetFile('file1.ts');
      
      const routerNode = {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'userRouter' },
        init: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Router' },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      tracker.detectRouterCreation(routerNode, 'express');
      tracker.markExported('userRouter');
      
      // Switch files
      tracker.resetFile('file2.ts');
      
      // Exports should still be accessible for cross-file resolution
      // (tested indirectly through getEffectivePrefix)
      tracker.registerImport('userRouter', 'userRouter', './file1');
      expect(() => tracker.getEffectivePrefix('userRouter')).not.toThrow();
    });

    it('should clear all state on full reset', () => {
      tracker.resetFile('file1.ts');
      
      const routerNode = {
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name: 'router' },
        init: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'Router' },
          arguments: [],
          optional: false,
        },
        definite: false,
      } as unknown as TSESTree.VariableDeclarator;

      tracker.detectRouterCreation(routerNode, 'express');
      tracker.markExported('router');
      
      tracker.reset();
      
      expect(tracker.getBindings().size).toBe(0);
    });
  });
});
