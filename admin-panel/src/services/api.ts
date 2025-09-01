import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  Admin,
  User,
  WasteSubmission,
  CollectionBooth,
  Reward,
  DashboardStats,
  AnalyticsData,
  AdminLoginForm,
  UserUpdateForm,
  BoothForm,
  RewardForm
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

class AdminApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('adminAuthToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors and token refresh
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, redirect to login
          localStorage.removeItem('adminAuthToken');
          localStorage.removeItem('adminData');
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      const response = await this.api.request({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // Error handler
  private handleError(error: AxiosError): Error {
    if (error.response) {
      const { status, data } = error.response;
      const message = (data as any)?.message || `HTTP Error ${status}`;
      const customError = new Error(message);
      (customError as any).status = status;
      (customError as any).errors = (data as any)?.errors;
      return customError;
    } else if (error.request) {
      return new Error('Network error - please check your connection');
    } else {
      return new Error('Request failed');
    }
  }

  // Authentication API
  async login(credentials: AdminLoginForm): Promise<ApiResponse<{ admin: Admin; token: string }>> {
    return this.request<ApiResponse<{ admin: Admin; token: string }>>(
      'POST',
      '/auth/admin/login',
      credentials
    );
  }

  async logout(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('POST', '/auth/admin/logout');
  }

  async getCurrentAdmin(): Promise<ApiResponse<Admin>> {
    return this.request<ApiResponse<Admin>>('GET', '/auth/me');
  }

  // Dashboard API
  async getDashboardStats(period: string = '30d'): Promise<ApiResponse<DashboardStats>> {
    return this.request<ApiResponse<DashboardStats>>('GET', `/admin/dashboard?period=${period}`);
  }

  // User Management API
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    rank?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request<PaginatedResponse<User>>('GET', `/admin/users?${queryParams}`);
  }

  async updateUser(id: string, data: UserUpdateForm): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('PUT', `/admin/users/${id}`, data);
  }

  // Waste Submission Management API
  async getSubmissions(params: {
    page?: number;
    limit?: number;
    status?: string;
    boothId?: string;
    userId?: string;
    wasteType?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<PaginatedResponse<WasteSubmission>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    return this.request<PaginatedResponse<WasteSubmission>>('GET', `/admin/submissions?${queryParams}`);
  }

  async verifySubmission(id: string, data: {
    action: 'approve' | 'reject';
    notes?: string;
    qualityScore?: number;
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('PUT', `/waste/admin/verify/${id}`, data);
  }

  // Collection Booth Management API
  async getBooths(params: {
    page?: number;
    limit?: number;
    search?: string;
    area?: string;
    isActive?: boolean;
    sortBy?: string;
  } = {}): Promise<PaginatedResponse<CollectionBooth>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request<PaginatedResponse<CollectionBooth>>('GET', `/booths?${queryParams}`);
  }

  async createBooth(data: BoothForm): Promise<ApiResponse<CollectionBooth>> {
    return this.request<ApiResponse<CollectionBooth>>('POST', '/booths/admin', data);
  }

  async updateBooth(id: string, data: Partial<BoothForm>): Promise<ApiResponse<CollectionBooth>> {
    return this.request<ApiResponse<CollectionBooth>>('PUT', `/booths/admin/${id}`, data);
  }

  async deleteBooth(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('DELETE', `/booths/admin/${id}`);
  }

  async getBoothStats(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('GET', '/booths/admin/stats');
  }

  // Reward Management API
  async getRewards(params: {
    page?: number;
    limit?: number;
    category?: string;
    isActive?: boolean;
    stockStatus?: string;
    sortBy?: string;
  } = {}): Promise<PaginatedResponse<Reward>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request<PaginatedResponse<Reward>>('GET', `/rewards?${queryParams}`);
  }

  async createReward(data: RewardForm, images?: File[]): Promise<ApiResponse<Reward>> {
    const formData = new FormData();
    
    // Append form fields
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    
    // Append images
    if (images) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return this.request<ApiResponse<Reward>>(
      'POST',
      '/rewards/admin',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  async updateReward(id: string, data: Partial<RewardForm>): Promise<ApiResponse<Reward>> {
    return this.request<ApiResponse<Reward>>('PUT', `/rewards/admin/${id}`, data);
  }

  async deleteReward(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('DELETE', `/rewards/admin/${id}`);
  }

  // Analytics API
  async getAnalytics(params: {
    period?: string;
    groupBy?: string;
    metric?: string;
  } = {}): Promise<ApiResponse<AnalyticsData>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    return this.request<ApiResponse<AnalyticsData>>('GET', `/admin/analytics?${queryParams}`);
  }

  // System Management API
  async broadcastNotification(data: {
    title: string;
    message: string;
    targetUsers?: string;
    priority?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('POST', '/admin/broadcast', data);
  }

  async getSystemInfo(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('GET', '/admin/system-info');
  }

  // File upload utility
  async uploadFile(file: File, endpoint: string): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<ApiResponse<any>>(
      'POST',
      endpoint,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('GET', '/health');
  }

  // Get API instance for custom requests
  getApiInstance(): AxiosInstance {
    return this.api;
  }
}

// Create and export singleton instance
const adminApiService = new AdminApiService();
export default adminApiService;
