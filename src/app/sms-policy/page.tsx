import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SMS Policy - Jackerbox',
  description: 'SMS opt-in policy and terms for Jackerbox verification messages',
};

export default function SMSPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            SMS Policy & Opt-In Terms
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              SMS Verification Service
            </h2>
            
            <p className="mb-6">
              Jackerbox uses SMS text messaging to deliver verification codes for account security 
              and authentication purposes. By providing your phone number and requesting a verification 
              code, you expressly consent to receive SMS messages from Jackerbox.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              What Messages You'll Receive
            </h3>
            <ul className="mb-6 list-disc pl-6">
              <li>Account verification codes (6-digit numbers)</li>
              <li>Two-factor authentication codes</li>
              <li>Security alerts for account access</li>
              <li>Password reset verification codes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Consent & Opt-In Process
            </h3>
            <p className="mb-4">
              <strong>Express Written Consent:</strong> When you enter your phone number in our 
              verification form and click "Send Code" or similar action, you are providing your 
              express written consent to receive SMS verification messages from Jackerbox.
            </p>
            <p className="mb-6">
              <strong>Frequency:</strong> You will only receive SMS messages when you specifically 
              request a verification code. We do not send marketing or promotional messages.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Message Frequency & Charges
            </h3>
            <ul className="mb-6 list-disc pl-6">
              <li>Message frequency depends on your usage (typically 1-5 messages per login session)</li>
              <li>Message and data rates may apply according to your cellular plan</li>
              <li>Jackerbox does not charge for SMS messages, but your carrier may</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              How to Stop Messages (Opt-Out)
            </h3>
            <p className="mb-4">
              You can stop receiving SMS verification codes at any time by:
            </p>
            <ul className="mb-6 list-disc pl-6">
              <li>Replying <strong>STOP</strong> to any verification message</li>
              <li>Contacting us at support@jackerbox.app</li>
              <li>Removing your phone number from your account settings</li>
            </ul>
            <p className="mb-6">
              <strong>Note:</strong> Opting out of SMS verification may limit your ability to access 
              certain security features of your Jackerbox account.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Privacy & Data Protection
            </h3>
            <p className="mb-6">
              Your phone number is used solely for sending verification codes and security notifications. 
              We do not share your phone number with third parties for marketing purposes. 
              For full details, see our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Supported Carriers
            </h3>
            <p className="mb-4">
              Our SMS service is available on most major US carriers including:
            </p>
            <ul className="mb-6 list-disc pl-6">
              <li>AT&T, Verizon, T-Mobile, Sprint</li>
              <li>Boost Mobile, Cricket, MetroPCS</li>
              <li>US Cellular, Google Fi, and others</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Technical Requirements
            </h3>
            <ul className="mb-6 list-disc pl-6">
              <li>SMS-capable mobile device required</li>
              <li>US phone numbers supported</li>
              <li>Standard messaging rates apply</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Contact Information
            </h3>
            <p className="mb-4">
              For questions about our SMS policy or to request removal from our messaging system:
            </p>
            <ul className="mb-6 list-disc pl-6">
              <li>Email: support@jackerbox.app</li>
              <li>Text: Reply STOP to any message</li>
              <li>Website: jackerbox.app/contact</li>
            </ul>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}<br/>
                <strong>Effective Date:</strong> {new Date().toLocaleDateString()}<br/>
                <strong>Company:</strong> Jackerbox<br/>
                <strong>Service Type:</strong> Account verification and security SMS messages
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 