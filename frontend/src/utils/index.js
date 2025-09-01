// Format currency
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format number with Indian numbering system
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// Format date
export const formatDate = (date, options) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat('en-IN', { ...defaultOptions, ...options }).format(dateObj);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj, { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate Indian phone number
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

// Validate PIN code
export const isValidPincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

// Format phone number for display
export const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Generate random ID
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Get waste type color
export const getWasteTypeColor = (wasteType) => {
  const colors = {
    plastic: '#ff6b6b',
    organic: '#51cf66',
    paper: '#74c0fc',
    metal: '#868e96',
    glass: '#20c997',
    electronic: '#845ef7',
    textile: '#ff8cc8',
    hazardous: '#ff922b'
  };
  return colors[wasteType] || '#6c757d';
};

// Get waste type icon
export const getWasteTypeIcon = (wasteType) => {
  const icons = {
    plastic: '♻️',
    organic: '🌱',
    paper: '📄',
    metal: '🔧',
    glass: '🍶',
    electronic: '💻',
    textile: '👕',
    hazardous: '⚠️'
  };
  return icons[wasteType] || '🗑️';
};

// Calculate points for waste type
export const calculateWastePoints = (wasteType, quantity) => {
  const pointsPerKg = {
    plastic: 10,
    organic: 5,
    paper: 8,
    metal: 15,
    glass: 12,
    electronic: 20,
    textile: 6,
    hazardous: 25
  };
  
  const basePoints = (pointsPerKg[wasteType] || 5) * quantity;
  
  // Add bonus for larger quantities
  const bonusMultiplier = quantity > 5 ? 1.2 : quantity > 2 ? 1.1 : 1;
  
  return Math.round(basePoints * bonusMultiplier);
};

// Get user rank info
export const getUserRankInfo = (greenCredits) => {
  const ranks = [
    { name: 'Bronze', threshold: 0, color: '#CD7F32', icon: '🥉' },
    { name: 'Silver', threshold: 500, color: '#C0C0C0', icon: '🥈' },
    { name: 'Gold', threshold: 2000, color: '#FFD700', icon: '🥇' },
    { name: 'Platinum', threshold: 5000, color: '#E5E4E2', icon: '💎' },
    { name: 'Diamond', threshold: 10000, color: '#B9F2FF', icon: '💠' }
  ];
  
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (greenCredits >= ranks[i].threshold) {
      const nextRank = ranks[i + 1];
      return {
        current: ranks[i],
        next: nextRank,
        progress: nextRank ? ((greenCredits - ranks[i].threshold) / (nextRank.threshold - ranks[i].threshold)) * 100 : 100
      };
    }
  }
  
  return {
    current: ranks[0],
    next: ranks[1],
    progress: 0
  };
};

// Calculate distance between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Format distance for display
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Get greeting based on time
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// Convert string to title case
export const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

// Check if object is empty
export const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
};

// Get environmental impact message
export const getEnvironmentalImpact = (totalWaste, wasteType) => {
  const impacts = {
    plastic: {
      co2Saved: totalWaste * 1.8, // kg CO2 saved per kg plastic recycled
      message: 'plastic bottles diverted from oceans'
    },
    organic: {
      co2Saved: totalWaste * 0.5,
      message: 'kg of methane emissions prevented'
    },
    paper: {
      co2Saved: totalWaste * 3.3,
      message: 'trees saved from cutting'
    },
    metal: {
      co2Saved: totalWaste * 2.5,
      message: 'kg of ore mining prevented'
    },
    glass: {
      co2Saved: totalWaste * 0.8,
      message: 'kg of sand mining prevented'
    },
    electronic: {
      co2Saved: totalWaste * 4.2,
      message: 'kg of toxic waste prevented'
    }
  };
  
  return impacts[wasteType] || { co2Saved: totalWaste * 1.0, message: 'environmental impact' };
};

// Local storage helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting from localStorage:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// URL helpers
export const createSearchParams = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  return searchParams.toString();
};

// Image helpers
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Form validation helpers
export const validators = {
  required: (value) => {
    return value && value.toString().trim().length > 0;
  },
  
  minLength: (value, min) => {
    return value && value.toString().length >= min;
  },
  
  maxLength: (value, max) => {
    return !value || value.toString().length <= max;
  },
  
  email: (value) => {
    return !value || isValidEmail(value);
  },
  
  phone: (value) => {
    return !value || isValidPhoneNumber(value);
  },
  
  pincode: (value) => {
    return !value || isValidPincode(value);
  },
  
  number: (value) => {
    return !value || !isNaN(Number(value));
  },
  
  positive: (value) => {
    return !value || Number(value) > 0;
  }
};

// Error handling
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      message: data?.message || `Server error (${status})`,
      status,
      errors: data?.errors || []
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      errors: []
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      status: -1,
      errors: []
    };
  }
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  isValidEmail,
  isValidPhoneNumber,
  isValidPincode,
  formatPhoneNumber,
  generateId,
  debounce,
  throttle,
  deepClone,
  getWasteTypeColor,
  getWasteTypeIcon,
  calculateWastePoints,
  getUserRankInfo,
  calculateDistance,
  formatDistance,
  getGreeting,
  truncateText,
  toTitleCase,
  isEmpty,
  getEnvironmentalImpact,
  storage,
  createSearchParams,
  compressImage,
  validators,
  handleApiError
};
