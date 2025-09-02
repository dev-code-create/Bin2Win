import React, { createContext, useContext, useState, useEffect } from "react";
import apiService from "../services/api";
import { toast } from "react-toastify";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState("user"); // 'user' or 'admin'

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("userData");
        const storedUserType = localStorage.getItem("userType") || "user";

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setUserType(storedUserType);

          // Verify token with backend
          try {
            const response = await apiService.getCurrentUser();
            if (response.success) {
              setUser(response.data);
              localStorage.setItem("userData", JSON.stringify(response.data));
            } else {
              throw new Error("Token verification failed");
            }
          } catch (error) {
            console.error("Token verification failed:", error);
            
            // Only clear auth state if it's an authentication error (401/403)
            // For network errors, keep the stored credentials
            if (error.status === 401 || error.status === 403) {
              console.log("Token is invalid, clearing auth state");
              localStorage.removeItem("authToken");
              localStorage.removeItem("userData");
              localStorage.removeItem("refreshToken");
              setToken(null);
              setUser(null);
            } else {
              console.log("Network error during token verification, keeping stored credentials");
              // Keep the stored credentials for offline use
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, authToken, type = "user") => {
    setUser(userData);
    setToken(authToken);
    setUserType(type);
    localStorage.setItem("authToken", authToken);
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("userType", type);
  };

  const loginAdmin = (adminData, authToken) => {
    login(adminData, authToken, "admin");
  };

  const loginWithCredentials = async (username, password) => {
    try {
      const response = await apiService.login(username, password);
      if (response.success) {
        const { user: userData, authToken } = response.data;

        // Store auth data
        login(userData, authToken);
        toast.success("Login successful!");
        return true;
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      const errorMessage = error.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      if (response.success) {
        const { user: newUser, authToken } = response.data;

        // Store auth data
        login(newUser, authToken);
        toast.success(
          "Registration successful! Welcome to Simhastha Clean & Green!"
        );
        return true;
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      const errorMessage =
        error.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      setToken(null);
      setUserType("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("userType");
      localStorage.removeItem("refreshToken");

      toast.info("Logged out successfully");
    }
  };

  const updateUser = (userData) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    }
  };

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiService.refreshToken(storedRefreshToken);

      if (response.success) {
        const { token: newToken, user: userData } = response.data;

        setToken(newToken);
        setUser(userData);
        localStorage.setItem("authToken", newToken);
        localStorage.setItem("userData", JSON.stringify(userData));
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      // If refresh fails, logout user
      await logout();
    }
  };

  // Auto refresh token every 30 minutes
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error("Auto refresh failed:", error);
      }
    }, 30 * 60 * 1000); // Refresh every 30 minutes

    return () => clearInterval(interval);
  }, [token]);

  // Update user credits
  const updateUserCredits = (credits) => {
    if (user) {
      updateUser({ greenCredits: credits });
    }
  };

  // Update user rank
  const updateUserRank = (newRank) => {
    if (user) {
      updateUser({
        currentRank: newRank,
        stats: { ...user.stats, rank: newRank },
      });
    }
  };

  // Get user rank color
  const getRankColor = (rank) => {
    switch (rank) {
      case "Bronze":
        return "#CD7F32";
      case "Silver":
        return "#C0C0C0";
      case "Gold":
        return "#FFD700";
      case "Platinum":
        return "#E5E4E2";
      case "Diamond":
        return "#B9F2FF";
      default:
        return "#CD7F32";
    }
  };

  // Check if user has enough credits
  const hasCredits = (requiredCredits) => {
    return user ? user.greenCredits >= requiredCredits : false;
  };

  // Get user's next rank threshold
  const getNextRankThreshold = () => {
    if (!user) return null;

    const ranks = [
      { name: "Bronze", threshold: 0 },
      { name: "Silver", threshold: 500 },
      { name: "Gold", threshold: 2000 },
      { name: "Platinum", threshold: 5000 },
      { name: "Diamond", threshold: 10000 },
    ];

    const currentCredits = user.greenCredits;

    for (let i = 0; i < ranks.length; i++) {
      if (currentCredits < ranks[i].threshold) {
        return {
          rank: ranks[i].name,
          pointsNeeded: ranks[i].threshold - currentCredits,
        };
      }
    }

    return null; // User is at max rank
  };

  // Get rank progress percentage
  const getRankProgress = () => {
    if (!user) return 0;

    const ranks = [
      { name: "Bronze", threshold: 0 },
      { name: "Silver", threshold: 500 },
      { name: "Gold", threshold: 2000 },
      { name: "Platinum", threshold: 5000 },
      { name: "Diamond", threshold: 10000 },
    ];

    const currentCredits = user.greenCredits;
    const currentRankIndex = ranks.findIndex(
      (r) => r.name === user.currentRank
    );

    if (currentRankIndex === -1) return 0;
    if (currentRankIndex === ranks.length - 1) return 100; // Diamond rank

    const currentThreshold = ranks[currentRankIndex].threshold;
    const nextThreshold = ranks[currentRankIndex + 1].threshold;
    const progress =
      ((currentCredits - currentThreshold) /
        (nextThreshold - currentThreshold)) *
      100;

    return Math.min(100, Math.max(0, progress));
  };

  const contextValue = {
    user,
    token,
    isLoading,
    userType,
    login,
    loginAdmin,
    loginWithCredentials,
    register,
    logout,
    updateUser,
    refreshToken,
    updateUserCredits,
    updateUserRank,
    getRankColor,
    hasCredits,
    getNextRankThreshold,
    getRankProgress,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
