/**
 * Test helper utilities for ESLint rule testing
 * Provides utilities for multi-file testing and common test patterns
 */

import { RuleTester } from 'eslint';
import type { Rule } from 'eslint';

/**
 * Create a RuleTester instance configured for TypeScript
 */
export function createRuleTester(): RuleTester {
  return new RuleTester({
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: false
        }
      }
    }
  });
}

/**
 * Multi-file test case type
 */
export interface MultiFileTestCase {
  files: Record<string, string>;
  errors?: Array<{
    message: string;
    filename?: string;
    line?: number;
    column?: number;
  }>;
}

/**
 * Create a multi-file test helper
 * Note: This is a placeholder for Phase 1+ when we implement actual multi-file testing
 * ESLint's RuleTester doesn't natively support multi-file tests, so we'll need to
 * develop a custom approach using Program:exit and state management
 */
export function createMultiFileTest(testCase: MultiFileTestCase) {
  // This will be implemented in Phase 1 when we build the actual rules
  // For now, return the structure for documentation purposes
  return {
    files: testCase.files,
    errors: testCase.errors || []
  };
}

/**
 * Assert that a plugin has the expected structure
 */
export function assertPluginStructure(plugin: unknown): asserts plugin is {
  meta: { name: string; version: string };
  configs: Record<string, unknown>;
  rules: Record<string, Rule.RuleModule>;
} {
  if (!plugin || typeof plugin !== 'object') {
    throw new Error('Plugin must be an object');
  }

  const p = plugin as Record<string, unknown>;

  if (!p.meta || typeof p.meta !== 'object') {
    throw new Error('Plugin must have a meta object');
  }

  if (!p.configs || typeof p.configs !== 'object') {
    throw new Error('Plugin must have a configs object');
  }

  if (!p.rules || typeof p.rules !== 'object') {
    throw new Error('Plugin must have a rules object');
  }
}

/**
 * Common test fixtures that can be reused across tests
 */
export const fixtures = {
  express: {
    simpleGet: `
      const express = require('express');
      const app = express();
      app.get('/users', (req, res) => {
        res.json({ users: [] });
      });
    `,
    simplePost: `
      const express = require('express');
      const app = express();
      app.post('/users', (req, res) => {
        res.json({ created: true });
      });
    `
  },
  fastify: {
    simpleGet: `
      const fastify = require('fastify')();
      fastify.get('/users', async (request, reply) => {
        return { users: [] };
      });
    `
  },
  nestjs: {
    simpleController: `
      import { Controller, Get } from '@nestjs/common';
      
      @Controller('users')
      export class UsersController {
        @Get()
        findAll() {
          return [];
        }
      }
    `
  }
};
