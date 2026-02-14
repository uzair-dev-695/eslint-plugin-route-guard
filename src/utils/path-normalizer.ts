import { pathNormalizationCache } from './performance-cache';

export type NormalizationLevel = 0 | 1 | 2;

export enum ConflictType {
  NONE = 'none',
  EXACT_DUPLICATE = 'exact',
  PARAM_NAME_CONFLICT = 'param-name',
  STATIC_VS_DYNAMIC = 'static-dynamic',
  DIFFERENT_CONSTRAINTS = 'different-constraints',
  WILDCARD_CONFLICT = 'wildcard',
}

export interface SegmentInfo {
  raw: string;
  type: 'static' | 'param' | 'optional-param' | 'wildcard' | 'regex-param';
  normalized: string;
  constraint?: string;
  paramName?: string;
}

export interface PathNormalizationOptions {
  level?: NormalizationLevel;
  preserveConstraints?: boolean;
}

export interface ConflictInfo {
  type: ConflictType;
  message: string;
  segment1?: SegmentInfo;
  segment2?: SegmentInfo;
}

export function parsePathSegment(segment: string): SegmentInfo {
  if (!segment) {
    return { raw: segment, type: 'static', normalized: segment };
  }

  if (segment === '*' || segment === '**') {
    return { raw: segment, type: 'wildcard', normalized: '*' };
  }

  if (segment.startsWith(':')) {
    const optional = segment.endsWith('?');
    const baseSegment = optional ? segment.slice(0, -1) : segment;
    
    const wildcardMatch = baseSegment.match(/^:([^(]+)\*$/);
    if (wildcardMatch) {
      const paramName = wildcardMatch[1];
      return {
        raw: segment,
        type: 'wildcard',
        normalized: '*',
        paramName,
      };
    }
    
    const regexMatch = baseSegment.match(/^:([^(]+)(\(.+\))$/);
    if (regexMatch) {
      const paramName = regexMatch[1] || 'param';
      const constraint = regexMatch[2];

      return {
        raw: segment,
        type: 'regex-param',
        normalized: ':param',
        paramName,
        constraint,
      };
    }

    const fastifyMultiParam = baseSegment.match(/^:([^-:]+)-:(.+)$/);
    if (fastifyMultiParam) {
      return {
        raw: segment,
        type: 'param',
        normalized: ':param-:param',
        paramName: `${fastifyMultiParam[1]}-${fastifyMultiParam[2]}`,
      };
    }

    return {
      raw: segment,
      type: optional ? 'optional-param' : 'param',
      normalized: optional ? ':param?' : ':param',
      paramName: baseSegment.slice(1),
    };
  }

  return { raw: segment, type: 'static', normalized: segment };
}

export function parsePathSegments(path: string): SegmentInfo[] {
  if (!path || path === '/') {
    return [];
  }

  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const segments = normalized.split('/').filter(Boolean);
  
  return segments.map(parsePathSegment);
}

export function normalizePathWithLevel(
  path: string,
  level: NormalizationLevel = 1,
  preserveConstraints = false
): string {
  if (!path) {
    return '/';
  }

  if (level === 0) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  const cacheKey = `${path}:${level}:${preserveConstraints}`;
  const cached = pathNormalizationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const segments = parsePathSegments(path);
  const normalizedSegments = segments.map((seg) => {
    if (level === 1) {
      return seg.normalized;
    }

    if (level === 2) {
      if (seg.type === 'regex-param' && !preserveConstraints) {
        return ':param';
      }
      return seg.normalized;
    }

    return seg.raw;
  });

  const result = normalizedSegments.length > 0
    ? `/${normalizedSegments.join('/')}`
    : '/';

  pathNormalizationCache.set(cacheKey, result);
  return result;
}

export function detectPathConflict(
  path1: string,
  path2: string,
  level: NormalizationLevel = 1
): ConflictInfo {
  if (path1 === path2) {
    return {
      type: ConflictType.EXACT_DUPLICATE,
      message: 'Exact duplicate route paths',
    };
  }

  const segments1 = parsePathSegments(path1);
  const segments2 = parsePathSegments(path2);

  if (segments1.length !== segments2.length) {
    return { type: ConflictType.NONE, message: 'Different path lengths' };
  }

  for (let i = 0; i < segments1.length; i++) {
    const seg1 = segments1[i];
    const seg2 = segments2[i];

    if (!seg1 || !seg2) continue;

    if (seg1.type === 'wildcard' || seg2.type === 'wildcard') {
      if (seg1.type !== seg2.type) {
        return {
          type: ConflictType.WILDCARD_CONFLICT,
          message: 'Wildcard conflicts with specific path segment',
          segment1: seg1,
          segment2: seg2,
        };
      }
    }

    if (
      (seg1.type === 'static' && seg2.type !== 'static') ||
      (seg1.type !== 'static' && seg2.type === 'static')
    ) {
      return {
        type: ConflictType.STATIC_VS_DYNAMIC,
        message: 'Static path segment conflicts with dynamic parameter',
        segment1: seg1,
        segment2: seg2,
      };
    }

    if (
      seg1.type === 'regex-param' &&
      seg2.type === 'regex-param' &&
      seg1.constraint &&
      seg2.constraint &&
      seg1.constraint !== seg2.constraint
    ) {
      return {
        type: ConflictType.DIFFERENT_CONSTRAINTS,
        message: 'Parameters have different regex constraints',
        segment1: seg1,
        segment2: seg2,
      };
    }
  }

  const normalized1 = normalizePathWithLevel(path1, level);
  const normalized2 = normalizePathWithLevel(path2, level);

  if (normalized1 === normalized2 && level > 0) {
    return {
      type: ConflictType.PARAM_NAME_CONFLICT,
      message: 'Routes have different parameter names but same structure',
    };
  }

  return { type: ConflictType.NONE, message: 'No conflict detected' };
}

export function isStaticSegment(segment: string): boolean {
  const parsed = parsePathSegment(segment);
  return parsed.type === 'static';
}

export function isParamSegment(segment: string): boolean {
  const parsed = parsePathSegment(segment);
  return parsed.type === 'param' || parsed.type === 'optional-param' || parsed.type === 'regex-param';
}

export function isWildcardSegment(segment: string): boolean {
  const parsed = parsePathSegment(segment);
  return parsed.type === 'wildcard';
}

export function extractParamConstraint(segment: string): RegExp | null {
  const parsed = parsePathSegment(segment);
  
  if (parsed.type !== 'regex-param' || !parsed.constraint) {
    return null;
  }

  try {
    const pattern = parsed.constraint.slice(1, -1);
    return new RegExp(pattern);
  } catch {
    return null;
  }
}

export function clearNormalizationCache(): void {
  pathNormalizationCache.clear();
}

export function getNormalizationCacheSize(): number {
  return pathNormalizationCache.getStats().size;
}
