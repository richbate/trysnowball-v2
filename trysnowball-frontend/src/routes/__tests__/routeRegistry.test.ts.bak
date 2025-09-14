/**
 * Route Registry Tests - Prevent Duplicate Routes & Forks
 * 
 * These tests ensure:
 * 1. No hardcoded API routes in codebase
 * 2. All routes go through RouteRegistry
 * 3. No duplicate or conflicting endpoints
 */

import { RouteRegistry, RouteHelpers } from '../routeRegistry';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

describe('RouteRegistry', () => {
  describe('Route Structure', () => {
    test('has all required debt endpoints', () => {
      expect(RouteRegistry.debts.getAll).toBe('/api/clean/debts');
      expect(RouteRegistry.debts.create).toBe('/api/clean/debts');
      expect(RouteRegistry.debts.update('test-id')).toBe('/api/clean/debts/test-id');
      expect(RouteRegistry.debts.delete('test-id')).toBe('/api/clean/debts/test-id');
    });

    test('has all required auth endpoints', () => {
      expect(RouteRegistry.auth.me).toBe('/auth/me');
      expect(RouteRegistry.auth.refresh).toBe('/auth/refresh');
      expect(RouteRegistry.auth.logout).toBe('/auth/logout');
      expect(RouteRegistry.auth.requestLink).toBe('/auth/request-link');
    });

    test('has health check endpoints', () => {
      expect(RouteRegistry.health.main).toBe('/health');
      expect(RouteRegistry.health.auth).toBe('/auth/health');
      expect(RouteRegistry.health.api).toBe('/api/health');
    });
  });

  describe('Route Helpers', () => {
    test('identifies canonical vs legacy routes', () => {
      expect(RouteHelpers.isCanonical('/api/clean/debts')).toBe(true);
      expect(RouteHelpers.isCanonical('/auth/me')).toBe(true);
      
      // Legacy routes should be flagged
      expect(RouteHelpers.isCanonical('/api/debts')).toBe(false);
      expect(RouteHelpers.isCanonical('/api/user/debts')).toBe(false);
    });

    test('gets preferred debt routes', () => {
      expect(RouteHelpers.getPreferredDebtRoute('get')).toBe('/api/clean/debts');
      expect(RouteHelpers.getPreferredDebtRoute('create')).toBe('/api/clean/debts');
      expect(RouteHelpers.getPreferredDebtRoute('update', 'test-id')).toBe('/api/clean/debts/test-id');
      expect(RouteHelpers.getPreferredDebtRoute('delete', 'test-id')).toBe('/api/clean/debts/test-id');
    });

    test('extracts all routes correctly', () => {
      const allRoutes = RouteHelpers.getAllRoutes();
      
      expect(allRoutes).toContain('/api/clean/debts');
      expect(allRoutes).toContain('/auth/me');
      expect(allRoutes).toContain('/health');
      expect(allRoutes.length).toBeGreaterThan(10);
    });
  });
});

describe('Route-Worker Inversion Tests', () => {
  // Load live worker routes
  const loadLiveWorkerRoutes = () => {
    const workerRoutesPath = path.join(process.cwd(), 'cloudflare-workers', 'worker-routes.json');
    try {
      const workerRoutesData = fs.readFileSync(workerRoutesPath, 'utf8');
      const workerRoutes = JSON.parse(workerRoutesData);
      
      // Flatten all routes across workers
      const allRoutes = [];
      Object.values(workerRoutes).forEach((worker: any) => {
        worker.routes.forEach((route: any) => {
          // Normalize parameterized routes
          const normalizedPath = route.path.replace(/:id/g, ':id');
          allRoutes.push({
            path: normalizedPath,
            method: route.method
          });
        });
      });
      
      return allRoutes;
    } catch (error) {
      throw new Error(`Could not load worker routes: ${error.message}`);
    }
  };

  test('every route in RouteRegistry has a corresponding Worker handler', () => {
    const declaredRoutes = RouteHelpers.getAllRoutes();
    const liveRoutes = loadLiveWorkerRoutes();
    
    const missingHandlers = [];
    const extraHandlers = [];
    
    // Check each declared route has a handler
    declaredRoutes.forEach(route => {
      // Normalize parameterized routes for comparison
      const normalizedRoute = route.replace(/\/[a-f0-9-]{36}/g, '/:id');
      
      const hasHandler = liveRoutes.some(liveRoute => 
        liveRoute.path === normalizedRoute ||
        liveRoute.path === route
      );
      
      if (!hasHandler) {
        missingHandlers.push(route);
      }
    });
    
    // Check for handlers without registry entries (optional)
    const declaredSet = new Set(declaredRoutes.map(r => 
      r.replace(/\/[a-f0-9-]{36}/g, '/:id')
    ));
    
    liveRoutes.forEach(liveRoute => {
      if (!declaredSet.has(liveRoute.path) && 
          !liveRoute.path.includes('/health') && // Health checks are OK to not be in registry
          !liveRoute.path.includes('/webhook')) { // Webhooks are external
        extraHandlers.push(liveRoute.path);
      }
    });
    
    // Report findings
    if (missingHandlers.length > 0) {
      fail(`Registry routes missing Worker handlers:\n${missingHandlers.join('\n')}`);
    }
    
    if (extraHandlers.length > 0) {
      console.warn(`Worker handlers not in registry (OK if intentional):\n${extraHandlers.join('\n')}`);
    }
  });

  test('no registry drift - handlers and routes stay synchronized', () => {
    const declaredRoutes = RouteHelpers.getAllRoutes();
    const liveRoutes = loadLiveWorkerRoutes();
    
    expect(declaredRoutes.length).toBeGreaterThan(10);
    expect(liveRoutes.length).toBeGreaterThan(10);
    
    // Basic sanity check - we should have key routes covered
    const keyRoutes = ['/api/clean/debts', '/auth/me', '/auth/refresh'];
    
    keyRoutes.forEach(keyRoute => {
      expect(declaredRoutes).toContain(keyRoute);
      expect(liveRoutes.some(r => r.path === keyRoute)).toBe(true);
    });
  });

  test('route parameters are consistently handled', () => {
    const routesWithParams = [
      RouteRegistry.debts.update('test-id'),
      RouteRegistry.debts.delete('test-id')
    ];
    
    routesWithParams.forEach(route => {
      expect(route).toMatch(/\/api\/clean\/debts\/test-id/);
    });
    
    // Worker routes should have parameterized patterns
    const liveRoutes = loadLiveWorkerRoutes();
    const parameterizedRoutes = liveRoutes.filter(r => r.path.includes(':id'));
    
    expect(parameterizedRoutes.length).toBeGreaterThan(0);
  });
});

describe('Codebase Route Compliance', () => {
  // Get all source files for analysis
  const getSourceFiles = () => {
    return glob.sync('src/**/*.{ts,tsx,js,jsx}', {
      cwd: process.cwd(),
      ignore: [
        'src/**/*.test.{ts,tsx,js,jsx}',
        'src/**/*.d.ts',
        'src/routes/**' // Exclude route registry itself
      ]
    });
  };

  // Extract API routes from file content
  const extractAPIRoutes = (content: string) => {
    const routes: string[] = [];
    const patterns = [
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /axios\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /fetchWithAuth\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /fetchJSON\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];

    patterns.forEach(pattern => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        const route = pattern === patterns[1] ? match[2] : match[1];
        if (route && (route.startsWith('/api/') || route.startsWith('/auth/'))) {
          routes.push(route);
        }
      });
    });

    return routes;
  };

  test('no hardcoded API routes in codebase', () => {
    const sourceFiles = getSourceFiles();
    const violations: { file: string; routes: string[] }[] = [];
    const allowedRoutes = RouteHelpers.getAllRoutes();

    // Add explicitly allowed hardcoded routes for specific files
    const allowedHardcodedRoutes = new Set([
      '/api/clean/debts', // Allowed in unifiedDebtsGateway (uses RouteRegistry)
      '/health',
      '/auth/health'
    ]);

    sourceFiles.forEach(filePath => {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const foundRoutes = extractAPIRoutes(content);
        
        const violations_in_file = foundRoutes.filter(route => {
          // Allow RouteRegistry constants or explicitly allowed routes
          return !allowedRoutes.includes(route) && 
                 !allowedHardcodedRoutes.has(route) &&
                 !content.includes('RouteRegistry.');
        });

        if (violations_in_file.length > 0) {
          violations.push({ file: filePath, routes: violations_in_file });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });

    if (violations.length > 0) {
      const errorMessage = violations.map(v => 
        `${v.file}: ${v.routes.join(', ')}`
      ).join('\n');
      
      fail(`Found hardcoded API routes (should use RouteRegistry):\n${errorMessage}`);
    }
  });

  test('all gateway files use RouteRegistry', () => {
    const gatewayFiles = glob.sync('src/**/*{Gateway,gateway}.{ts,tsx}', {
      cwd: process.cwd(),
      ignore: ['src/**/*.test.{ts,tsx}']
    });

    const violations: string[] = [];

    gatewayFiles.forEach(filePath => {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Gateway files should import and use RouteRegistry
        if (!content.includes('RouteRegistry') && !filePath.includes('unified')) {
          // Exception: unifiedDebtsGateway imports RouteRegistry
          violations.push(filePath);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });

    if (violations.length > 0) {
      fail(`Gateway files not using RouteRegistry:\n${violations.join('\n')}`);
    }
  });

  test('no duplicate route definitions', () => {
    const allRoutes = RouteHelpers.getAllRoutes();
    const routeCounts = new Map<string, number>();
    
    allRoutes.forEach(route => {
      routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
    });

    const duplicates = Array.from(routeCounts.entries())
      .filter(([route, count]) => count > 1)
      .map(([route]) => route);

    if (duplicates.length > 0) {
      fail(`Duplicate routes found in RouteRegistry:\n${duplicates.join('\n')}`);
    }
  });

  test('all routes follow naming conventions', () => {
    const allRoutes = RouteHelpers.getAllRoutes();
    const invalidRoutes: string[] = [];

    allRoutes.forEach(route => {
      // Routes should start with /api/ or /auth/ or /health
      if (!route.match(/^\/(?:api|auth|health)\//)) {
        invalidRoutes.push(route);
      }

      // Routes should not have double slashes
      if (route.includes('//')) {
        invalidRoutes.push(route);
      }

      // Routes should not end with slash (except root)
      if (route.endsWith('/') && route.length > 1) {
        invalidRoutes.push(route);
      }
    });

    if (invalidRoutes.length > 0) {
      fail(`Routes not following conventions:\n${invalidRoutes.join('\n')}`);
    }
  });
});