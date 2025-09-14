/**
 * Feature Flags with Safe Defaults
 * Purpose: Safe defaults; robust parsing; never block core flows
 */

type Flags = {
 YUKI_ENABLED: boolean;
 EXPERIMENTS_ENABLED: boolean;
 [k: string]: boolean | number | string | undefined;
};

function parseFlags(json: string | undefined): Partial<Flags> {
 if (!json) return {};
 try { 
  const obj = JSON.parse(json);
  return (obj && typeof obj === 'object') ? obj as Partial<Flags> : {};
 } catch { 
  if (process.env.NODE_ENV !== 'production') {
   // eslint-disable-next-line no-console
   console.warn('[FLAGS] Invalid JSON, using safe defaults');
  }
  return {};
 }
}

const defaults: Flags = {
 YUKI_ENABLED: false,
 EXPERIMENTS_ENABLED: false,
};

export const FLAGS: Flags = { ...defaults, ...parseFlags(process.env.REACT_APP_FEATURE_FLAGS) };