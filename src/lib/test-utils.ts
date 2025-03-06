/**
 * Testing utilities for development and testing environments
 */

/**
 * Determines if the application is in test mode
 * This allows bypassing certain security features during development
 */
export function isTestMode(): boolean {
  // Check for test mode environment variable
  return process.env.NODE_ENV !== 'production' || 
         process.env.NEXT_PUBLIC_TEST_MODE === 'true';
}

/**
 * Test phone numbers that will automatically pass verification
 * These are only valid in test mode
 */
export const TEST_PHONE_NUMBERS = [
  '+15555555555',  // Standard US test number
  '+12025550123',  // Washington DC area code
  '+13105550123',  // Los Angeles area code
  '+14155550123',  // San Francisco area code
  '+16465550123',  // New York area code
];

/**
 * Checks if a phone number is a test number
 * @param phoneNumber The phone number to check
 */
export function isTestPhoneNumber(phoneNumber: string): boolean {
  if (!isTestMode()) return false;
  
  // Normalize the phone number for comparison
  const normalizedPhone = phoneNumber.replace(/\D/g, '');
  
  return TEST_PHONE_NUMBERS.some(testNumber => {
    const normalizedTest = testNumber.replace(/\D/g, '');
    return normalizedPhone === normalizedTest || 
           normalizedPhone === normalizedTest.substring(1); // Handle with or without country code
  });
}

/**
 * Default test verification code that will always work for test phone numbers
 */
export const TEST_VERIFICATION_CODE = '123456';

/**
 * Checks if a verification code is the test code
 * @param code The verification code to check
 */
export function isTestVerificationCode(code: string): boolean {
  return isTestMode() && code === TEST_VERIFICATION_CODE;
} 