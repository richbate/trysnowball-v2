import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface UserRegistrationData {
  personal: {
    first_name: string;
    last_name: string;
    dob: string;
  };
  contact: {
    email: string;
  };
  security: {
    password: string;
  };
  consent: {
    accepted_single_id_terms: boolean;
    single_id_terms_version: string;
  };
}

export interface AccessTokenData {
  grant_type: 'password';
  username: string;
  password: string;
  client_id: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface UserRegistrationResponse {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  description?: string;
  image_url?: string;
  category?: string;
  offers?: Offer[];
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount_percentage?: number;
  discount_amount?: number;
  currency?: string;
  valid_from?: string;
  valid_until?: string;
  terms_conditions?: string;
  redemption_instructions?: string;
  location_id: string;
  location_name?: string;
  status: 'active' | 'inactive' | 'expired';
  category?: string;
  image_url?: string;
}

export interface LocationsResponse {
  locations: Location[];
  total: number;
  page?: number;
  limit?: number;
}

export interface OffersResponse {
  offers: Offer[];
  total: number;
  page?: number;
  limit?: number;
}

class SingleidApiService {
  private api: AxiosInstance;
  private accessToken: string | null = null;
  
  constructor() {
    this.api = axios.create({
      baseURL: 'https://staging.single.id',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.url !== '/oauth/access_token') {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Set basic authentication for publisher credentials
  setPublisherAuth(username: string, token: string): void {
    const credentials = btoa(`${username}:${token}`);
    this.api.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
  }

  // Register a new user
  async registerUser(userData: UserRegistrationData): Promise<UserRegistrationResponse> {
    try {
      const response: AxiosResponse<UserRegistrationResponse> = await this.api.post(
        '/user/register',
        userData
      );
      return response.data;
    } catch (error) {
      console.error('User registration failed:', error);
      throw error;
    }
  }

  // Get access token using password flow
  async getAccessToken(credentials: {
    username: string;
    password: string;
    client_id?: string;
  }): Promise<AccessTokenResponse> {
    try {
      const tokenData = new URLSearchParams({
        grant_type: 'password',
        username: credentials.username,
        password: credentials.password,
        client_id: credentials.client_id || 'swipii',
      });

      const response: AxiosResponse<AccessTokenResponse> = await this.api.post(
        '/oauth/access_token',
        tokenData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
            'Cache-Control': 'no-cache',
          },
        }
      );

      this.accessToken = response.data.access_token;
      return response.data;
    } catch (error) {
      console.error('Access token request failed:', error);
      throw error;
    }
  }

  // Clear stored access token
  clearAccessToken(): void {
    this.accessToken = null;
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Get current access token
  getCurrentAccessToken(): string | null {
    return this.accessToken;
  }

  // Get all locations
  async getLocations(params?: {
    page?: number;
    limit?: number;
    city?: string;
    country?: string;
    category?: string;
  }): Promise<LocationsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.city) queryParams.append('city', params.city);
      if (params?.country) queryParams.append('country', params.country);
      if (params?.category) queryParams.append('category', params.category);
      
      const queryString = queryParams.toString();
      const endpoint = `/locations${queryString ? `?${queryString}` : ''}`;
      
      const response: AxiosResponse<LocationsResponse> = await this.api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Get locations failed:', error);
      throw error;
    }
  }

  // Get offers for all locations or a specific location
  async getOffers(params?: {
    location_id?: string;
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'expired';
    category?: string;
  }): Promise<OffersResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.location_id) queryParams.append('location_id', params.location_id);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      
      const queryString = queryParams.toString();
      const endpoint = `/offers${queryString ? `?${queryString}` : ''}`;
      
      const response: AxiosResponse<OffersResponse> = await this.api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Get offers failed:', error);
      throw error;
    }
  }

  // Get a specific location by ID
  async getLocation(locationId: string): Promise<Location> {
    try {
      const response: AxiosResponse<Location> = await this.api.get(`/locations/${locationId}`);
      return response.data;
    } catch (error) {
      console.error(`Get location ${locationId} failed:`, error);
      throw error;
    }
  }

  // Get a specific offer by ID
  async getOffer(offerId: string): Promise<Offer> {
    try {
      const response: AxiosResponse<Offer> = await this.api.get(`/offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error(`Get offer ${offerId} failed:`, error);
      throw error;
    }
  }

  // Generic GET request method
  async get<T = any>(endpoint: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Generic POST request method
  async post<T = any>(endpoint: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Generic PUT request method
  async put<T = any>(endpoint: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  // Generic DELETE request method
  async delete<T = any>(endpoint: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const singleidApi = new SingleidApiService();

// Set up publisher authentication with provided credentials
singleidApi.setPublisherAuth('swipii#publisher', 'GctbDqNbMhvVDZUEh2cq4aPMQAYxBULf');

export default singleidApi;