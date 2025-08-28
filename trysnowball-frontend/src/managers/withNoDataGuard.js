/**
 * Development-only proxy guard to prevent .data access on managers
 * Throws clear error messages when developers try to access internal state
 */

function withNoDataGuard(mgr, name) {
  if (process.env.NODE_ENV === 'production') return mgr;
  
  return new Proxy(mgr, {
    get(target, prop, receiver) {
      if (prop === 'data') {
        throw new Error(
          `[${name}] .data is private and causes crashes! ` +
          `Use facade methods like getData(), getMetrics(), getUser(), etc. ` +
          `See AUTH_DEBUG_GUIDE.md for safe patterns.`
        );
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export { withNoDataGuard };