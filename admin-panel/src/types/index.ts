// Admin types
export interface Admin {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: 'super_admin' | 'admin' | 'booth_operator' | 'moderator' | 'viewer';
  permissions: AdminPermission[];
  assignedBooths: string[];
  isActive: boolean;
  lastLogin?: string;
  statistics: AdminStatistics;
  preferences: AdminPreferences;
}

export interface AdminPermission {
  module: 'users' | 'booths' | 'waste' | 'rewards' | 'transactions' | 'analytics' | 'system';
  actions: ('create' | 'read' | 'update' | 'delete' | 'approve' | 'reject')[];
}

export interface AdminStatistics {
  totalLogins: number;
  submissionsVerified: number;
  submissionsApproved: number;
  submissionsRejected: number;
  averageProcessingTime: number;
}

export interface AdminPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'hi' | 'mr';
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
}

// User types (for admin management)
export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  greenCredits: number;
  totalWasteSubmitted: number;
  qrCode: string;
  currentRank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  totalSubmissions: number;
  registrationDate: string;
  lastActive: string;
  isActive: boolean;
}

// Waste Submission types
export interface WasteSubmission {
  id: string;
  user: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  booth: {
    id: string;
    name: string;
    address: string;
  };
  wasteType: 'plastic' | 'organic' | 'paper' | 'metal' | 'glass' | 'electronic' | 'textile' | 'hazardous';
  quantity: number;
  pointsEarned: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  submissionDate: string;
  verificationDate?: string;
  verifiedBy?: string;
  photos: WastePhoto[];
  notes?: string;
  qualityScore?: number;
  qrCode: string;
  metadata: SubmissionMetadata;
}

export interface WastePhoto {
  url: string;
  filename: string;
  uploadDate: string;
}

export interface SubmissionMetadata {
  deviceInfo?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  weatherCondition?: string;
  submissionMethod: 'qr_scan' | 'manual' | 'booth_operator';
}

// Collection Booth types
export interface CollectionBooth {
  id: string;
  name: string;
  boothId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    area: string;
    landmark?: string;
    pincode: string;
  };
  operatingHours: {
    start: string;
    end: string;
    isOpen24Hours: boolean;
    closedDays: string[];
  };
  contactPerson: {
    name: string;
    phone: string;
    alternatePhone?: string;
    email?: string;
  };
  facilities: {
    hasWeighingScale: boolean;
    hasSegregation: boolean;
    hasWashingFacility: boolean;
    hasShade: boolean;
    hasSeating: boolean;
    acceptedWasteTypes: string[];
    specialInstructions?: string;
  };
  capacity: {
    maxKgPerDay: number;
    maxSubmissionsPerDay: number;
  };
  currentLoad: {
    totalKgToday: number;
    submissionsToday: number;
    lastResetDate: string;
  };
  statistics: {
    totalCollected: number;
    totalSubmissions: number;
    averageRating: number;
    totalRatings: number;
    lastCollectionDate?: string;
    mostCollectedWasteType?: string;
  };
  isActive: boolean;
  qrCode: string;
  currentStatus: 'open' | 'closed' | 'full' | 'closed_today' | 'inactive';
  capacityUtilization: {
    weight: string;
    submissions: string;
  };
}

// Reward types
export interface Reward {
  id: string;
  name: string;
  description: string;
  category: 'prasad' | 'flowers' | 'coconut' | 'merchandise' | 'voucher' | 'experience' | 'donation';
  subcategory?: string;
  pointsRequired: number;
  effectivePoints: number;
  discount: number;
  images: RewardImage[];
  stock: {
    total: number;
    available: number;
    reserved: number;
  };
  stockStatus: 'in_stock' | 'low_stock' | 'medium_stock' | 'out_of_stock';
  availabilityStatus: string;
  statistics: {
    totalRedeemed: number;
    totalViews: number;
    averageRating: number;
    totalRatings: number;
    popularityScore: number;
  };
  sponsor?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

// Dashboard Statistics
export interface DashboardStats {
  overview: {
    users: {
      total: number;
      active: number;
      newInPeriod: number;
    };
    booths: {
      total: number;
      active: number;
    };
    rewards: {
      total: number;
      active: number;
    };
    submissions: {
      pending: number;
      totalInPeriod: number;
      approvedInPeriod: number;
    };
  };
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  submissionStats: SubmissionStat[];
  wasteTypeBreakdown: WasteTypeStat[];
  topBooths: TopBooth[];
  topUsers: TopUser[];
  recentActivity: RecentActivity[];
  transactionStats: TransactionStat[];
  systemHealth: {
    avgProcessingTime: number;
    errorRate: string;
    userSatisfaction: string;
  };
}

export interface SubmissionStat {
  status: string;
  count: number;
  quantity: number;
  points: number;
  dailyBreakdown: DailyBreakdown[];
}

export interface WasteTypeStat {
  _id: string;
  totalQuantity: number;
  totalSubmissions: number;
  totalPoints: number;
  averageQuantity: number;
}

export interface TopBooth {
  id: string;
  name: string;
  area?: string;
  submissions: number;
  quantity: number;
  points: number;
}

export interface TopUser {
  id: string;
  name: string;
  greenCredits: number;
  totalSubmissions: number;
  rank: string;
  registrationDate: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  user?: string;
  booth?: string;
  wasteType?: string;
  quantity?: number;
  status?: string;
  date: string;
}

export interface TransactionStat {
  _id: string;
  count: number;
  totalPoints: number;
}

export interface DailyBreakdown {
  date: string;
  count: number;
  quantity: number;
  points: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface AdminLoginForm {
  login: string;
  password: string;
}

export interface UserUpdateForm {
  isActive?: boolean;
  greenCredits?: number;
  notes?: string;
}

export interface BoothForm {
  name: string;
  boothId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    landmark?: string;
    area: string;
    pincode: string;
  };
  operatingHours: {
    start: string;
    end: string;
    isOpen24Hours: boolean;
    closedDays: string[];
  };
  contactPerson: {
    name: string;
    phone: string;
    alternatePhone?: string;
    email?: string;
  };
  capacity: {
    maxKgPerDay: number;
    maxSubmissionsPerDay: number;
  };
  facilities: {
    hasWeighingScale: boolean;
    hasSegregation: boolean;
    hasWashingFacility: boolean;
    hasShade: boolean;
    hasSeating: boolean;
    acceptedWasteTypes: string[];
    specialInstructions?: string;
  };
}

export interface RewardForm {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  pointsRequired: number;
  stock: {
    total: number;
    available: number;
  };
  availability: {
    startDate?: string;
    endDate?: string;
    isLimitedTime: boolean;
    availableDays: string[];
    availableHours: {
      start?: string;
      end?: string;
    };
  };
  redemption: {
    method: string;
    locations: any[];
    instructions?: string;
    validityPeriod: number;
  };
  requirements: {
    minimumRank: string;
    minimumWasteSubmissions: number;
    allowedUserTypes: string[];
  };
  sponsor?: {
    name?: string;
    logo?: string;
    website?: string;
  };
  tags: string[];
  pricing?: {
    originalValue?: number;
    discountPercentage?: number;
  };
}

// Context types
export interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  updateAdmin: (adminData: Partial<Admin>) => void;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
}

// Filter types
export interface UserFilters {
  search?: string;
  rank?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SubmissionFilters {
  status?: string;
  boothId?: string;
  userId?: string;
  wasteType?: string;
  startDate?: string;
  endDate?: string;
}

export interface BoothFilters {
  search?: string;
  area?: string;
  isActive?: boolean;
  sortBy?: string;
}

export interface RewardFilters {
  category?: string;
  isActive?: boolean;
  stockStatus?: string;
  sortBy?: string;
}

// Table column types
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

// Notification types
export interface NotificationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Component props
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Modal props
export interface ModalProps extends ComponentProps {
  show: boolean;
  onHide: () => void;
  title?: string;
  size?: 'sm' | 'lg' | 'xl';
}

// Analytics types
export interface AnalyticsData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
    groupBy: string;
  };
  timeSeries: TimeSeriesData[];
  summary: {
    current: {
      submissions: number;
      quantity: number;
      points: number;
      uniqueUsers: number;
    };
    previous: {
      submissions: number;
      quantity: number;
      points: number;
      uniqueUsers: number;
    };
    growth: {
      submissions: string;
      quantity: string;
      points: string;
      uniqueUsers: string;
    };
  };
}

export default {};
