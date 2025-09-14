/**
 * Canonical Route Registry - Single Source of Truth
 * 
 * ALL API routes must be defined here. No hardcoded strings in components!
 * This eliminates duplicate routes and provides centralized endpoint management.
 */

export const RouteRegistry = {
  /**
   * Debt Management API - Primary debt operations
   * Uses clean UK format (no cents, no normalization)
   */
  debts: {
    // Main CRUD operations
    getAll: '/api/clean/debts',
    create: '/api/clean/debts', 
    update: (id: string) => `/api/clean/debts/${id}`,
    delete: (id: string) => `/api/clean/debts/${id}`,
    
    // Legacy support (DEPRECATED - use clean endpoints)
    legacyGetAll: '/api/debts',
    legacyCreate: '/api/debts',
    legacyUpdate: (id: string) => `/api/debts/${id}`,
    legacyDelete: (id: string) => `/api/debts/${id}`
  },

  /**
   * Authentication & User Management
   */
  auth: {
    // User session management
    me: '/auth/me',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    
    // Magic link authentication
    requestLink: '/auth/request-link',
    verify: '/auth/verify',
    
    // Health and status
    health: '/auth/health',
    stats: '/auth/stats',
    
    // User profile endpoints
    user: '/auth/user',
    profile: '/auth/profile',
    
    // Billing integration (auth worker hosted)
    planStatus: '/auth/api/me/plan'
  },

  /**
   * Billing & Subscription Management
   */
  billing: {
    // Stripe integration
    createCheckoutSession: '/api/checkout/session',
    createPortalSession: '/api/create-portal-session',
    webhook: '/api/stripe/webhook',
    
    // User entitlements
    entitlement: '/api/account/entitlement',
    me: '/api/me',
    plan: '/api/me/plan',
    
    // Subscription management
    subscribe: '/api/subscribe',
    confirmSubscription: '/api/confirm-subscription',
    resetPro: '/api/reset-pro'
  },

  /**
   * User Settings & Preferences
   */
  settings: {
    get: '/api/user_settings',
    update: '/api/user_settings'
  },

  /**
   * AI & Coaching
   */
  ai: {
    chat: '/api/ai/chat',
    coach: '/api/ai/coach'
  },

  /**
   * Health & Monitoring
   */
  health: {
    main: '/health',
    auth: '/auth/health',
    api: '/api/health'
  },

  /**
   * Legacy User Data (DEPRECATED)
   * These should be migrated to new patterns
   */
  legacy: {
    userDebts: '/api/user/debts',
    userSnapshots: '/api/user/snapshots', 
    userSnowflakes: '/api/user/snowflakes',
    userMigrate: '/api/user/migrate'
  }
} as const;

/**
 * Ergonomic route path specification
 * Enables getRoute("debts.create") syntax with full IntelliSense
 */
type RoutePath = 
  // Debts
  | 'debts.getAll' | 'debts.create' | 'debts.update' | 'debts.delete'
  | 'debts.legacyGetAll' | 'debts.legacyCreate' | 'debts.legacyUpdate' | 'debts.legacyDelete'
  // Auth
  | 'auth.me' | 'auth.refresh' | 'auth.logout' | 'auth.requestLink' | 'auth.verify'
  | 'auth.health' | 'auth.stats' | 'auth.user' | 'auth.profile' | 'auth.planStatus'
  // Billing
  | 'billing.createCheckoutSession' | 'billing.createPortalSession' | 'billing.webhook'
  | 'billing.entitlement' | 'billing.me' | 'billing.plan' | 'billing.subscribe'
  | 'billing.confirmSubscription' | 'billing.resetPro'
  // Settings
  | 'settings.get' | 'settings.update'
  // AI
  | 'ai.chat' | 'ai.coach'
  // Health
  | 'health.main' | 'health.auth' | 'health.api'
  // Legacy
  | 'legacy.userDebts' | 'legacy.userSnapshots' | 'legacy.userSnowflakes' | 'legacy.userMigrate';

/**
 * Route validation and utility helpers
 */
export const RouteHelpers = {
  /**
   * Ergonomic route getter with IntelliSense support
   * Usage: getRoute("debts.create") or getRoute("debts.update", "debt-123")
   */
  getRoute: (path: RoutePath, ...params: string[]): string => {
    const [domain, operation] = path.split('.');
    const routeDomain = RouteRegistry[domain as keyof typeof RouteRegistry];
    
    if (!routeDomain) {
      throw new Error(`Unknown route domain: ${domain}. Available: ${Object.keys(RouteRegistry).join(', ')}`);
    }
    
    const route = routeDomain[operation as keyof typeof routeDomain];
    
    if (typeof route === 'string') {
      return route;
    } else if (typeof route === 'function') {
      if (params.length === 0) {
        throw new Error(`Route ${path} requires parameters. Usage: getRoute("${path}", "id")`);
      }
      return route(...params);
    } else {
      throw new Error(`Unknown route operation: ${path}. Check RouteRegistry for available routes.`);
    }
  },

  /**
   * Check if a route is canonical (not legacy)
   */
  isCanonical: (route: string): boolean => {
    return !route.includes('/api/debts') && // Legacy debts API
           !route.includes('/api/user/');    // Legacy user API
  },

  /**
   * Get preferred route for debt operations (legacy method - use getRoute instead)
   * @deprecated Use getRoute("debts.operation", id) instead
   */
  getPreferredDebtRoute: (operation: 'get' | 'create' | 'update' | 'delete', id?: string) => {
    console.warn('getPreferredDebtRoute is deprecated. Use getRoute("debts.operation", id) instead.');
    
    switch (operation) {
      case 'get': return RouteHelpers.getRoute('debts.getAll');
      case 'create': return RouteHelpers.getRoute('debts.create');
      case 'update': return RouteHelpers.getRoute('debts.update', id!);
      case 'delete': return RouteHelpers.getRoute('debts.delete', id!);
      default: throw new Error(`Unknown debt operation: ${operation}`);
    }
  },

  /**
   * Extract all routes as flat array for testing
   */
  getAllRoutes: (): string[] => {
    const routes: string[] = [];
    
    const extractRoutes = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.startsWith('/')) {
          routes.push(value);
        } else if (typeof value === 'function') {
          // Skip function routes (they need parameters)
        } else if (typeof value === 'object') {
          extractRoutes(value, `${prefix}${key}.`);
        }
      }
    };
    
    extractRoutes(RouteRegistry);
    return [...new Set(routes)]; // Remove duplicates
  },

  /**
   * Validate route path syntax
   */
  isValidRoutePath: (path: string): path is RoutePath => {
    try {
      RouteHelpers.getRoute(path as RoutePath);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get all available route paths for autocomplete
   */
  getAllRoutePaths: (): RoutePath[] => {
    return [
      // Debts
      'debts.getAll', 'debts.create', 'debts.update', 'debts.delete',
      // Auth  
      'auth.me', 'auth.refresh', 'auth.logout', 'auth.requestLink', 'auth.verify',
      'auth.health', 'auth.stats', 'auth.user', 'auth.profile', 'auth.planStatus',
      // Billing
      'billing.createCheckoutSession', 'billing.createPortalSession', 'billing.webhook',
      'billing.entitlement', 'billing.me', 'billing.plan', 'billing.subscribe',
      'billing.confirmSubscription', 'billing.resetPro',
      // Settings
      'settings.get', 'settings.update',
      // AI
      'ai.chat', 'ai.coach',
      // Health
      'health.main', 'health.auth', 'health.api',
      // Legacy
      'legacy.userDebts', 'legacy.userSnapshots', 'legacy.userSnowflakes', 'legacy.userMigrate'
    ];
  }
};

/**
 * Type definitions for route parameters
 */
export type DebtOperation = 'get' | 'create' | 'update' | 'delete';
export type RouteFunction = (id: string) => string;

/**
 * Usage examples:
 * 
 * ❌ BEFORE (hardcoded strings):
 * fetch('/api/debts')
 * fetch('/api/clean/debts')
 * 
 * ✅ AFTER (canonical registry):
 * fetch(RouteRegistry.debts.getAll)
 * fetch(RouteRegistry.debts.update('debt-123'))
 */