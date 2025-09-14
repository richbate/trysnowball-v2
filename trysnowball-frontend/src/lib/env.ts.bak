export const isDev = (): boolean =>
 (typeof process !== "undefined" && process.env.NODE_ENV === "development") ||
 false;

export const isTest = (): boolean =>
 typeof process !== "undefined" &&
 (process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === "test");