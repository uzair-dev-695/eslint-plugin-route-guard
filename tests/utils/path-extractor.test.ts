import { describe, it, expect, vi } from 'vitest';
import { extractLiteralPath, isLiteralPath, isValidPath } from '../../src/utils/path-extractor';
import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

describe('PathExtractor', () => {
  describe('extractLiteralPath()', () => {
    it('extracts string literal', () => {
      const node: TSESTree.Literal = {
        type: AST_NODE_TYPES.Literal,
        value: '/users',
        raw: "'/users'",
        loc: {} as any,
        range: [0, 8],
      } as any;

      expect(extractLiteralPath(node)).toBe('/users');
    });

    it('extracts template literal without expressions', () => {
      const node: TSESTree.TemplateLiteral = {
        type: AST_NODE_TYPES.TemplateLiteral,
        quasis: [
          {
            type: AST_NODE_TYPES.TemplateElement,
            value: { raw: '/users', cooked: '/users' },
            tail: true,
            loc: {} as any,
            range: [0, 6],
          } as any,
        ],
        expressions: [],
        loc: {} as any,
        range: [0, 8],
      } as any;

      expect(extractLiteralPath(node)).toBe('/users');
    });

    it('skips template literal with expressions', () => {
      const node: TSESTree.TemplateLiteral = {
        type: AST_NODE_TYPES.TemplateLiteral,
        quasis: [
          {
            type: AST_NODE_TYPES.TemplateElement,
            value: { raw: '/users/', cooked: '/users/' },
            tail: false,
            loc: {} as any,
            range: [0, 7],
          } as any,
          {
            type: AST_NODE_TYPES.TemplateElement,
            value: { raw: '', cooked: '' },
            tail: true,
            loc: {} as any,
            range: [10, 10],
          } as any,
        ],
        expressions: [{ type: 'Identifier', name: 'id' } as any],
        loc: {} as any,
        range: [0, 11],
      } as any;

      expect(extractLiteralPath(node)).toBeNull();
    });

    it('skips identifier node', () => {
      const node: TSESTree.Identifier = {
        type: AST_NODE_TYPES.Identifier,
        name: 'userPath',
        loc: {} as any,
        range: [0, 8],
      } as any;

      expect(extractLiteralPath(node as any)).toBeNull();
    });

    it('skips binary expression', () => {
      const node: TSESTree.BinaryExpression = {
        type: AST_NODE_TYPES.BinaryExpression,
        operator: '+',
        left: { type: AST_NODE_TYPES.Literal, value: '/users' } as any,
        right: { type: AST_NODE_TYPES.Identifier, name: 'suffix' } as any,
        loc: {} as any,
        range: [0, 15],
      } as any;

      expect(extractLiteralPath(node as any)).toBeNull();
    });

    it('returns null for null node', () => {
      expect(extractLiteralPath(null)).toBeNull();
    });

    it('returns null for undefined node', () => {
      expect(extractLiteralPath(undefined)).toBeNull();
    });

    it('handles non-string literal', () => {
      const node: TSESTree.Literal = {
        type: AST_NODE_TYPES.Literal,
        value: 123,
        raw: '123',
        loc: {} as any,
        range: [0, 3],
      } as any;

      expect(extractLiteralPath(node)).toBeNull();
    });

    it('handles template literal with null cooked value', () => {
      const node: TSESTree.TemplateLiteral = {
        type: AST_NODE_TYPES.TemplateLiteral,
        quasis: [
          {
            type: AST_NODE_TYPES.TemplateElement,
            value: { raw: '\\unicode', cooked: null as any },
            tail: true,
            loc: {} as any,
            range: [0, 8],
          } as any,
        ],
        expressions: [],
        loc: {} as any,
        range: [0, 10],
      } as any;

      expect(extractLiteralPath(node)).toBeNull();
    });

    it('handles empty template literal quasis', () => {
      const node: TSESTree.TemplateLiteral = {
        type: AST_NODE_TYPES.TemplateLiteral,
        quasis: [],
        expressions: [],
        loc: {} as any,
        range: [0, 2],
      } as any;

      expect(extractLiteralPath(node)).toBeNull();
    });

    it('logs debug messages when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const node: TSESTree.Literal = {
        type: AST_NODE_TYPES.Literal,
        value: '/users',
        raw: "'/users'",
        loc: {} as any,
        range: [0, 8],
      } as any;

      extractLiteralPath(node, true);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Extracted string literal: "/users"')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isLiteralPath()', () => {
    it('returns true for string literal', () => {
      const node: TSESTree.Literal = {
        type: AST_NODE_TYPES.Literal,
        value: '/users',
        raw: "'/users'",
        loc: {} as any,
        range: [0, 8],
      } as any;

      expect(isLiteralPath(node)).toBe(true);
    });

    it('returns true for simple template literal', () => {
      const node: TSESTree.TemplateLiteral = {
        type: AST_NODE_TYPES.TemplateLiteral,
        quasis: [
          {
            type: AST_NODE_TYPES.TemplateElement,
            value: { raw: '/users', cooked: '/users' },
            tail: true,
            loc: {} as any,
            range: [0, 6],
          } as any,
        ],
        expressions: [],
        loc: {} as any,
        range: [0, 8],
      } as any;

      expect(isLiteralPath(node)).toBe(true);
    });

    it('returns false for template literal with expressions', () => {
      const node: TSESTree.TemplateLiteral = {
        type: AST_NODE_TYPES.TemplateLiteral,
        quasis: [
          {
            type: AST_NODE_TYPES.TemplateElement,
            value: { raw: '/users/', cooked: '/users/' },
            tail: false,
            loc: {} as any,
            range: [0, 7],
          } as any,
        ],
        expressions: [{ type: AST_NODE_TYPES.Identifier } as any],
        loc: {} as any,
        range: [0, 11],
      } as any;

      expect(isLiteralPath(node)).toBe(false);
    });

    it('returns false for identifier', () => {
      const node: TSESTree.Identifier = {
        type: AST_NODE_TYPES.Identifier,
        name: 'path',
        loc: {} as any,
        range: [0, 4],
      } as any;

      expect(isLiteralPath(node as any)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isLiteralPath(null)).toBe(false);
    });
  });

  describe('isValidPath()', () => {
    it('returns true for non-empty path', () => {
      expect(isValidPath('/users')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isValidPath('')).toBe(false);
    });

    it('returns false for whitespace-only string', () => {
      expect(isValidPath('   ')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isValidPath(null)).toBe(false);
    });
  });
});
