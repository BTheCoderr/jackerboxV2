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
  // Commented out unused states for phone auth (currently disabled)
  // const [verificationStep, setVerificationStep] = useState<'phone' | 'code'>('phone');
  // const [verificationCode, setVerificationCode] = useState<string>('');
  const router = useRouter();
  
  // Initialize the forms early
  // const phoneForm = useForm<PhoneFormValues>({
  //   resolver: zodResolver(phoneSchema),
  //   defaultValues: {
  //     phoneNumber: "",
  //   },
  // });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Function to format phone number consistently
  // const formatPhoneNumber = (phoneNumber: string): string => {
  //   if (!phoneNumber) return '';
    
  //   // Remove all non-digit characters except the plus sign
  //   let formatted = phoneNumber.replace(/[^\d+]/g, '');
    
  //   // Ensure there's only one leading plus if present
  //   formatted = formatted.replace(/^\++/, '+');
    
  //   // If no plus sign at the beginning, assume US number and add +1
  //   if (!formatted.startsWith('+')) {
  //     // Only add +1 if it doesn't already start with 1
  //     if (!formatted.startsWith('1')) {
  //       formatted = `+1${formatted}`;
  //     } else {
  //       formatted = `+${formatted}`;
  //     }
  //   }
    
  //   return formatted;
  // };
  
  // Commented out unused functions for phone auth (currently disabled)
  /*
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
            setSuccess(`Development mode: Use code ${TEST_CODE} for testing. (Error was: ${errorMessage})`);
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
          setSuccess(`Development mode: Use code ${TEST_CODE} for testing`);
        } else {
          throw apiError; // Re-throw in production
        }
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      setError(error instanceof Error ? error.message : "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to verify the SMS code
  const verifyCode = async () => {
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
  };
  */
  
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
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
      <div className="flex justify-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
      </div>
      
      <div className="flex mb-4">
        <button 
          className={`flex-1 py-2 px-4 text-center ${loginMode === 'phone' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setLoginMode('phone')}
          disabled={true}
          title="Phone authentication temporarily disabled"
        >
          Phone
        </button>
        <button 
          className={`flex-1 py-2 px-4 text-center ${loginMode === 'email' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
          onClick={() => setLoginMode('email')}
        >
          Email
        </button>
      </div>

      {loginMode === 'phone' && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
          Phone authentication is temporarily disabled. Please use email login instead.
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-md text-sm">
          {success}
        </div>
      )}
        
      {loginMode === 'phone' ? (
        <div className="text-center p-4">
          <p className="mb-4">Phone authentication is temporarily disabled while we improve our SMS verification system.</p>
          <button
            onClick={() => setLoginMode('email')}
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
          >
            Use Email Login Instead
          </button>
        </div>
      ) : (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...emailForm.register("email")}
              className="w-full p-2 border rounded-md"
              disabled={isLoading}
              placeholder="Email address"
            />
            {emailForm.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...emailForm.register("password")}
                className="w-full p-2 border rounded-md pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            {emailForm.formState.errors.password && (
              <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-black text-white rounded-md hover:bg-opacity-80 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>
      )}
      
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      {/* Third party auth providers */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex items-center justify-center w-full py-2 px-4 border rounded-md hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
        
        <button
          type="button"
          className="flex items-center justify-center w-full py-2 px-4 border rounded-md hover:bg-gray-50 transition-colors opacity-60 cursor-not-allowed"
          disabled
          title="Apple Sign-In is coming soon"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
          </svg>
          Continue with Apple
        </button>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 