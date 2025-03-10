// Import Firebase modules
// @ts-ignore - Ignore TypeScript errors for Firebase imports
import { initializeApp } from 'firebase/app';
// @ts-ignore - Ignore TypeScript errors for Firebase imports
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  PhoneAuthProvider 
} from 'firebase/auth';
import { isTestMode, isTestPhoneNumber, TEST_VERIFICATION_CODE } from './test-utils';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

/**
 * Validates a phone number format
 * @param phoneNumber The phone number to validate
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // For test phone numbers, always return true
  if (isTestMode() && isTestPhoneNumber(phoneNumber)) {
    return true;
  }
  
  // Basic validation - can be enhanced with more sophisticated regex
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
}

/**
 * Formats a phone number to E.164 format
 * @param phoneNumber The phone number to format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Add + prefix if not present
  if (!digitsOnly.startsWith('+')) {
    // Assume US number if no country code
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    }
    return `+${digitsOnly}`;
  }
  
  return phoneNumber;
}

/**
 * Creates a RecaptchaVerifier instance
 * @param containerId The ID of the container element for the reCAPTCHA
 */
export function createRecaptchaVerifier(containerId: string) {
  if (!auth) {
    console.error('Firebase auth not initialized');
    return null;
  }
  
  try {
    return new RecaptchaVerifier(auth, containerId, {
      'size': 'normal',
      'callback': () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
      }
    });
  } catch (error) {
    console.error('Error creating RecaptchaVerifier:', error);
    return null;
  }
}

/**
 * Sends a verification code to the specified phone number
 * @param phoneNumber The phone number to send the code to
 * @param recaptchaVerifier The RecaptchaVerifier instance
 */
export async function sendVerificationCode(
  phoneNumber: string, 
  recaptchaVerifier: any
) {
  // For test phone numbers, bypass Firebase
  if (isTestMode() && isTestPhoneNumber(phoneNumber)) {
    console.log(`TEST MODE: Verification code for ${phoneNumber} is ${TEST_VERIFICATION_CODE}`);
    return { 
      success: true, 
      testMode: true,
      confirmationResult: {
        confirm: (code: string) => {
          return Promise.resolve({ 
            success: code === TEST_VERIFICATION_CODE,
            user: { phoneNumber }
          });
        }
      }
    };
  }
  
  if (!auth) {
    console.error('Firebase auth not initialized');
    return { success: false, error: 'Firebase auth not initialized' };
  }
  
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, error };
  }
}

/**
 * Verifies the code entered by the user
 * @param confirmationResult The confirmation result from sendVerificationCode
 * @param verificationCode The code entered by the user
 */
export async function verifyCode(confirmationResult: any, verificationCode: string) {
  if (!confirmationResult) {
    return { success: false, error: 'No confirmation result available' };
  }
  
  try {
    const result = await confirmationResult.confirm(verificationCode);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { success: false, error };
  }
}

export interface PhoneVerificationResult {
  success: boolean;
  message: string;
  user?: any;
  error?: any;
  testMode?: boolean;
} 