import axios from "axios";

// API Configuration - Mobile friendly setup
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // For mobile access, use the computer's IP instead of localhost
  const host = window.location.hostname === 'localhost' ? '192.168.1.3' : window.location.hostname;
  return `http://${host}:3001/api`;
};

const API_BASE_URL = getApiBaseUrl();
console.log('API_BASE_URL:', API_BASE_URL);

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              const { token } = response.data;
              localStorage.setItem("authToken", token);
              // Retry the original request
              error.config.headers.Authorization = `Bearer ${token}`;
              return this.api.request(error.config);
            } catch (refreshError) {
              // Refresh failed, redirect to login
              localStorage.removeItem("authToken");
              localStorage.removeItem("refreshToken");
              window.location.href = "/login";
              return Promise.reject(refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  async request(method, url, data, config) {
    try {
      const response = await this.api.request({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || `HTTP Error ${status}`;
      const customError = new Error(message);
      customError.status = status;
      customError.errors = data?.errors;
      return customError;
    } else if (error.request) {
      return new Error("Network error - please check your connection");
    } else {
      return new Error("Request failed");
    }
  }

  // Authentication API
  async login(username, password) {
    const response = await this.request("POST", "/auth/login", {
      username,
      password,
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem("authToken", response.data.token);
    }
    
    return response;
  }

  async adminLogin(username, password) {
    const response = await this.request("POST", "/auth/admin/login", {
      login: username,
      password,
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("userType", "admin");
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request("POST", "/auth/register", userData);
    
    if (response.success && response.data.authToken) {
      localStorage.setItem("authToken", response.data.authToken);
    }
    
    return response;
  }

  async logout() {
    return this.request("POST", "/auth/logout");
  }

  async getCurrentUser() {
    return this.request("GET", "/auth/me");
  }

  async refreshToken(refreshToken) {
    return this.request("POST", "/auth/refresh", { refreshToken });
  }

  async forgotPassword(email) {
    return this.request("POST", "/auth/forgot-password", { email });
  }

  async resetPassword(token, newPassword) {
    return this.request("POST", "/auth/reset-password", { token, newPassword });
  }

  async changePassword(oldPassword, newPassword) {
    return this.request("PUT", "/auth/change-password", {
      oldPassword,
      newPassword,
    });
  }

  async verifyEmail(token) {
    return this.request("POST", "/auth/verify-email", { token });
  }

  async resendVerificationEmail() {
    return this.request("POST", "/auth/resend-verification");
  }

  // User Profile API
  async updateProfile(profileData) {
    return this.request("PUT", "/user/profile", profileData);
  }

  async uploadProfileImage(imageFile) {
    const formData = new FormData();
    formData.append("profileImage", imageFile);
    return this.request("POST", "/user/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async deleteAccount() {
    return this.request("DELETE", "/user/profile");
  }

  async getUserStatistics(period = "30d") {
    return this.request("GET", `/user/stats?period=${period}`);
  }

  async getNotificationSettings() {
    return this.request("GET", "/user/notifications");
  }

  async updateNotificationSettings(settings) {
    return this.request("PUT", "/user/notifications", settings);
  }

  // Waste Submission API
  async submitWaste(formData) {
    return this.request("POST", "/waste/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async getWasteSubmissions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/waste/submissions${queryString ? `?${queryString}` : ""}`);
  }

  async getWasteSubmissionById(id) {
    return this.request("GET", `/waste/submissions/${id}`);
  }

  async updateWasteSubmission(id, updateData) {
    return this.request("PUT", `/waste/submissions/${id}`, updateData);
  }

  async deleteWasteSubmission(id) {
    return this.request("DELETE", `/waste/submissions/${id}`);
  }

  async getWasteTypes() {
    return this.request("GET", "/waste/types");
  }

  async getWasteSubmissionHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/waste/history${queryString ? `?${queryString}` : ""}`);
  }

  // Collection Booth API
  async getNearbyBooths(latitude, longitude, radius = 5000) {
    return this.request("GET", `/booths/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`);
  }

  async getAllBooths(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/booths${queryString ? `?${queryString}` : ""}`);
  }

  async getBoothById(id) {
    return this.request("GET", `/booths/${id}`);
  }

  async getBoothStatistics(id, period = "30d") {
    return this.request("GET", `/booths/${id}/stats?period=${period}`);
  }

  async validateBoothQR(qrCode) {
    return this.request("POST", "/booths/validate-qr", { qrCode });
  }

  async reportBoothIssue(boothId, issue) {
    return this.request("POST", `/booths/${boothId}/report`, issue);
  }

  // Rewards API
  async getRewards(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/rewards${queryString ? `?${queryString}` : ""}`);
  }

  async getRewardById(id) {
    return this.request("GET", `/rewards/${id}`);
  }

  async getPopularRewards(limit = 10) {
    return this.request("GET", `/rewards/popular?limit=${limit}`);
  }

  async getRewardCategories() {
    return this.request("GET", `/rewards/categories`);
  }

  async searchRewards(query, filters = {}) {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/rewards/search?${queryString}`);
  }

  async redeemReward(rewardId, data = {}) {
    return this.request("POST", `/rewards/${rewardId}/redeem`, data);
  }

  async getUserRedemptions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/rewards/user/redemptions${queryString ? `?${queryString}` : ""}`);
  }

  async getRedemptionById(redemptionId) {
    return this.request("GET", `/rewards/user/redemptions/${redemptionId}`);
  }

  // Wishlist API
  async getWishlist() {
    return this.request("GET", `/rewards/user/wishlist`);
  }

  async addToWishlist(rewardId) {
    return this.request("POST", `/rewards/user/wishlist/${rewardId}`);
  }

  async removeFromWishlist(rewardId) {
    return this.request("DELETE", `/rewards/user/wishlist/${rewardId}`);
  }

  async getFeaturedRewards() {
    return this.request("GET", "/rewards/featured");
  }

  async getRewardsByCategory(category, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/rewards/category/${category}${queryString ? `?${queryString}` : ""}`);
  }



  async getRedemptionHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/rewards/redemptions${queryString ? `?${queryString}` : ""}`);
  }



  async cancelRedemption(id) {
    return this.request("PUT", `/rewards/redemptions/${id}/cancel`);
  }

  // Transaction API
  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/transactions${queryString ? `?${queryString}` : ""}`);
  }

  async getTransactionById(id) {
    return this.request("GET", `/transactions/${id}`);
  }

  async getTransactionHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/transactions/history${queryString ? `?${queryString}` : ""}`);
  }

  // Leaderboard API
  async getLeaderboard(period = "monthly", limit = 50) {
    return this.request("GET", `/leaderboard?period=${period}&limit=${limit}`);
  }

  async getUserRanking(userId) {
    return this.request("GET", `/leaderboard/user/${userId}`);
  }

  async getTopContributors(limit = 10) {
    return this.request("GET", `/leaderboard/contributors?limit=${limit}`);
  }

  // Analytics API
  async getSystemStats() {
    return this.request("GET", "/analytics/system");
  }

  async getEnvironmentalImpact() {
    return this.request("GET", "/analytics/impact");
  }

  async getWasteTypeDistribution(period = "30d") {
    return this.request("GET", `/analytics/waste-distribution?period=${period}`);
  }

  // Search API


  async searchBooths(query, filters = {}) {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return this.request("GET", `/search/booths?${queryString}`);
  }

  // Health check
  async healthCheck() {
    return this.request("GET", "/health");
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
