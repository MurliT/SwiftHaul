import { initializeApp } from "firebase/app";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

// Firebase Configuration (Replace these placeholder credentials with your Firebase console values)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure language to local (Hindi / English fallback)
auth.useDeviceLanguage();

/**
 * Initializes the Firebase RecaptchaVerifier on a specific HTML container.
 * @param {string} containerId - The HTML element ID (e.g., 'recaptcha-container' or the ID of the submit button).
 * @returns {RecaptchaVerifier} The RecaptchaVerifier instance.
 */
export const initializeRecaptcha = (containerId) => {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible", // 'invisible' is recommended for smooth B2B UX
    callback: (response) => {
      // reCAPTCHA solved - will proceed to send OTP automatically
      console.log("reCAPTCHA solved successfully");
    },
    "expired-callback": () => {
      // Response expired. Ask user to solve reCAPTCHA again.
      console.warn("reCAPTCHA expired. Resetting...");
    }
  });

  return window.recaptchaVerifier;
};

/**
 * Sends a 6-digit OTP code to the provided phone number.
 * @param {string} phone - Standardized phone number in E.164 format (e.g., '+919826012345').
 * @param {RecaptchaVerifier} appVerifier - The initialized RecaptchaVerifier instance.
 * @returns {Promise<ConfirmationResult>} A promise resolving to the Firebase ConfirmationResult object.
 */
export const sendSmsOtp = async (phone, appVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
    console.log("Firebase SMS OTP sent successfully to:", phone);
    return confirmationResult;
  } catch (error) {
    console.error("Firebase sendSmsOtp failed:", error);
    throw error;
  }
};
