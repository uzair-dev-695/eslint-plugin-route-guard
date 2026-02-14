interface RouteDefinition {
  method: string;
  path: string;
}

interface GeneratedFile {
  filename: string;
  content: string;
  routes: RouteDefinition[];
}

export function generateExpressRoutes(count: number): RouteDefinition[] {
  const methods = ['get', 'post', 'put', 'delete', 'patch'];
  const resources = ['users', 'posts', 'comments', 'products', 'orders', 'categories', 'tags', 'reviews'];
  const routes: RouteDefinition[] = [];
  
  for (let i = 0; i < count; i++) {
    const method = methods[i % methods.length];
    const resource = resources[i % resources.length];
    const pathVariant = i % 4;
    
    let path: string;
    if (pathVariant === 0) {
      path = `/${resource}`;
    } else if (pathVariant === 1) {
      path = `/${resource}/:id`;
    } else if (pathVariant === 2) {
      path = `/${resource}/:id/${resource}Details`;
    } else {
      path = `/${resource}/:id/nested/:nestedId`;
    }
    
    routes.push({ method, path: `${path}_${i}` });
  }
  
  return routes;
}

export function generateExpressFile(filename: string, routes: RouteDefinition[]): GeneratedFile {
  const imports = `import express from 'express';\nconst router = express.Router();\n\n`;
  
  const routeCode = routes.map(r => 
    `router.${r.method}('${r.path}', (req, res) => { res.json({}); });`
  ).join('\n');
  
  const exports = `\nexport default router;`;
  
  return {
    filename,
    content: imports + routeCode + exports,
    routes,
  };
}

export function generateFastifyFile(filename: string, routes: RouteDefinition[]): GeneratedFile {
  const imports = `import type { FastifyInstance } from 'fastify';\n\nexport default async function routes(fastify: FastifyInstance) {\n`;
  
  const routeCode = routes.map(r => 
    `  fastify.${r.method}('${r.path}', async (request, reply) => { return {}; });`
  ).join('\n');
  
  const closing = `\n}`;
  
  return {
    filename,
    content: imports + routeCode + closing,
    routes,
  };
}

export function generateNestJSFile(filename: string, routes: RouteDefinition[], controllerPrefix: string): GeneratedFile {
  const imports = `import { Controller, Get, Post, Put, Delete, Patch } from '@nestjs/common';\n\n@Controller('${controllerPrefix}')\nexport class TestController {\n`;
  
  const routeCode = routes.map((r, i) => {
    const decorator = r.method.charAt(0).toUpperCase() + r.method.slice(1);
    const methodPath = r.path.replace(`/${controllerPrefix}`, '').replace(/^\//, '');
    return `  @${decorator}('${methodPath}')\n  method${i}() { return {}; }\n`;
  }).join('\n');
  
  const closing = `}`;
  
  return {
    filename,
    content: imports + routeCode + closing,
    routes,
  };
}

export function generateLargeProject(config: {
  fileCount: number;
  routesPerFile: number;
  framework: 'express' | 'fastify' | 'nestjs';
}): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  
  for (let i = 0; i < config.fileCount; i++) {
    const routes = generateExpressRoutes(config.routesPerFile);
    const filename = `routes${i + 1}.ts`;
    
    let file: GeneratedFile;
    if (config.framework === 'express') {
      file = generateExpressFile(filename, routes);
    } else if (config.framework === 'fastify') {
      file = generateFastifyFile(filename, routes);
    } else {
      file = generateNestJSFile(filename, routes, `controller${i + 1}`);
    }
    
    files.push(file);
  }
  
  return files;
}

export function generateMixedProject(small: number, medium: number, large: number): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  
  for (let i = 0; i < small; i++) {
    const routes = generateExpressRoutes(5);
    files.push(generateExpressFile(`small${i + 1}.ts`, routes));
  }
  
  for (let i = 0; i < medium; i++) {
    const routes = generateExpressRoutes(20);
    files.push(generateFastifyFile(`medium${i + 1}.ts`, routes));
  }
  
  for (let i = 0; i < large; i++) {
    const routes = generateExpressRoutes(100);
    files.push(generateNestJSFile(`large${i + 1}.ts`, routes, `largeController${i + 1}`));
  }
  
  return files;
}

export function getTotalRoutes(files: GeneratedFile[]): number {
  return files.reduce((sum, file) => sum + file.routes.length, 0);
}
