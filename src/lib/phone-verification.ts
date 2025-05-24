import { Twilio } from 'twilio';
import { sendSmsViaEmail } from './email-to-sms';

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
 * Enhanced SMS sending with multi-carrier blast for higher reliability
 * @param phoneNumber The phone number to send the code to
 * @param message The message to send
 * @param carrier Optional specific carrier
 */
async function sendSMSReliably(
  phoneNumber: string, 
  message: string, 
  carrier?: string
): Promise<{ success: boolean; method?: string; gateway?: string }> {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // If specific carrier provided, use it
  if (carrier) {
    const result = await sendSmsViaEmail(formattedPhone, message, carrier);
    return {
      success: result.success,
      method: 'email-gateway',
      gateway: result.gateway
    };
  }
  
  // Try auto-detection first
  let result = await sendSmsViaEmail(formattedPhone, message);
  if (result.success) {
    return {
      success: true,
      method: 'email-gateway-auto',
      gateway: result.gateway
    };
  }
  
  // Multi-carrier blast approach for unknown carriers
  console.log('Auto-detection failed, trying multi-carrier blast...');
  const majorCarriers = ['tmobile', 'verizon', 'sprint', 'att']; // T-Mobile first - most reliable delivery
  
  // Add delay between requests to avoid rate limiting
  const results = [];
  for (const carrierName of majorCarriers) {
    try {
      const carrierResult = await sendSmsViaEmail(formattedPhone, message, carrierName);
      results.push({
        carrier: carrierName,
        success: carrierResult.success,
        gateway: carrierResult.gateway
      });
      
      // Add 1 second delay between requests to respect rate limits
      if (carrierName !== majorCarriers[majorCarriers.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      results.push({
        carrier: carrierName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  const successful = results.filter(r => r.success);
  
  if (successful.length > 0) {
    console.log(`✅ SMS sent via multi-carrier blast: ${successful.map(s => s.carrier).join(', ')}`);
    return {
      success: true,
      method: 'email-gateway-blast',
      gateway: successful.map(s => `${s.carrier} (${s.gateway})`).join(', ')
    };
  }
  
  console.log('❌ All carriers failed');
  return { success: false };
}

/**
 * Sends a verification code via SMS
 * Tries Twilio first, falls back to email-to-SMS gateway with multi-carrier support
 * @param phoneNumber The phone number to send the code to
 * @param code The verification code
 * @param carrier Optional carrier for email-to-SMS gateway
 */
export async function sendVerificationSMS(
  phoneNumber: string, 
  code: string, 
  carrier?: string
): Promise<boolean> {
  try {
    // Format phone number if needed
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const message = `Your Jackerbox verification code is: ${code}. It expires in 10 minutes.`;
    
    // Try Twilio first if configured
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        console.log('✅ SMS sent via Twilio successfully');
        return true;
      } catch (twilioError: any) {
        console.log('⚠️ Twilio SMS failed, trying email-to-SMS gateway...', twilioError.message);
        
        // Don't fallback for certain Twilio errors (like invalid phone numbers)
        if (twilioError.code === 21211 || twilioError.code === 21614) {
          console.error('❌ Invalid phone number format for Twilio:', twilioError.message);
          return false;
        }
      }
    } else {
      console.log('📧→📱 Twilio not configured, using email-to-SMS gateway...');
    }
    
    // Fallback to enhanced email-to-SMS gateway
    const emailSmsResult = await sendSMSReliably(formattedPhone, message, carrier);
    
    if (emailSmsResult.success) {
      console.log(`✅ SMS sent via ${emailSmsResult.method}: ${emailSmsResult.gateway}`);
      return true;
    } else {
      console.error('❌ All SMS methods failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error sending verification SMS:', error);
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
  method?: 'twilio' | 'email-gateway';
  gateway?: string;
} 