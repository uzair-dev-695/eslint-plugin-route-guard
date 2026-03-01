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

  describe('Phase 2: Router Prefix Resolution', () => {
    describe('Single Router with Prefix', () => {
      it('resolves single prefix correctly', () => {
        ruleTester.run('single-prefix', rule, {
          valid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                const app = express();
                
                router.get('/users', handler);
                app.use('/api', router);
              `,
            },
          ],
          invalid: [],
        });
      });

      it('detects duplicate with prefix resolution', () => {
        ruleTester.run('duplicate-with-prefix', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                const app = express();
                
                router.get('/users', handler);
                app.use('/api', router);
                app.get('/api/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('handles Router() imported function', () => {
        ruleTester.run('imported-router', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import { Router } from 'express';
                const userRouter = Router();
                
                userRouter.get('/profile', handler);
                app.use('/users', userRouter);
                app.get('/users/profile', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('allows different paths with same prefix', () => {
        ruleTester.run('different-paths-with-prefix', rule, {
          valid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('/users', handler);
                router.get('/posts', handler);
                app.use('/api', router);
              `,
            },
          ],
          invalid: [],
        });
      });

      it('handles multiple routers with different prefixes', () => {
        ruleTester.run('multiple-routers', rule, {
          valid: [
            {
              code: `
                import express from 'express';
                const userRouter = express.Router();
                const postRouter = express.Router();
                
                userRouter.get('/list', handler);
                postRouter.get('/list', handler);
                
                app.use('/users', userRouter);
                app.use('/posts', postRouter);
              `,
            },
          ],
          invalid: [],
        });
      });
    });

    describe('Nested Router Prefixes', () => {
      it('resolves nested prefixes (depth 2)', () => {
        ruleTester.run('nested-prefix-depth-2', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router1 = express.Router();
                const router2 = express.Router();
                
                router2.get('/users', handler);
                router1.use('/v1', router2);
                app.use('/api', router1);
                
                app.get('/api/v1/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('resolves nested prefixes (depth 3)', () => {
        ruleTester.run('nested-prefix-depth-3', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const r1 = express.Router();
                const r2 = express.Router();
                const r3 = express.Router();
                
                r3.get('/profile', handler);
                r2.use('/users', r3);
                r1.use('/v1', r2);
                app.use('/api', r1);
                
                app.get('/api/v1/users/profile', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('allows different endpoints in nested structure', () => {
        ruleTester.run('nested-different-endpoints', rule, {
          valid: [
            {
              code: `
                import express from 'express';
                const router1 = express.Router();
                const router2 = express.Router();
                
                router2.get('/users', handler);
                router1.use('/v1', router2);
                app.use('/api', router1);
                
                app.get('/api/v2/users', handler);
              `,
            },
          ],
          invalid: [],
        });
      });

      it('handles complex nested router chains', () => {
        ruleTester.run('complex-nested', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const apiRouter = express.Router();
                const v1Router = express.Router();
                const userRouter = express.Router();
                
                userRouter.get('/:id', handler);
                v1Router.use('/users', userRouter);
                apiRouter.use('/v1', v1Router);
                app.use('/api', apiRouter);
                
                app.get('/api/v1/users/:id', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('respects max nesting depth limit', () => {
        ruleTester.run('max-depth-limit', rule, {
          valid: [
            {
              // This should NOT detect duplicate because depth > 5
              code: `
                import express from 'express';
                const r1 = express.Router();
                const r2 = express.Router();
                const r3 = express.Router();
                const r4 = express.Router();
                const r5 = express.Router();
                const r6 = express.Router();
                
                r6.get('/endpoint', handler);
                r5.use('/level5', r6);
                r4.use('/level4', r5);
                r3.use('/level3', r4);
                r2.use('/level2', r3);
                r1.use('/level1', r2);
                app.use('/api', r1);
                
                // This won't be detected as duplicate (exceeds depth)
                app.get('/api/level1/level2/level3/level4/level5/endpoint', handler);
              `,
            },
          ],
          invalid: [],
        });
      });
    });

    describe('Edge Cases - Prefixes', () => {
      it('handles empty string prefix', () => {
        ruleTester.run('empty-prefix', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('/users', handler);
                app.use('', router);
                app.get('/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('handles root prefix', () => {
        ruleTester.run('root-prefix', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('/users', handler);
                app.use('/', router);
                app.get('/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('handles trailing slashes in prefix', () => {
        ruleTester.run('trailing-slash-prefix', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('/users', handler);
                app.use('/api/', router);
                app.get('/api/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('handles leading slash missing in route', () => {
        ruleTester.run('missing-leading-slash', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('users', handler);
                app.use('/api', router);
                app.get('/api/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('handles multiple consecutive slashes', () => {
        ruleTester.run('multiple-slashes', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('//users', handler);
                app.use('/api//', router);
                app.get('/api/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });
    });

    describe('Dynamic Prefix Handling', () => {
      it('skips dynamic prefix (variable)', () => {
        ruleTester.run('dynamic-prefix-variable', rule, {
          valid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                const apiPrefix = '/api';
                
                router.get('/users', handler);
                app.use(apiPrefix, router); // Dynamic - should skip
                
                // This won't be detected as duplicate (prefix not resolved)
                app.get('/api/users', handler);
              `,
            },
          ],
          invalid: [],
        });
      });

      it('skips dynamic prefix (expression)', () => {
        ruleTester.run('dynamic-prefix-expression', rule, {
          valid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('/users', handler);
                app.use(process.env.PREFIX, router);
                
                app.get('/api/users', handler);
              `,
            },
          ],
          invalid: [],
        });
      });

      it('handles template literal prefix without expressions', () => {
        ruleTester.run('template-literal-prefix', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('/users', handler);
                app.use(\`/api\`, router);
                app.get('/api/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });
    });

    describe('Router Without Prefix', () => {
      it('detects duplicates on unprefixed router', () => {
        ruleTester.run('unprefixed-router-duplicate', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('/users', handler);
                router.get('/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('allows router used before prefix applied', () => {
        ruleTester.run('router-used-before-prefix', rule, {
          valid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('/users', handler);
                // Router has routes but prefix not applied yet
                app.get('/users', handler);
              `,
            },
          ],
          invalid: [],
        });
      });
    });

    describe('Multiple Routers Edge Cases', () => {
      it('handles same prefix on different routers', () => {
        ruleTester.run('same-prefix-different-routers', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const router1 = express.Router();
                const router2 = express.Router();
                
                router1.get('/users', handler);
                router2.get('/users', handler);
                
                app.use('/api', router1);
                app.use('/api', router2);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('handles router reused with different prefix', () => {
        ruleTester.run('router-reused', rule, {
          valid: [
            {
              code: `
                import express from 'express';
                const router = express.Router();
                
                router.get('/list', handler);
                
                app.use('/users', router);
                app.use('/posts', router);
              `,
            },
          ],
          invalid: [],
        });
      });
    });
  });

  describe('NestJS Framework', () => {
    describe('Controller Route Detection', () => {
      it('detects duplicate routes in NestJS controllers', () => {
        ruleTester.run('nestjs-controller-duplicates', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import { Controller, Get } from '@nestjs/common';
                
                @Controller('users')
                export class UsersController {
                  @Get(':id')
                  findOne() {}
                  
                  @Get(':id')
                  findOneAgain() {}
                }
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('allows different routes in controller', () => {
        ruleTester.run('nestjs-controller-different-routes', rule, {
          valid: [
            {
              code: `
                import { Controller, Get, Post } from '@nestjs/common';
                
                @Controller('users')
                export class UsersController {
                  @Get()
                  findAll() {}
                  
                  @Get(':id')
                  findOne() {}
                  
                  @Post()
                  create() {}
                }
              `,
            },
          ],
          invalid: [],
        });
      });
    });

    describe('Service Classes - Should NOT Detect Routes', () => {
      it('ignores HTTP client calls in service classes', () => {
        ruleTester.run('nestjs-service-http-client', rule, {
          valid: [
            {
              code: `
                import { Injectable } from '@nestjs/common';
                import { HttpService } from '@nestjs/axios';
                
                @Injectable()
                export class UsersService {
                  constructor(private httpService: HttpService) {}
                  
                  async getUsers() {
                    // This should NOT be detected as a route
                    return this.httpService.get('/api/users').toPromise();
                  }
                  
                  async getUserById(id: string) {
                    // This should NOT be detected as a route
                    return this.httpService.get(\`/api/users/\${id}\`).toPromise();
                  }
                  
                  async createUser(data: any) {
                    // This should NOT be detected as a route
                    return this.httpService.post('/api/users', data).toPromise();
                  }
                }
              `,
            },
          ],
          invalid: [],
        });
      });

      it('ignores service method calls', () => {
        ruleTester.run('nestjs-service-calls', rule, {
          valid: [
            {
              code: `
                import { Injectable } from '@nestjs/common';
                
                @Injectable()
                export class UsersService {
                  async findAll() {
                    return [];
                  }
                }
                
                @Injectable()
                export class PostsService {
                  constructor(private usersService: UsersService) {}
                  
                  async getPostsWithUsers() {
                    // Service calling another service - should NOT be detected
                    const users = await this.usersService.findAll();
                    return users;
                  }
                }
              `,
            },
          ],
          invalid: [],
        });
      });

      it('ignores axios calls in services', () => {
        ruleTester.run('nestjs-service-axios', rule, {
          valid: [
            {
              code: `
                import { Injectable } from '@nestjs/common';
                import axios from 'axios';
                
                @Injectable()
                export class ExternalApiService {
                  async fetchData() {
                    // These should NOT be detected as routes
                    const response1 = await axios.get('/external/api/data');
                    const response2 = await axios.post('/external/api/submit', {});
                    return [response1, response2];
                  }
                }
              `,
            },
          ],
          invalid: [],
        });
      });

      it('ignores plain class HTTP calls (no decorator)', () => {
        ruleTester.run('nestjs-plain-class', rule, {
          valid: [
            {
              code: `
                export class ApiClient {
                  async get(path: string) {
                    return fetch(path).then(r => r.json());
                  }
                  
                  async post(path: string, data: any) {
                    return fetch(path, { method: 'POST', body: JSON.stringify(data) });
                  }
                }
                
                const client = new ApiClient();
                client.get('/api/users');
                client.post('/api/users', {});
              `,
            },
          ],
          invalid: [],
        });
      });
    });

    describe('Mixed Controller and Service', () => {
      it('detects controller routes but ignores service HTTP calls in same file', () => {
        ruleTester.run('nestjs-mixed-controller-service', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import { Controller, Get, Injectable } from '@nestjs/common';
                import { HttpService } from '@nestjs/axios';
                
                @Injectable()
                export class ApiService {
                  constructor(private http: HttpService) {}
                  
                  // This should be IGNORED (service HTTP call)
                  async externalCall() {
                    return this.http.get('/external/api').toPromise();
                  }
                }
                
                @Controller('users')
                export class UsersController {
                  constructor(private apiService: ApiService) {}
                  
                  // This SHOULD be detected
                  @Get(':id')
                  findOne() {
                    return this.apiService.externalCall();
                  }
                  
                  // This SHOULD be detected as duplicate
                  @Get(':id')
                  findOneDuplicate() {
                    return {};
                  }
                }
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });
    });

    describe('Express/Fastify Regression Tests', () => {
      it('still detects Express routes', () => {
        ruleTester.run('express-still-works', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import express from 'express';
                const app = express();
                
                app.get('/users', handler);
                app.get('/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });

      it('still detects Fastify routes', () => {
        ruleTester.run('fastify-still-works', rule, {
          valid: [],
          invalid: [
            {
              code: `
                import Fastify from 'fastify';
                const fastify = Fastify();
                
                fastify.get('/users', handler);
                fastify.get('/users', handler);
              `,
              errors: [{ messageId: 'duplicateRoute' }],
            },
          ],
        });
      });
    });
  });
});