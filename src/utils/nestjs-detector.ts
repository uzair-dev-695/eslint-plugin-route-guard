/**
 * NestJS Decorator Detection and Route Extraction
 * Parses TypeScript decorators to extract NestJS route definitions
 */

import { TSESTree } from '@typescript-eslint/utils';

export interface NestJSRoute {
  method: string;
  path: string;
  controllerPrefix: string;
  node: TSESTree.Node;
}

const HTTP_METHOD_DECORATORS = new Set([
  'Get',
  'Post',
  'Put',
  'Delete',
  'Patch',
  'Options',
  'Head',
  'All',
]);

/**
 * Extract string literal from decorator argument
 */
function extractDecoratorArgument(decorator: TSESTree.Decorator): string | null {
  if (decorator.expression.type !== 'CallExpression') {
    return null;
  }

  const callExpr = decorator.expression;
  if (callExpr.arguments.length === 0) {
    return '';
  }

  const firstArg = callExpr.arguments[0];
  if (!firstArg) {
    return null;
  }
  
  if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
    return firstArg.value;
  }

  if (firstArg.type === 'TemplateLiteral') {
    if (firstArg.expressions.length > 0) {
      return null;
    }
    if (firstArg.quasis.length === 1) {
      return firstArg.quasis[0]?.value.cooked || '';
    }
  }

  return null;
}

/**
 * Get decorator name from decorator expression
 */
function getDecoratorName(decorator: TSESTree.Decorator): string | null {
  if (decorator.expression.type === 'CallExpression') {
    const callee = decorator.expression.callee;
    if (callee.type === 'Identifier') {
      return callee.name;
    }
  }
  return null;
}

/**
 * Extract controller prefix from @Controller decorator
 */
export function extractControllerPrefix(classNode: TSESTree.ClassDeclaration): string | null {
  if (!classNode.decorators || classNode.decorators.length === 0) {
    return null;
  }

  for (const decorator of classNode.decorators) {
    const name = getDecoratorName(decorator);
    if (name === 'Controller') {
      const prefix = extractDecoratorArgument(decorator);
      return prefix !== null ? prefix : '';
    }
  }

  return null;
}

/**
 * Extract routes from class method decorators
 */
export function extractMethodRoutes(
  classNode: TSESTree.ClassDeclaration,
  controllerPrefix: string
): NestJSRoute[] {
  const routes: NestJSRoute[] = [];

  if (!classNode.body || classNode.body.type !== 'ClassBody') {
    return routes;
  }

  for (const member of classNode.body.body) {
    if (member.type !== 'MethodDefinition') {
      continue;
    }

    if (!member.decorators || member.decorators.length === 0) {
      continue;
    }

    for (const decorator of member.decorators) {
      const decoratorName = getDecoratorName(decorator);
      if (!decoratorName || !HTTP_METHOD_DECORATORS.has(decoratorName)) {
        continue;
      }

      const path = extractDecoratorArgument(decorator);
      if (path === null) {
        continue;
      }

      routes.push({
        method: decoratorName.toUpperCase(),
        path,
        controllerPrefix,
        node: member,
      });
    }
  }

  return routes;
}

/**
 * Check if node is a NestJS controller class
 */
export function isNestJSController(classNode: TSESTree.ClassDeclaration): boolean {
  if (!classNode.decorators || classNode.decorators.length === 0) {
    return false;
  }

  return classNode.decorators.some((decorator) => {
    const name = getDecoratorName(decorator);
    return name === 'Controller';
  });
}
