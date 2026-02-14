/**
 * Smoke test for eslint-plugin-route-guard
 * Validates that the plugin loads correctly and has the expected structure
 */

import { describe, it, expect } from 'vitest';
import plugin, { legacyPlugin } from '../../src/index.js';
import { assertPluginStructure } from '../utils/test-helpers.js';

describe('Plugin Smoke Test', () => {
  describe('Default Export (Flat Config)', () => {
    it('should export a plugin object', () => {
      expect(plugin).toBeDefined();
      expect(typeof plugin).toBe('object');
    });

    it('should have meta information', () => {
      expect(plugin.meta).toBeDefined();
      expect(plugin.meta.name).toBe('eslint-plugin-route-guard');
      expect(plugin.meta.version).toBe('0.1.0');
    });

    it('should have configs object', () => {
      expect(plugin.configs).toBeDefined();
      expect(typeof plugin.configs).toBe('object');
      expect(plugin.configs.recommended).toBeDefined();
    });

    it('should have rules object', () => {
      expect(plugin.rules).toBeDefined();
      expect(typeof plugin.rules).toBe('object');
    });

    it('should have valid plugin structure', () => {
      expect(() => assertPluginStructure(plugin)).not.toThrow();
    });
  });

  describe('Legacy Export (ESLint 8.x)', () => {
    it('should export a legacy plugin object', () => {
      expect(legacyPlugin).toBeDefined();
      expect(typeof legacyPlugin).toBe('object');
    });

    it('should have configs object', () => {
      expect(legacyPlugin.configs).toBeDefined();
      expect(typeof legacyPlugin.configs).toBe('object');
      expect(legacyPlugin.configs.recommended).toBeDefined();
    });

    it('should have rules object', () => {
      expect(legacyPlugin.rules).toBeDefined();
      expect(typeof legacyPlugin.rules).toBe('object');
    });
  });

  describe('Recommended Config (Flat)', () => {
    it('should have a name', () => {
      expect(plugin.configs.recommended).toBeDefined();
      expect(plugin.configs.recommended.name).toBe('route-guard/recommended');
    });

    it('should have rules defined', () => {
      expect(plugin.configs.recommended.rules).toBeDefined();
      expect(typeof plugin.configs.recommended.rules).toBe('object');
    });
  });

  describe('Recommended Config (Legacy)', () => {
    it('should have plugins array', () => {
      expect(legacyPlugin.configs.recommended).toBeDefined();
      expect(legacyPlugin.configs.recommended.plugins).toBeDefined();
      expect(Array.isArray(legacyPlugin.configs.recommended.plugins)).toBe(true);
      expect(legacyPlugin.configs.recommended.plugins).toContain('route-guard');
    });

    it('should have rules defined', () => {
      expect(legacyPlugin.configs.recommended.rules).toBeDefined();
      expect(typeof legacyPlugin.configs.recommended.rules).toBe('object');
    });
  });

  describe('Build Output Validation', () => {
    it('should be importable as ESM', () => {
      // This test passing means the ESM import worked
      expect(plugin).toBeDefined();
    });

    it('should have stable structure', () => {
      // Validate the structure doesn't change unexpectedly
      const keys = Object.keys(plugin).sort();
      expect(keys).toEqual(['configs', 'meta', 'rules']);
    });

    it('should export consistent objects', () => {
      // Ensure both exports share the same rules object
      expect(plugin.rules).toBe(legacyPlugin.rules);
    });
  });
});
