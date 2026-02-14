import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import rule from '../../src/rules/no-duplicate-routes';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
  },
});

afterAll(() => {
  RuleTester.afterAll(() => {});
});

describe('no-duplicate-routes', () => {
  describe('Valid - No Duplicates', () => {
    it('allows same path with different methods', () => {
      ruleTester.run('different-methods', rule, {
        valid: [
          {
            code: `
              app.get('/users', handler);
              app.post('/users', handler);
            `,
          },
        ],
        invalid: [],
      });
    });

    it('allows same method with different paths', () => {
      ruleTester.run('different-paths', rule, {
        valid: [
          {
            code: `
              app.get('/users', handler);
              app.get('/posts', handler);
            `,
          },
        ],
        invalid: [],
      });
    });

    it('allows routes on different objects', () => {
      ruleTester.run('different-objects', rule, {
        valid: [
          {
            code: `
              app.get('/users', handler);
              router.get('/users', handler);
            `,
          },
        ],
        invalid: [],
      });
    });

    it('allows all HTTP methods', () => {
      ruleTester.run('all-methods', rule, {
        valid: [
          {
            code: `
              app.get('/path', h);
              app.post('/path', h);
              app.put('/path', h);
              app.delete('/path', h);
              app.patch('/path', h);
              app.head('/path', h);
              app.options('/path', h);
              app.all('/path', h);
            `,
          },
        ],
        invalid: [],
      });
    });

    it('allows simple template literals', () => {
      ruleTester.run('template-literals', rule, {
        valid: [
          {
            code: "app.get(`/users`, handler);",
          },
        ],
        invalid: [],
      });
    });
  });

  describe('Invalid - Duplicates Detected', () => {
    it('detects same file duplicates', () => {
      ruleTester.run('same-file-duplicate', rule, {
        valid: [],
        invalid: [
          {
            code: `
              app.get('/users', handler);
              app.get('/users', anotherHandler);
            `,
            errors: [
              {
                messageId: 'duplicateRoute',
              },
            ],
          },
        ],
      });
    });

    it('detects duplicate POST routes', () => {
      ruleTester.run('post-duplicate', rule, {
        valid: [],
        invalid: [
          {
            code: `
              app.post('/users', handler);
              app.post('/users', handler);
            `,
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });

    it('detects duplicates with different handlers', () => {
      ruleTester.run('different-handlers', rule, {
        valid: [],
        invalid: [
          {
            code: `
              router.get('/api/data', firstHandler);
              router.get('/api/data', secondHandler);
            `,
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });

    it('detects template literal duplicating string literal', () => {
      ruleTester.run('template-vs-string', rule, {
        valid: [],
        invalid: [
          {
            code: `
              app.get('/users', handler);
              app.get(\`/users\`, handler);
            `,
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });

    it('detects multiple duplicates', () => {
      ruleTester.run('multiple-duplicates', rule, {
        valid: [],
        invalid: [
          {
            code: `
              app.get('/users', h1);
              app.get('/users', h2);
              app.post('/data', h3);
              app.post('/data', h4);
            `,
            errors: [
              { messageId: 'duplicateRoute' },
              { messageId: 'duplicateRoute' },
            ],
          },
        ],
      });
    });
  });

  describe('Edge Cases - Skipped Paths', () => {
    it('skips template literals with expressions', () => {
      ruleTester.run('template-with-expression', rule, {
        valid: [
          {
            code: "app.get(`/users/${id}`, handler);",
          },
        ],
        invalid: [],
      });
    });

    it('skips variable paths', () => {
      ruleTester.run('variable-path', rule, {
        valid: [
          {
            code: `
              const path = '/users';
              app.get(path, handler);
            `,
          },
        ],
        invalid: [],
      });
    });

    it('skips computed paths', () => {
      ruleTester.run('computed-path', rule, {
        valid: [
          {
            code: "app.get('/users' + suffix, handler);",
          },
        ],
        invalid: [],
      });
    });

    it('skips non-string arguments', () => {
      ruleTester.run('non-string-arg', rule, {
        valid: [
          {
            code: 'app.get(123, handler);',
          },
        ],
        invalid: [],
      });
    });

    it('skips routes without arguments', () => {
      ruleTester.run('no-args', rule, {
        valid: [
          {
            code: 'app.get();',
          },
        ],
        invalid: [],
      });
    });

    it('skips non-HTTP method calls', () => {
      ruleTester.run('non-http-method', rule, {
        valid: [
          {
            code: `
              app.listen(3000);
              app.use(middleware);
              app.configure(config);
            `,
          },
        ],
        invalid: [],
      });
    });
  });

  describe('Framework Detection', () => {
    it('works with Express imports', () => {
      ruleTester.run('express-import', rule, {
        valid: [],
        invalid: [
          {
            code: `
              import express from 'express';
              const app = express();
              app.get('/users', h1);
              app.get('/users', h2);
            `,
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });

    it('works with Fastify imports', () => {
      ruleTester.run('fastify-import', rule, {
        valid: [],
        invalid: [
          {
            code: `
              import fastify from 'fastify';
              const server = fastify();
              server.get('/users', h1);
              server.get('/users', h2);
            `,
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });

    it('works without framework imports (generic mode)', () => {
      ruleTester.run('generic-mode', rule, {
        valid: [],
        invalid: [
          {
            code: `
              const customApp = createApp();
              customApp.get('/users', h1);
              customApp.get('/users', h2);
            `,
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });
  });

  describe('Manual Framework Override', () => {
    it('respects framework config option', () => {
      ruleTester.run('manual-override', rule, {
        valid: [],
        invalid: [
          {
            code: `
              server.get('/users', h1);
              server.get('/users', h2);
            `,
            options: [{ framework: 'fastify' }],
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('handles mixed methods and paths', () => {
      ruleTester.run('mixed-routes', rule, {
        valid: [
          {
            code: `
              app.get('/users', h);
              app.post('/users', h);
              app.get('/posts', h);
              app.delete('/users/:id', h);
            `,
          },
        ],
        invalid: [],
      });
    });

    it('detects duplicates in long files', () => {
      ruleTester.run('long-file', rule, {
        valid: [],
        invalid: [
          {
            code: `
              app.get('/route1', h);
              app.get('/route2', h);
              app.get('/route3', h);
              app.post('/route4', h);
              app.get('/route5', h);
              app.get('/route1', h);
            `,
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });

    it('handles routes with different parameter styles', () => {
      ruleTester.run('params', rule, {
        valid: [
          {
            code: `
              app.get('/users/:id', h);
              app.get('/users/:userId', h);
            `,
          },
        ],
        invalid: [],
      });
    });

    it('treats literal paths case-sensitively', () => {
      ruleTester.run('case-sensitive', rule, {
        valid: [
          {
            code: `
              app.get('/Users', h);
              app.get('/users', h);
            `,
          },
        ],
        invalid: [],
      });
    });
  });

  describe('Method Name Variations', () => {
    it('normalizes method names to uppercase', () => {
      ruleTester.run('method-normalization', rule, {
        valid: [],
        invalid: [
          {
            code: `
              app.get('/test', h);
              app.get('/test', h);
            `,
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });

    it('handles all method', () => {
      ruleTester.run('all-method', rule, {
        valid: [],
        invalid: [
          {
            code: `
              app.all('/test', h);
              app.all('/test', h);
            `,
            errors: [{ messageId: 'duplicateRoute' }],
          },
        ],
      });
    });
  });
});
