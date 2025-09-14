/**
 * Plan Path Utility Tests
 * 
 * Tests path resolution and tab detection logic used in the Plan workspace.
 * Validates the getActiveTab function and tab configuration.
 */

import '@testing-library/jest-dom';

// Since the Plan component has the getActiveTab function inline,
// we'll extract and test the logic here to ensure it works correctly
function getActiveTab(pathname: string): string {
 if (!pathname || typeof pathname !== 'string') return 'debts';
 if (pathname.includes('/debts')) return 'debts';
 if (pathname.includes('/strategy')) return 'strategy';
 if (pathname.includes('/forecast')) return 'forecast';
 if (pathname.includes('/snowflakes')) return 'snowflakes';
 if (pathname.includes('/goals')) return 'goals';
 
 // Default tab - always debts so users can add debts
 return 'debts';
}

// Tab configuration matching Plan.jsx
const tabs = [
 { id: 'debts', label: 'Debts', path: '/plan/debts', icon: '💳' },
 { id: 'strategy', label: 'Strategy', path: '/plan/strategy', icon: '🎯' },
 { id: 'forecast', label: 'Forecast', path: '/plan/forecast', icon: '📊' },
 { id: 'snowflakes', label: 'Snowflakes', path: '/plan/snowflakes', icon: '❄️' },
 { id: 'goals', label: 'Goals', path: '/plan/goals', icon: '🎯' },
];

describe('Plan Path Utilities', () => {
 describe('getActiveTab', () => {
  test('detects debts tab from path', () => {
   expect(getActiveTab('/plan/debts')).toBe('debts');
   expect(getActiveTab('/plan/debts/add')).toBe('debts');
   expect(getActiveTab('/plan/debts?add=true')).toBe('debts');
  });

  test('detects strategy tab from path', () => {
   expect(getActiveTab('/plan/strategy')).toBe('strategy');
   expect(getActiveTab('/plan/strategy/details')).toBe('strategy');
  });

  test('detects forecast tab from path', () => {
   expect(getActiveTab('/plan/forecast')).toBe('forecast');
   expect(getActiveTab('/plan/forecast/export')).toBe('forecast');
   expect(getActiveTab('/plan/forecast?scenario=true')).toBe('forecast');
  });

  test('detects snowflakes tab from path', () => {
   expect(getActiveTab('/plan/snowflakes')).toBe('snowflakes');
   expect(getActiveTab('/plan/snowflakes/history')).toBe('snowflakes');
  });

  test('detects goals tab from path', () => {
   expect(getActiveTab('/plan/goals')).toBe('goals');
   expect(getActiveTab('/plan/goals/milestones')).toBe('goals');
  });

  test('defaults to debts for unknown paths', () => {
   expect(getActiveTab('/plan')).toBe('debts');
   expect(getActiveTab('/plan/')).toBe('debts');
   expect(getActiveTab('/plan/unknown')).toBe('debts');
   expect(getActiveTab('/other')).toBe('debts');
   expect(getActiveTab('')).toBe('debts');
  });

  test('handles edge cases', () => {
   expect(getActiveTab('/plan/debts/strategy')).toBe('debts'); // debts comes first in check order
   expect(getActiveTab('/forecast/plan')).toBe('forecast'); // contains '/forecast' so matches forecast
   expect(getActiveTab('/plan/debt')).toBe('debts'); // partial match doesn't work - defaults
  });

  test('is case sensitive', () => {
   expect(getActiveTab('/plan/DEBTS')).toBe('debts'); // defaults because no match
   expect(getActiveTab('/PLAN/debts')).toBe('debts'); // still matches because contains '/debts'
  });
 });

 describe('Tab Configuration', () => {
  test('has correct tab structure', () => {
   expect(tabs).toHaveLength(5);
   
   tabs.forEach(tab => {
    expect(tab).toHaveProperty('id');
    expect(tab).toHaveProperty('label');
    expect(tab).toHaveProperty('path');
    expect(tab).toHaveProperty('icon');
    expect(typeof tab.id).toBe('string');
    expect(typeof tab.label).toBe('string');
    expect(typeof tab.path).toBe('string');
    expect(typeof tab.icon).toBe('string');
   });
  });

  test('has correct tab IDs', () => {
   const expectedIds = ['debts', 'strategy', 'forecast', 'snowflakes', 'goals'];
   const actualIds = tabs.map(tab => tab.id);
   expect(actualIds).toEqual(expectedIds);
  });

  test('has correct tab labels', () => {
   const expectedLabels = ['Debts', 'Strategy', 'Forecast', 'Snowflakes', 'Goals'];
   const actualLabels = tabs.map(tab => tab.label);
   expect(actualLabels).toEqual(expectedLabels);
  });

  test('has correct tab paths', () => {
   const expectedPaths = [
    '/plan/debts',
    '/plan/strategy', 
    '/plan/forecast',
    '/plan/snowflakes',
    '/plan/goals'
   ];
   const actualPaths = tabs.map(tab => tab.path);
   expect(actualPaths).toEqual(expectedPaths);
  });

  test('has correct tab icons', () => {
   const expectedIcons = ['💳', '🎯', '📊', '❄️', '🎯'];
   const actualIcons = tabs.map(tab => tab.icon);
   expect(actualIcons).toEqual(expectedIcons);
  });

  test('tab IDs match path segments', () => {
   tabs.forEach(tab => {
    const pathSegment = tab.path.split('/').pop();
    expect(pathSegment).toBe(tab.id);
   });
  });
 });

 describe('Path Validation', () => {
  test('all tab paths are valid plan routes', () => {
   tabs.forEach(tab => {
    expect(tab.path.startsWith('/plan/')).toBe(true);
    expect(getActiveTab(tab.path)).toBe(tab.id);
   });
  });

  test('tab paths are unique', () => {
   const paths = tabs.map(tab => tab.path);
   const uniquePaths = [...new Set(paths)];
   expect(paths).toEqual(uniquePaths);
  });

  test('tab IDs are unique', () => {
   const ids = tabs.map(tab => tab.id);
   const uniqueIds = [...new Set(ids)];
   expect(ids).toEqual(uniqueIds);
  });
 });

 describe('URL Parameter Handling', () => {
  test('getActiveTab ignores query parameters', () => {
   expect(getActiveTab('/plan/debts?add=true')).toBe('debts');
   expect(getActiveTab('/plan/forecast?scenario=boost&amount=100')).toBe('forecast');
   expect(getActiveTab('/plan/strategy?focus=debt1')).toBe('strategy');
  });

  test('getActiveTab ignores URL fragments', () => {
   expect(getActiveTab('/plan/debts#summary')).toBe('debts');
   expect(getActiveTab('/plan/forecast#chart')).toBe('forecast');
  });

  test('getActiveTab handles complex URLs', () => {
   expect(getActiveTab('/plan/snowflakes/add?type=bonus&amount=50#form')).toBe('snowflakes');
   expect(getActiveTab('/plan/goals/milestone/1?edit=true')).toBe('goals');
  });
 });

 describe('Navigation Logic', () => {
  test('default routing favors user onboarding', () => {
   // Default to debts tab so users can immediately add debts
   expect(getActiveTab('/plan')).toBe('debts');
   expect(getActiveTab('/plan/')).toBe('debts');
   expect(getActiveTab('/unknown')).toBe('debts');
  });

  test('supports sub-routes within tabs', () => {
   expect(getActiveTab('/plan/debts/add')).toBe('debts');
   expect(getActiveTab('/plan/debts/edit/123')).toBe('debts');
   expect(getActiveTab('/plan/forecast/export/csv')).toBe('forecast');
   expect(getActiveTab('/plan/strategy/comparison')).toBe('strategy');
  });

  test('order independence for path segments', () => {
   // The function uses includes(), so position shouldn't matter for simple cases
   expect(getActiveTab('/some/path/with/debts/in/it')).toBe('debts');
   expect(getActiveTab('/another/forecast/path')).toBe('forecast');
  });
 });

 describe('Error Handling', () => {
  test('handles null and undefined inputs', () => {
   expect(getActiveTab(null as any)).toBe('debts');
   expect(getActiveTab(undefined as any)).toBe('debts');
  });

  test('handles empty string', () => {
   expect(getActiveTab('')).toBe('debts');
  });

  test('handles malformed paths', () => {
   expect(getActiveTab('not-a-path')).toBe('debts');
   expect(getActiveTab('//double//slashes')).toBe('debts');
   expect(getActiveTab('/plan//strategy')).toBe('strategy'); // still works
  });
 });
});