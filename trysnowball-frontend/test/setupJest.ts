// If anything still references import.meta, neutralize it
// Prefer using isDev() everywhere instead.
(globalThis as any).import = (globalThis as any).import || {};