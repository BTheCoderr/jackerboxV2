import { Twilio } from 'twilio';

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  : null;

const VERIFICATION_CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Generates a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends a verification code via SMS
 * @param phoneNumber The phone number to send the code to
 * @param code The verification code
 */
export async function sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
  try {
    if (!twilioClient) {
      console.error('Twilio client not initialized. Check environment variables.');
      return false;
    }
    
    // Format phone number if needed
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Send SMS via Twilio
    await twilioClient.messages.create({
      body: `Your Jackerbox verification code is: ${code}. It expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });
    
    return true;
  } catch (error) {
    console.error('Error sending verification SMS:', error);
    return false;
  }
}

/**
 * Formats a phone number to E.164 format for Twilio
 * @param phoneNumber The phone number to format
 */
function formatPhoneNumber(phoneNumber: string): string {
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
 * Validates a phone number format
 * @param phoneNumber The phone number to validate
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Basic validation - can be enhanced with more sophisticated regex
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
}

export interface PhoneVerificationResult {
  success: boolean;
  message: string;
} 