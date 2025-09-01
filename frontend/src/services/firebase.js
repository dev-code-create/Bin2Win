import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

// Phone authentication class
export class PhoneAuthService {
  constructor() {
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
  }

  // Initialize reCAPTCHA verifier
  initializeRecaptcha(containerId = "recaptcha-container") {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }

    this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: (response) => {
        console.log("reCAPTCHA solved:", response);
      },
      "expired-callback": () => {
        console.log("reCAPTCHA expired");
        this.recaptchaVerifier?.clear();
        this.recaptchaVerifier = null;
      },
    });
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber) {
    try {
      if (!this.recaptchaVerifier) {
        this.initializeRecaptcha();
      }

      // Format phone number (ensure it starts with country code)
      const formattedPhoneNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+91${phoneNumber}`;

      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        this.recaptchaVerifier
      );

      console.log("OTP sent successfully");
    } catch (error) {
      console.error("Error sending OTP:", error);

      // Clear reCAPTCHA on error
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }

      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Verify OTP and sign in
  async verifyOTP(otp) {
    try {
      if (!this.confirmationResult) {
        throw new Error("No OTP request found. Please request OTP first.");
      }

      const userCredential = await this.confirmationResult.confirm(otp);
      const user = userCredential.user;

      // Create or update user profile
      await this.createOrUpdateUserProfile(user);

      return user;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Create or update user profile in Firestore
  async createOrUpdateUserProfile(user) {
    try {
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const userData = {
        phoneNumber: user.phoneNumber,
        lastLogin: serverTimestamp(),
        isActive: true,
      };

      if (userSnap.exists()) {
        // Update existing user
        await updateDoc(userRef, userData);
      } else {
        // Create new user
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          greenCredits: 0,
          totalWasteSubmitted: 0,
          name: "",
          email: "",
        });
      }
    } catch (error) {
      console.error("Error creating/updating user profile:", error);
    }
  }

  // Get error message for user display
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case "auth/invalid-phone-number":
        return "Invalid phone number format";
      case "auth/too-many-requests":
        return "Too many requests. Please try again later";
      case "auth/invalid-verification-code":
        return "Invalid OTP. Please check and try again";
      case "auth/code-expired":
        return "OTP has expired. Please request a new one";
      case "auth/missing-verification-code":
        return "Please enter the OTP";
      case "auth/quota-exceeded":
        return "SMS quota exceeded. Please try again later";
      default:
        return "Authentication failed. Please try again";
    }
  }

  // Clean up
  cleanup() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }
}

// User service for Firestore operations
export class UserService {
  // Get user profile
  static async getUserProfile(userId) {
    try {
      const userRef = doc(firestore, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { id: userId, ...userSnap.data() };
      }

      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  // Update user profile
  static async updateUserProfile(userId, data) {
    try {
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Log user activity
  static async logActivity(userId, activity, metadata) {
    try {
      const activityRef = collection(firestore, "user_activities");
      await addDoc(activityRef, {
        userId,
        activity,
        metadata: metadata || {},
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }
}

// File upload service
export class StorageService {
  // Upload waste submission photos
  static async uploadWastePhoto(file, submissionId) {
    try {
      const fileName = `waste_photos/${submissionId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading photo:", error);
      throw error;
    }
  }

  // Upload profile picture
  static async uploadProfilePicture(file, userId) {
    try {
      const fileName = `profile_pictures/${userId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  }
}

// Authentication state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Analytics logging
export const logEvent = (eventName, parameters) => {
  if (analytics) {
    // Import logEvent dynamically to avoid SSR issues
    import("firebase/analytics").then(({ logEvent }) => {
      logEvent(analytics, eventName, parameters);
    });
  }
};

// Error logging
export const logError = async (error, context) => {
  try {
    const errorRef = collection(firestore, "error_logs");
    await addDoc(errorRef, {
      message: error.message,
      stack: error.stack,
      context: context || "unknown",
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  } catch (logError) {
    console.error("Failed to log error:", logError);
  }
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

export default {
  PhoneAuthService,
  UserService,
  StorageService,
  onAuthStateChange,
  signOutUser,
  logEvent,
  logError,
  isFirebaseConfigured,
};
