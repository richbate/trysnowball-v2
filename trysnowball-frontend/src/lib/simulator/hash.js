// Hash utility for memoization
export function hashKey(obj) {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  } catch (e) {
    // Fallback to simple string if btoa fails
    return JSON.stringify(obj);
  }
}