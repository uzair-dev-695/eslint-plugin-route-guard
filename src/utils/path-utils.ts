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

export function isStaticSegment(segment: string): boolean {
  return !segment.startsWith(':') && segment !== '*' && segment !== '**';
}

export function isParamSegment(segment: string): boolean {
  return segment.startsWith(':');
}

export function isWildcardSegment(segment: string): boolean {
  return segment === '*' || segment === '**';
}

export function extractParamConstraint(segment: string): RegExp | null {
  if (!segment.startsWith(':')) {
    return null;
  }

  const match = segment.match(/^:[^(]+(\(.+\))$/);
  if (!match || !match[1]) {
    return null;
  }

  try {
    const pattern = match[1].slice(1, -1);
    return new RegExp(pattern);
  } catch {
    return null;
  }
}
