/**
 * Path normalization utilities for router prefix resolution
 */

export function joinPaths(...parts: string[]): string {
  const normalized = parts
    .map(p => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/');

  return normalized ? `/${normalized}` : '/';
}

export function normalizePath(path: string): string {
  if (!path) return '/';
  
  const hasTrailingSlash = path.endsWith('/') && path.length > 1;
  let normalized = path.replace(/\/+/g, '/');
  
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  
  if (hasTrailingSlash && !normalized.endsWith('/')) {
    normalized += '/';
  }
  
  return normalized;
}

export function isRootPath(path: string): boolean {
  return !path || path === '/' || path === '';
}

export function getPathSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}
