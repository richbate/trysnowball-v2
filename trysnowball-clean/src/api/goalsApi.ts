/**
 * CP-5 Goals API Client
 * Clean interface to the CP-5 backend API
 */

import { authToken } from '../lib/authToken';

interface Goal {
  id: string;
  user_id: string;
  type: 'debt_clear' | 'interest_saved' | 'time_saved';
  target_value: number;
  current_value?: number;
  forecast_debt_id?: string;
  created_at: string;
  completed_at?: string;
  dismissed: number;
}

interface CreateGoalRequest {
  type: 'debt_clear' | 'interest_saved' | 'time_saved';
  target_value: number;
  forecast_debt_id?: string;
}

interface UpdateGoalRequest {
  current_value?: number;
  completed_at?: string;
  dismissed?: boolean;
}

interface ApiResponse<T> {
  status: 'ok' | 'error';
  data?: T;
  message?: string;
}

class GoalsApi {
  private baseUrl: string;
  private getAuthToken: () => string | null;

  constructor(baseUrl: string = process.env.REACT_APP_API_URL || 'http://localhost:8787') {
    this.baseUrl = baseUrl;
    // Get token from auth manager
    this.getAuthToken = () => authToken.getToken();
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    if (!token && path !== '/health') {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.message || 'API error');
    }

    return result.data as T;
  }

  /**
   * List all active goals for the current user
   */
  async listGoals(): Promise<Goal[]> {
    return this.request<Goal[]>('/api/v2/goals');
  }

  /**
   * Create a new goal
   */
  async createGoal(goal: CreateGoalRequest): Promise<{ id: string; created_at: string }> {
    return this.request<{ id: string; created_at: string }>('/api/v2/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  }

  /**
   * Update goal progress or status
   */
  async updateGoal(id: string, updates: UpdateGoalRequest): Promise<{ updated: boolean }> {
    return this.request<{ updated: boolean }>(`/api/v2/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Dismiss (soft delete) a goal
   */
  async dismissGoal(id: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>(`/api/v2/goals/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Check API health
   */
  async health(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Export singleton instance
export const goalsApi = new GoalsApi();

// Export types
export type { Goal, CreateGoalRequest, UpdateGoalRequest };