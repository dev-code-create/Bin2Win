import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Admin, AuthContextType } from '../types';
import adminApiService from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('adminAuthToken');
        const storedAdmin = localStorage.getItem('adminData');

        if (storedToken && storedAdmin) {
          setToken(storedToken);
          setAdmin(JSON.parse(storedAdmin));

          // Verify token with backend
          try {
            const response = await adminApiService.getCurrentAdmin();
            if (response.success) {
              setAdmin(response.data);
              localStorage.setItem('adminData', JSON.stringify(response.data));
            } else {
              throw new Error('Token verification failed');
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            // Token is invalid, clear auth state
            localStorage.removeItem('adminAuthToken');
            localStorage.removeItem('adminData');
            setToken(null);
            setAdmin(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await adminApiService.login({ login: username, password });

      if (response.success) {
        const { admin: adminData, token: authToken } = response.data;

        // Store auth data
        setAdmin(adminData);
        setToken(authToken);
        localStorage.setItem('adminAuthToken', authToken);
        localStorage.setItem('adminData', JSON.stringify(adminData));

        // Show success message
        toast.success('Login successful!');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint
      await adminApiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call result
      setAdmin(null);
      setToken(null);
      localStorage.removeItem('adminAuthToken');
      localStorage.removeItem('adminData');
      
      toast.info('Logged out successfully');
    }
  };

  // Update admin data
  const updateAdmin = (adminData: Partial<Admin>) => {
    if (admin) {
      const updatedAdmin = { ...admin, ...adminData };
      setAdmin(updatedAdmin);
      localStorage.setItem('adminData', JSON.stringify(updatedAdmin));
    }
  };

  // Check if admin has specific permission
  const hasPermission = (module: string, action: string): boolean => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;

    return admin.permissions.some(perm => 
      perm.module === module && perm.actions.includes(action as any)
    );
  };

  // Check if admin can access booth
  const canAccessBooth = (boothId: string): boolean => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    
    return admin.assignedBooths.includes(boothId);
  };

  // Get admin role display name
  const getRoleDisplayName = (role: string): string => {
    const roleNames: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'booth_operator': 'Booth Operator',
      'moderator': 'Moderator',
      'viewer': 'Viewer'
    };
    
    return roleNames[role] || role;
  };

  // Get role color
  const getRoleColor = (role: string): string => {
    const roleColors: Record<string, string> = {
      'super_admin': 'danger',
      'admin': 'primary',
      'booth_operator': 'success',
      'moderator': 'warning',
      'viewer': 'secondary'
    };
    
    return roleColors[role] || 'secondary';
  };

  // Check if current time is within admin's working hours (if applicable)
  const isWithinWorkingHours = (): boolean => {
    // This could be implemented based on admin's schedule
    // For now, return true
    return true;
  };

  const contextValue: AuthContextType = {
    admin,
    token,
    isAuthenticated: !!admin && !!token,
    isLoading,
    login,
    logout,
    updateAdmin,
  };

  // Extended context value with helper methods
  const extendedContextValue = {
    ...contextValue,
    hasPermission,
    canAccessBooth,
    getRoleDisplayName,
    getRoleColor,
    isWithinWorkingHours,
  };

  return (
    <AuthContext.Provider value={extendedContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType & {
  hasPermission: (module: string, action: string) => boolean;
  canAccessBooth: (boothId: string) => boolean;
  getRoleDisplayName: (role: string) => string;
  getRoleColor: (role: string) => string;
  isWithinWorkingHours: () => boolean;
} => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as any;
};

export default AuthContext;
