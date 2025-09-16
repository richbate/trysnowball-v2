// src/config/api.js
const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000" // short-circuit in dev
    : process.env.REACT_APP_API_BASE || "https://trysnowball.co.uk";

export const API_CONFIG = {
  BASE: API_BASE,
  AUTH: {
    BASE: `${API_BASE}/auth`,
    HEALTH: `${API_BASE}/auth/health`, // not /auth/check
    REQUEST_LINK: `${API_BASE}/auth/request-link`,
    VERIFY: `${API_BASE}/auth/verify`,
    // REMOVED: ME endpoint - no server auth calls needed
    REFRESH: `${API_BASE}/auth/refresh`,
    LOGOUT: `${API_BASE}/auth/logout`,
  },
  // ...
};