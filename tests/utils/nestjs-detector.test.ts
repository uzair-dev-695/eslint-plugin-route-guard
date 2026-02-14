/**
 * Tests for NestJS Decorator Detection
 */

import { describe, it, expect } from 'vitest';
import { TSESTree } from '@typescript-eslint/utils';
import { 
  extractControllerPrefix, 
  extractMethodRoutes,
  isNestJSController 
} from '../../src/utils/nestjs-detector.js';

describe('nestjs-detector', () => {
  describe('extractControllerPrefix', () => {
    it('should extract string literal prefix from @Controller decorator', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'UsersController' } as TSESTree.Identifier,
        body: { type: 'ClassBody', body: [] } as unknown as TSESTree.ClassBody,
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Controller' } as TSESTree.Identifier,
              arguments: [
                { type: 'Literal', value: 'users' } as TSESTree.Literal,
              ],
            } as unknown as TSESTree.LeftHandSideExpression,
          } as TSESTree.Decorator,
        ],
        superClass: null,
      } as TSESTree.ClassDeclaration;

      const prefix = extractControllerPrefix(classNode);
      expect(prefix).toBe('users');
    });

    it('should return empty string for @Controller() with no arguments', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'AppController' } as TSESTree.Identifier,
        body: { type: 'ClassBody', body: [] } as unknown as TSESTree.ClassBody,
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Controller' } as TSESTree.Identifier,
              arguments: [],
            } as unknown as TSESTree.LeftHandSideExpression,
          } as TSESTree.Decorator,
        ],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const prefix = extractControllerPrefix(classNode);
      expect(prefix).toBe('');
    });

    it('should return null for class without decorators', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'RegularClass' } as TSESTree.Identifier,
        body: { type: 'ClassBody', body: [] } as unknown as TSESTree.ClassBody,
        decorators: [],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const prefix = extractControllerPrefix(classNode);
      expect(prefix).toBeNull();
    });

    it('should return null for class without @Controller decorator', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'OtherClass' } as TSESTree.Identifier,
        body: { type: 'ClassBody', body: [] } as unknown as TSESTree.ClassBody,
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Injectable' } as TSESTree.Identifier,
              arguments: [],
            } as unknown as TSESTree.LeftHandSideExpression,
          } as TSESTree.Decorator,
        ],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const prefix = extractControllerPrefix(classNode);
      expect(prefix).toBeNull();
    });

    it('should extract template literal prefix', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'ApiController' } as TSESTree.Identifier,
        body: { type: 'ClassBody', body: [] } as unknown as TSESTree.ClassBody,
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Controller' } as TSESTree.Identifier,
              arguments: [
                {
                  type: 'TemplateLiteral',
                  quasis: [
                    { 
                      type: 'TemplateElement', 
                      value: { cooked: 'api', raw: 'api' } 
                    } as TSESTree.TemplateElement,
                  ],
                  expressions: [],
                } as unknown as TSESTree.TemplateLiteral,
              ],
            } as unknown as TSESTree.LeftHandSideExpression,
          } as TSESTree.Decorator,
        ],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const prefix = extractControllerPrefix(classNode);
      expect(prefix).toBe('api');
    });
  });

  describe('isNestJSController', () => {
    it('should return true for class with @Controller decorator', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'UsersController' } as TSESTree.Identifier,
        body: { type: 'ClassBody', body: [] } as unknown as TSESTree.ClassBody,
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Controller' } as TSESTree.Identifier,
              arguments: [],
            } as unknown as TSESTree.LeftHandSideExpression,
          } as TSESTree.Decorator,
        ],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      expect(isNestJSController(classNode)).toBe(true);
    });

    it('should return false for class without decorators', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'RegularClass' } as TSESTree.Identifier,
        body: { type: 'ClassBody', body: [] } as unknown as TSESTree.ClassBody,
        decorators: [],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      expect(isNestJSController(classNode)).toBe(false);
    });

    it('should return false for class with non-Controller decorator', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'ServiceClass' } as TSESTree.Identifier,
        body: { type: 'ClassBody', body: [] } as unknown as TSESTree.ClassBody,
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'Injectable' } as TSESTree.Identifier,
              arguments: [],
            } as unknown as TSESTree.LeftHandSideExpression,
          } as TSESTree.Decorator,
        ],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      expect(isNestJSController(classNode)).toBe(false);
    });
  });

  describe('extractMethodRoutes', () => {
    it('should extract routes from HTTP method decorators', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'UsersController' } as TSESTree.Identifier,
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'MethodDefinition',
              key: { type: 'Identifier', name: 'getUser' } as TSESTree.Expression,
              value: { type: 'FunctionExpression' } as TSESTree.FunctionExpression,
              kind: 'method',
              computed: false,
              static: false,
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Get' } as TSESTree.Identifier,
                    arguments: [
                      { type: 'Literal', value: ':id' } as TSESTree.Literal,
                    ],
                  } as unknown as TSESTree.LeftHandSideExpression,
                } as TSESTree.Decorator,
              ],
              loc: {
                start: { line: 10, column: 2 },
                end: { line: 12, column: 3 },
              },
            } as TSESTree.MethodDefinition,
          ],
        } as unknown as TSESTree.ClassBody,
        decorators: [],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const routes = extractMethodRoutes(classNode, 'users');
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject({
        method: 'GET',
        path: ':id',
        controllerPrefix: 'users',
      });
    });

    it('should handle empty path in decorator', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'ApiController' } as TSESTree.Identifier,
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'MethodDefinition',
              key: { type: 'Identifier', name: 'getRoot' } as TSESTree.Expression,
              value: { type: 'FunctionExpression' } as TSESTree.FunctionExpression,
              kind: 'method',
              computed: false,
              static: false,
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Get' } as TSESTree.Identifier,
                    arguments: [],
                  } as unknown as TSESTree.LeftHandSideExpression,
                } as TSESTree.Decorator,
              ],
              loc: {
                start: { line: 5, column: 2 },
                end: { line: 7, column: 3 },
              },
            } as TSESTree.MethodDefinition,
          ],
        } as unknown as TSESTree.ClassBody,
        decorators: [],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const routes = extractMethodRoutes(classNode, 'api');
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject({
        method: 'GET',
        path: '',
        controllerPrefix: 'api',
      });
    });

    it('should extract multiple routes from different methods', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'UsersController' } as TSESTree.Identifier,
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'MethodDefinition',
              key: { type: 'Identifier', name: 'getAll' } as TSESTree.Expression,
              value: { type: 'FunctionExpression' } as TSESTree.FunctionExpression,
              kind: 'method',
              computed: false,
              static: false,
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Get' } as TSESTree.Identifier,
                    arguments: [],
                  } as unknown as TSESTree.LeftHandSideExpression,
                } as TSESTree.Decorator,
              ],
              loc: {
                start: { line: 5, column: 2 },
                end: { line: 7, column: 3 },
              },
            } as TSESTree.MethodDefinition,
            {
              type: 'MethodDefinition',
              key: { type: 'Identifier', name: 'create' } as TSESTree.Expression,
              value: { type: 'FunctionExpression' } as TSESTree.FunctionExpression,
              kind: 'method',
              computed: false,
              static: false,
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Post' } as TSESTree.Identifier,
                    arguments: [],
                  } as unknown as TSESTree.LeftHandSideExpression,
                } as TSESTree.Decorator,
              ],
              loc: {
                start: { line: 9, column: 2 },
                end: { line: 11, column: 3 },
              },
            } as TSESTree.MethodDefinition,
          ],
        } as unknown as TSESTree.ClassBody,
        decorators: [],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const routes = extractMethodRoutes(classNode, 'users');
      expect(routes).toHaveLength(2);
      expect(routes[0]).toMatchObject({ method: 'GET', path: '' });
      expect(routes[1]).toMatchObject({ method: 'POST', path: '' });
    });

    it('should handle all HTTP method decorators', () => {
      const createMethod = (decoratorName: string, line: number): TSESTree.MethodDefinition => ({
        type: 'MethodDefinition',
        key: { type: 'Identifier', name: `method${decoratorName}` } as TSESTree.Expression,
        value: { type: 'FunctionExpression' } as TSESTree.FunctionExpression,
        kind: 'method',
        computed: false,
        static: false,
        decorators: [
          {
            type: 'Decorator',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: decoratorName } as TSESTree.Identifier,
              arguments: [{ type: 'Literal', value: 'test' } as TSESTree.Literal],
            } as unknown as TSESTree.LeftHandSideExpression,
          } as TSESTree.Decorator,
        ],
        loc: {
          start: { line, column: 2 },
          end: { line: line + 2, column: 3 },
        },
      } as TSESTree.MethodDefinition);

      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'TestController' } as TSESTree.Identifier,
        body: {
          type: 'ClassBody',
          body: [
            createMethod('Get', 5),
            createMethod('Post', 8),
            createMethod('Put', 11),
            createMethod('Delete', 14),
            createMethod('Patch', 17),
            createMethod('Options', 20),
            createMethod('Head', 23),
            createMethod('All', 26),
          ],
        } as unknown as TSESTree.ClassBody,
        decorators: [],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const routes = extractMethodRoutes(classNode, 'test');
      expect(routes).toHaveLength(8);
      expect(routes.map(r => r.method)).toEqual([
        'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'ALL'
      ]);
    });

    it('should skip methods without decorators', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'MixedController' } as TSESTree.Identifier,
        body: {
          type: 'ClassBody',
          body: [
            {
              type: 'MethodDefinition',
              key: { type: 'Identifier', name: 'decorated' } as TSESTree.Expression,
              value: { type: 'FunctionExpression' } as TSESTree.FunctionExpression,
              kind: 'method',
              computed: false,
              static: false,
              decorators: [
                {
                  type: 'Decorator',
                  expression: {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'Get' } as TSESTree.Identifier,
                    arguments: [{ type: 'Literal', value: 'path' } as TSESTree.Literal],
                  } as unknown as TSESTree.LeftHandSideExpression,
                } as TSESTree.Decorator,
              ],
              loc: {
                start: { line: 5, column: 2 },
                end: { line: 7, column: 3 },
              },
            } as TSESTree.MethodDefinition,
            {
              type: 'MethodDefinition',
              key: { type: 'Identifier', name: 'undecorated' } as TSESTree.Expression,
              value: { type: 'FunctionExpression' } as TSESTree.FunctionExpression,
              kind: 'method',
              computed: false,
              static: false,
              decorators: [],
              loc: {
                start: { line: 9, column: 2 },
                end: { line: 11, column: 3 },
              },
            } as unknown as TSESTree.MethodDefinition,
          ],
        } as unknown as TSESTree.ClassBody,
        decorators: [],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const routes = extractMethodRoutes(classNode, 'mixed');
      expect(routes).toHaveLength(1);
      expect(routes[0]).toMatchObject({ method: 'GET', path: 'path' });
    });

    it('should return empty array for empty class body', () => {
      const classNode = {
        type: 'ClassDeclaration',
        id: { type: 'Identifier', name: 'EmptyController' } as TSESTree.Identifier,
        body: { type: 'ClassBody', body: [] } as unknown as TSESTree.ClassBody,
        decorators: [],
        superClass: null,
      } as unknown as TSESTree.ClassDeclaration;

      const routes = extractMethodRoutes(classNode, 'empty');
      expect(routes).toHaveLength(0);
    });
  });
});
