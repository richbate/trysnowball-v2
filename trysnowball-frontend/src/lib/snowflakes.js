/**
 * Snowflakes - Ad-hoc one-off overpayments to specific debts
 */

const KEY = 'SNOWBALL_SNOWFLAKES_V1';

export function loadSnowflakes() {
  try { 
    return JSON.parse(localStorage.getItem(KEY) || '[]'); 
  } catch { 
    return []; 
  }
}

export function saveSnowflakes(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function addSnowflake(sf) {
  const list = loadSnowflakes();
  const item = { 
    ...sf, 
    id: crypto.randomUUID(), 
    createdAtISO: new Date().toISOString() 
  };
  list.push(item);
  return saveSnowflakes(list);
}

export function updateSnowflake(id, patch) {
  const list = loadSnowflakes().map(x => x.id === id ? { ...x, ...patch } : x);
  return saveSnowflakes(list);
}

export function removeSnowflake(id) {
  return saveSnowflakes(loadSnowflakes().filter(x => x.id !== id));
}

export function byMonthAndDebt(list) {
  const map = new Map(); // key = `${monthIndex}:${debtId}`
  for (const s of list) {
    const k = `${s.monthIndex}:${s.debtId}`;
    map.set(k, Math.max(0, (map.get(k) || 0) + (Number(s.amount) || 0)));
  }
  return map;
}

// Utility functions for validation and formatting
export function validateSnowflake(snowflake) {
  const errors = [];
  
  if (!snowflake.debtId) {
    errors.push('Debt is required');
  }
  
  if (typeof snowflake.monthIndex !== 'number' || snowflake.monthIndex < 0) {
    errors.push('Valid month is required');
  }
  
  const amount = Number(snowflake.amount);
  if (!amount || amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function clampCurrency(amount) {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

export function formatSnowflakeAmount(amount) {
  return `£${clampCurrency(amount).toLocaleString()}`;
}

export function getMonthLabel(monthIndex, startDate) {
  const date = new Date(startDate || new Date());
  date.setMonth(date.getMonth() + monthIndex);
  return date.toLocaleDateString('en-GB', { 
    month: 'short', 
    year: 'numeric' 
  });
}