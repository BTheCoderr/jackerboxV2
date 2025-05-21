"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const phoneSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
});

const emailSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;

// Test verification code for development
// const TEST_CODE = '212121';
// const TEST_PHONE = '+14013161280';

// Renamed component to reflect that it handles both email and phone
export function AuthForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('email'); // Default to email
  // Uncomment these states for phone auth
  const [verificationStep, setVerificationStep] = useState<'phone' | 'code'>('phone');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const router = useRouter();
  
  // Initialize the forms early
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Function to format phone number consistently
  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters except the plus sign
    let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure there's only one leading plus if present
    formatted = formatted.replace(/^\++/, '+');
    
    // If no plus sign at the beginning, assume US number and add +1
    if (!formatted.startsWith('+')) {
      // Only add +1 if it doesn't already start with 1
      if (!formatted.startsWith('1')) {
        formatted = `+1${formatted}`;
      } else {
        formatted = `+${formatted}`;
      }
    }
    
    return formatted;
  };
  
  // Uncomment and fix phone auth functions
  // Function to send SMS verification code
  const onPhoneSubmit = async (data: PhoneFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Format phone number
      const formattedPhoneNumber = formatPhoneNumber(data.phoneNumber);
      
      // Store the formatted phone number in the form
      phoneForm.setValue("phoneNumber", formattedPhoneNumber);
      
      console.log("Sending verification code to:", formattedPhoneNumber);
      
      // Temporary error message about SMS issues
      setError("SMS verification is currently experiencing technical difficulties. Please use email login instead.");
      setIsLoading(false);
      return;
      
      // The code below is temporarily disabled due to Twilio SMS configuration issues
      /*
      // Call our API to send verification code
      try {
        const response = await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber: formattedPhoneNumber }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          // Enhanced error handling with more detailed error message
          const errorMessage = result.error || result.message || 'Failed to send verification code';
          console.error("Verification code error:", errorMessage, result);
          
          // In development mode, we'll continue despite errors
          if (process.env.NODE_ENV === 'development') {
            console.log("Development mode: proceeding with test code despite API error");
            setVerificationStep('code');
            setSuccess(`Development mode: Use code 123456 for testing. (Error was: ${errorMessage})`);
            return; // Exit early after setting up dev mode
          }
          
          throw new Error(errorMessage);
        }
        
        // Move to verification code step
        setVerificationStep('code');
        
        // Special handling for development mode
        if (result.testMode) {
          setSuccess(`Development mode: Verification code is ${result.testCode}`);
        } else {
          setSuccess("Verification code sent! Check your phone.");
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        
        // For development mode, continue anyway with the test code
        if (process.env.NODE_ENV === 'development') {
          console.log("Development mode: proceeding with test code despite API error");
          setVerificationStep('code');
          setSuccess(`Development mode: Use code 123456 for testing`);
        } else {
          throw apiError; // Re-throw in production
        }
      }
      */
    } catch (error) {
      console.error("Error sending verification code:", error);
      setError(error instanceof Error ? error.message : "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to verify the SMS code
  const verifyCode = async () => {
    setError("SMS verification is currently experiencing technical difficulties. Please use email login instead.");
    return;
    
    /*
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const phoneNumber = phoneForm.getValues().phoneNumber;
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      
      console.log("Verifying code:", verificationCode, "for phone:", formattedPhoneNumber);
      
      // Call our API to verify the code
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: formattedPhoneNumber, 
          code: verificationCode 
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify code');
      }
      
      // Code verified, now sign in using NextAuth
      setSuccess("Phone verified! Signing you in...");
      
      const signInResult = await signIn("credentials", {
        phone: formattedPhoneNumber,
        type: "phone",
        redirect: false,
      });
      
      if (signInResult?.error) {
        throw new Error(`Authentication failed: ${signInResult.error}`);
      }
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push("/routes/dashboard");
        router.refresh();
      }, 500);
    } catch (error) {
      console.error("Verification error:", error);
      setError(error instanceof Error ? error.message : "Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
    */
  };
  
  // Function to handle email login
  const onEmailSubmit = async (data: EmailFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Attempting to sign in with:", data.email);
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      
      if (result?.error) {
        console.error("Login error:", result.error);
        
        // Set a more specific error message based on the error
        if (result.error.includes("Invalid credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (result.error.includes("Missing credentials")) {
          setError("Please enter both your email and password.");
        } else {
          setError(`Authentication failed: ${result.error}`);
        }
        return;
      }
      
      console.log("Login successful, redirecting...");
      
      // Add a small delay to ensure the session is updated
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 500);
    } catch (error) {
      console.error("Login exception:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle password visibility
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Commented out unused functions for phone auth (currently disabled)
  /*
  // Switch to email login mode
  const switchToEmailMode = () => {
    setLoginMode('email');
    setError(null);
  };
  
  // Use test phone number for development
  const useTestPhoneNumber = () => {
    phoneForm.setValue("phoneNumber", TEST_PHONE);
    setSuccess(`Test phone number set: ${TEST_PHONE}. Use verification code ${TEST_CODE} to sign in.`);
  };
  */
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
        
        {/* Toggle between email and phone */}
        <div className="flex mb-6 space-x-2">
          <button
            type="button"
            onClick={() => setLoginMode('email')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              loginMode === 'email'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('phone')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              loginMode === 'phone'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Phone
          </button>
        </div>
        
        {/* Alert for SMS issues */}
        {loginMode === 'phone' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  SMS verification is temporarily unavailable. Please use email login instead.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error and success messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Email login form */}
        {loginMode === 'email' && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                {...emailForm.register("email")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {emailForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...emailForm.register("password")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {emailForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.password.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? "Signing in..." : "Sign In with Email"}
            </button>
          </form>
        )}
        
        {/* Phone login form */}
        {loginMode === 'phone' && verificationStep === 'phone' && (
          <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}>
            <div className="mb-6">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+1 (555) 555-5555"
                disabled={isLoading}
                {...phoneForm.register("phoneNumber")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {phoneForm.formState.errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{phoneForm.formState.errors.phoneNumber.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}
        
        {loginMode === 'phone' && verificationStep === 'code' && (
          <div>
            <div className="mb-6">
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
            </div>
            
            <button
              onClick={verifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
            
            <button
              type="button"
              onClick={() => setVerificationStep('phone')}
              className="w-full mt-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Phone Number
            </button>
          </div>
        )}
        
        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        
        {/* Social logins */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="#4285F4"
              />
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="#4285F4"
              />
            </svg>
            Google
          </button>
          
          {/* Add other social logins here */}
        </div>
        
        {/* Sign up link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 