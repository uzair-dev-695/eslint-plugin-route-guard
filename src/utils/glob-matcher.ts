/**
 * Simple glob pattern matching utility
 * Supports basic patterns: *, **, ?, [abc], {a,b,c}
 */

/**
 * Convert glob pattern to RegExp
 */
export function globToRegex(pattern: string): RegExp {
  let regexStr = '^';
  let inGroup = false;
  
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    
    switch (char) {
      case '/':
        regexStr += '\\/';
        break;
      case '*':
        if (pattern[i + 1] === '*') {
          regexStr += '.*';
          i++;
        } else {
          regexStr += '[^/]*';
        }
        break;
      case '?':
        regexStr += '[^/]';
        break;
      case '[':
        regexStr += '[';
        break;
      case ']':
        regexStr += ']';
        break;
      case '{':
        regexStr += '(?:';
        inGroup = true;
        break;
      case '}':
        regexStr += ')';
        inGroup = false;
        break;
      case ',':
        if (inGroup) {
          regexStr += '|';
        } else {
          regexStr += ',';
        }
        break;
      case '.':
      case '(':
      case ')':
      case '+':
      case '|':
      case '^':
      case '$':
      case '\\':
        regexStr += '\\' + char;
        break;
      default:
        regexStr += char;
    }
  }
  
  regexStr += '$';
  return new RegExp(regexStr, 'i');
}

/**
 * Check if path matches any of the glob patterns
 */
export function matchesGlobPatterns(path: string, patterns: string[]): boolean {
  if (patterns.length === 0) {
    return false;
  }
  
  const normalizedPath = path.replace(/\\/g, '/');
  
  return patterns.some(pattern => {
    const regex = globToRegex(pattern);
    return regex.test(normalizedPath);
  });
}
