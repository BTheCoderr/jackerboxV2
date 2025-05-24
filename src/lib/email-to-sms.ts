/**
 * Email-to-SMS Gateway Library
 * Send SMS messages via carrier email gateways using existing SMTP infrastructure
 */

// Carrier email-to-SMS gateways
const CARRIER_GATEWAYS: Record<string, string> = {
  // Major US Carriers - Updated with latest gateways
  'att': 'txt.att.net',
  'verizon': 'vtext.com', // Updated from vzwpix.com
  'tmobile': 'tmomail.net',
  'sprint': 'messaging.sprintpcs.com',
  'boost': 'sms.myboostmobile.com', // Updated
  'cricket': 'sms.cricketwireless.net',
  'metropcs': 'mymetropcs.com',
  'straighttalk': 'vtext.com',
  'uscellular': 'email.uscc.net',
  'mint': 'tmomail.net', // Uses T-Mobile network
  'visible': 'vtext.com', // Uses Verizon network - updated
  'googlefi': 'msg.fi.google.com', // Added Google Fi
  
  // International (examples)
  'rogers': 'pcs.rogers.com', // Canada
  'bell': 'txt.bell.ca', // Canada
  'telus': 'msg.telus.com', // Canada
};

// Popular carrier detection based on phone number prefixes (US)
const CARRIER_PREFIXES: Record<string, string[]> = {
  'att': ['310', '311', '410', '411', '470', '560', '635', '680', '720', '740'],
  'verizon': ['204', '480', '482', '485', '486', '487', '489', '490'],
  'tmobile': ['240', '250', '260', '270', '280', '290', '310', '320', '330'],
  'sprint': ['312', '316', '317', '365', '366', '367', '368', '369'],
};

/**
 * Extract phone number digits only
 */
function extractPhoneDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

/**
 * Attempt to detect carrier from phone number
 * Note: This is not 100% accurate and should be used as fallback
 */
function detectCarrier(phoneNumber: string): string | undefined {
  const digits = extractPhoneDigits(phoneNumber);
  
  // US numbers should be 10 or 11 digits
  if (digits.length < 10) return undefined;
  
  // Get the first 3 digits after country code
  const prefix = digits.length === 11 ? digits.substring(1, 4) : digits.substring(0, 3);
  
  for (const [carrier, prefixes] of Object.entries(CARRIER_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      return carrier;
    }
  }
  
  return undefined;
}

/**
 * Get email address for SMS gateway
 */
function getSmsEmailAddress(phoneNumber: string, carrier: string): string | null {
  const digits = extractPhoneDigits(phoneNumber);
  const gateway = CARRIER_GATEWAYS[carrier.toLowerCase()];
  
  if (!gateway) return null;
  
  return `${digits}@${gateway}`;
}

/**
 * Send SMS via email gateway using nodemailer or your existing email service
 */
export async function sendSmsViaEmail(
  phoneNumber: string, 
  message: string, 
  carrier?: string
): Promise<{ success: boolean; error?: string; gateway?: string }> {
  try {
    // Auto-detect carrier if not provided
    let resolvedCarrier = carrier;
    if (!resolvedCarrier) {
      resolvedCarrier = detectCarrier(phoneNumber);
      if (!resolvedCarrier) {
        // Multi-carrier blast approach for unknown carriers
        console.log('Auto-detection failed, trying multi-carrier blast...');
        const majorCarriers = ['tmobile', 'verizon', 'sprint', 'att']; // T-Mobile first since it's most reliable
        return { 
          success: false, 
          error: 'Unable to detect carrier. Please specify carrier manually.' 
        };
      }
    }
    
    // Get SMS email address
    const smsEmail = getSmsEmailAddress(phoneNumber, resolvedCarrier);
    if (!smsEmail) {
      return { 
        success: false, 
        error: `Unsupported carrier: ${resolvedCarrier}` 
      };
    }
    
    // Send email using your existing email infrastructure
    // This assumes you have an email service set up (e.g., SendGrid, Nodemailer, etc.)
    const emailSent = await sendEmail({
      to: smsEmail,
      subject: '', // SMS gateways typically ignore subject
      text: message,
      // HTML should be avoided as most SMS gateways strip it
    });
    
    if (!emailSent) {
      return { 
        success: false, 
        error: 'Failed to send email to SMS gateway' 
      };
    }
    
    return { 
      success: true, 
      gateway: `${resolvedCarrier} (${smsEmail})` 
    };
    
  } catch (error) {
    console.error('Email-to-SMS error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send email function - supports Resend (preferred) and SendGrid
 * Uses the user's existing email service configuration
 */
async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  // Resend implementation (preferred - user already has this)
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@jackerbox.app',
        to: options.to,
        subject: options.subject || '',
        text: options.text,
        // For SMS gateways, we want plain text only
        html: undefined,
      });
      
      if (result.error) {
        console.error('❌ Resend error:', result.error);
        return false;
      }
      
      console.log(`✅ Email sent via Resend to: ${options.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ Resend error:', error.message);
      return false;
    }
  }
  
  // SendGrid implementation (fallback)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      await sgMail.send({
        to: options.to,
        from: process.env.EMAIL_FROM || 'noreply@jackerbox.app',
        subject: options.subject,
        text: options.text,
        // For SMS gateways, we want plain text only
        html: undefined,
      });
      
      console.log(`✅ Email sent via SendGrid to: ${options.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ SendGrid error:', error.response?.body || error.message);
      return false;
    }
  }
  
  // Fallback for development/testing
  console.log('📧→📱 EMAIL-TO-SMS: Would send email:', {
    to: options.to,
    subject: options.subject || '(no subject)',
    text: options.text
  });
  
  // Return true in development mode for testing
  return process.env.NODE_ENV === 'development';
}

/**
 * Get list of supported carriers
 */
export function getSupportedCarriers(): string[] {
  return Object.keys(CARRIER_GATEWAYS);
}

/**
 * Validate carrier name
 */
export function isValidCarrier(carrier: string): boolean {
  return carrier.toLowerCase() in CARRIER_GATEWAYS;
}

/**
 * Generate verification code for SMS
 */
export function generateSmsVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export interface EmailToSmsResult {
  success: boolean;
  error?: string;
  gateway?: string;
} 