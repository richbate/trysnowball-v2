/**
 * Simple JWT Token Management
 * Handles auth token storage and retrieval
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface AuthUser {
  id: string;
  email?: string;
  entitlements: string[];
}

class AuthTokenManager {
  /**
   * Set authentication token
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    
    // Decode and store user info
    try {
      const payload = this.decodeToken(token);
      const entitlements = payload.entitlements || [];
      
      const user: AuthUser = {
        id: payload.sub || payload.user_id || payload.userId,
        email: payload.email,
        entitlements
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get current user
   */
  getUser(): AuthUser | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = this.decodeToken(token);
      // Check if token is expired
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        this.clearAuth();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Check if user has pro access based on entitlements
   */
  isPro(entitlements?: string[]): boolean {
    return entitlements?.includes('beta') ||
           entitlements?.includes('pro_monthly') ||
           entitlements?.includes('pro_annual') ||
           entitlements?.includes('founder') ||
           false;
  }

  /**
   * Decode JWT token payload
   */
  private decodeToken(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  }

  /**
   * Login with email (demo mode)
   * In production, this would call a real auth endpoint
   */
  async loginDemo(email: string, makePro: boolean = false): Promise<void> {
    // For demo purposes, create a mock JWT
    const entitlements = makePro ? ['beta'] : [];
    const mockPayload = {
      sub: `user_${Date.now()}`,
      email: email,
      entitlements,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000)
    };
    
    // Create a mock JWT (note: not cryptographically secure - demo only!)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(mockPayload));
    const signature = 'demo-signature'; // Not real - for demo only
    
    const mockToken = `${header}.${payload}.${signature}`;
    this.setToken(mockToken);
  }
}

export const authToken = new AuthTokenManager();