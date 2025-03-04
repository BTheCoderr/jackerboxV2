"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  validatePhoneNumber, 
  createRecaptchaVerifier, 
  sendVerificationCode, 
  verifyCode 
} from "@/lib/firebase-auth";

interface PhoneVerificationFormProps {
  user: {
    id: string;
    phone: string | null;
    phoneVerified: boolean;
  };
  onVerificationComplete?: () => void;
}

export function PhoneVerificationForm({ user, onVerificationComplete }: PhoneVerificationFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(user.phone || "");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<any>(null);
  
  useEffect(() => {
    // Clean up recaptcha when component unmounts
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    };
  }, []);
  
  const initializeRecaptcha = () => {
    if (!recaptchaContainerRef.current) return;
    
    try {
      recaptchaVerifierRef.current = createRecaptchaVerifier('recaptcha-container');
      recaptchaVerifierRef.current.render();
    } catch (error) {
      console.error('Error initializing recaptcha:', error);
      setError('Failed to initialize verification. Please try again.');
    }
  };
  
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validatePhoneNumber(phone)) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Initialize recaptcha if not already initialized
      if (!recaptchaVerifierRef.current) {
        initializeRecaptcha();
      }
      
      // Send verification code
      const result = await sendVerificationCode(phone, recaptchaVerifierRef.current);
      
      if (result.success) {
        setCodeSent(true);
        setConfirmationResult(result.confirmationResult);
        setSuccess('Verification code sent successfully');
        
        // Update user's phone number in the database
        await fetch('/api/users/update-phone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone }),
        });
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!verificationCode || verificationCode.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Verify the code
      const result = await verifyCode(confirmationResult, verificationCode);
      
      if (result.success) {
        // Update user's phone verification status in the database
        const response = await fetch('/api/users/verify-phone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone }),
        });
        
        if (response.ok) {
          setSuccess('Phone number verified successfully');
          
          // Call the callback if provided
          if (onVerificationComplete) {
            onVerificationComplete();
          }
          
          // Refresh the page to update the UI
          router.refresh();
        } else {
          setError('Failed to update verification status. Please try again.');
        }
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // If phone is already verified, show success message
  if (user.phoneVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h3 className="text-lg font-medium text-green-800">Phone Verified</h3>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Your phone number ({user.phone}) has been verified.
        </p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Verify Your Phone Number</h2>
      <p className="text-gray-600 mb-4">
        Verifying your phone number helps secure your account and enables important notifications.
      </p>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 text-green-600 rounded-md text-sm mb-4">
          {success}
        </div>
      )}
      
      {!codeSent ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Enter your phone number with country code (e.g., +1 for US)
            </p>
          </div>
          
          <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
          
          <Button
            type="submit"
            disabled={isLoading || !phone}
            className="w-full bg-black hover:bg-gray-800 text-white"
          >
            {isLoading ? "Sending..." : "Send Verification Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="verificationCode" className="text-sm font-medium">
              Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Enter the 6-digit code sent to your phone
            </p>
          </div>
          
          <div className="flex space-x-4">
            <Button
              type="button"
              onClick={() => setCodeSent(false)}
              disabled={isLoading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Back
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading || verificationCode.length < 6}
              className="flex-1 bg-black hover:bg-gray-800 text-white"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 