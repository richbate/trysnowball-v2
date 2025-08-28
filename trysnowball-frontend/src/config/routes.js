// Central routing configuration with metadata
export const routeConfig = {
  // Core Navigation - Main user journey
  '/': {
    name: 'Home',
    type: 'core',
    tags: ['landing', 'education'],
    requiresDebt: false,
    stepNumber: 0,
    description: 'Learn about debt freedom strategies'
  },
  '/debts': {
    name: 'Track Debts',
    type: 'core', 
    tags: ['management', 'crud', 'data-entry'],
    requiresDebt: false,
    stepNumber: 1,
    description: 'Add and update your debts'
  },
  '/my-plan': {
    name: 'My Plan',
    type: 'core',
    tags: ['dashboard', 'visualization', 'tracking'],
    requiresDebt: true,
    stepNumber: 2,
    description: 'View your payoff strategy and timeline'
  },
  '/plan': {
    name: 'Scenarios',
    type: 'core',
    tags: ['dashboard', 'visualization', 'tracking', 'modeling', 'scenarios', 'planning'],
    requiresDebt: true,
    stepNumber: 3,
    description: 'Try different payoff strategies'
  },
  '/what-if': {
    name: 'What-If',
    type: 'core',
    tags: ['modeling', 'scenarios', 'planning'],
    requiresDebt: true,
    stepNumber: 3,
    description: 'Try different payoff strategies',
    deprecated: true, // Redirects to /plan?scenario=true
    hidden: true
  },
  '/ai-coach': {
    name: 'AI Coach',
    type: 'core',
    tags: ['ai', 'coaching', 'export'],
    requiresDebt: true,
    stepNumber: 4,
    description: 'Get personalized coaching with AI',
    gated: true // Requires pro/email
  },
  '/coach': {
    name: 'AI Coach',
    type: 'premium',
    tags: ['ai', 'coaching', 'chat', 'gpt'],
    requiresDebt: false,
    requiresAuth: true,
    requiresPro: true,
    description: 'Interactive AI debt coaching with ChatGPT',
    hidden: false
  },
  '/ai-report': {
    name: 'AI Report',
    type: 'premium',
    tags: ['ai', 'analysis', 'export'],
    requiresDebt: false,
    requiresAuth: true,
    description: 'Comprehensive debt analysis report',
    hidden: false
  },

  // Tools & Support
  '/money-makeover': {
    name: 'Quick Win Plan',
    type: 'tool',
    tags: ['strategy', '30-day', 'quick-wins'],
    requiresDebt: false,
    description: 'Get wins in your first month'
  },
  '/future-plans': {
    name: 'Future Plans',
    type: 'tool',
    tags: ['roadmap', 'voting', 'community'],
    requiresDebt: false,
    description: 'Long-term goals & projections',
    hidden: true // Hide until real submissions
  },

  // Resources
  '/library': {
    name: 'Learn',
    type: 'resource',
    tags: ['articles', 'tools', 'books'],
    requiresDebt: false,
    description: 'Guides and strategies for debt freedom'
  },
  '/article/:slug': {
    name: 'Article',
    type: 'resource',
    tags: ['content', 'reading'],
    requiresDebt: false,
    description: 'Individual article content'
  },

  // Account
  '/login': {
    name: 'Login',
    type: 'account',
    tags: ['auth', 'authentication'],
    requiresDebt: false,
    description: 'Sign in to your account'
  },
  '/profile': {
    name: 'My Profile',
    type: 'account', 
    tags: ['account', 'settings', 'data'],
    requiresDebt: false,
    description: 'Name, coach & preferences'
  }
};

// Helper functions
export const getCoreSteps = () => {
  return Object.entries(routeConfig)
    .filter(([_, config]) => config.type === 'core' && config.stepNumber !== undefined)
    .sort(([_, a], [__, b]) => a.stepNumber - b.stepNumber)
    .map(([route, config]) => ({ route, ...config }));
};

export const getRouteConfig = (path) => {
  return routeConfig[path] || null;
};

export const getFilteredRoutes = (filters = {}) => {
  return Object.entries(routeConfig).filter(([route, config]) => {
    if (filters.type && config.type !== filters.type) return false;
    if (filters.hidden === false && config.hidden) return false;
    if (filters.requiresDebt !== undefined && config.requiresDebt !== filters.requiresDebt) return false;
    if (filters.tags && !filters.tags.some(tag => config.tags.includes(tag))) return false;
    return true;
  });
};

export const getCurrentStep = (currentPath) => {
  const config = getRouteConfig(currentPath);
  return config?.stepNumber || 0;
};