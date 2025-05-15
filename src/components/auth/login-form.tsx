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

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone');
  const router = useRouter();
  
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
  
  const onPhoneSubmit = async (data: PhoneFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Attempting to sign in with phone:", data.phoneNumber);
      // Here you would typically send a verification code
      // For now, we'll just show an alert
      alert(`Verification code sent to ${data.phoneNumber}`);
      
      // You would typically implement SMS verification code flow here
      
    } catch (error) {
      console.error("Phone login exception:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const switchToEmailMode = () => {
    setLoginMode('email');
    setError(null);
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Log in</h1>
      </div>
      
      {loginMode === 'phone' ? (
        <>
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="country-code" className="text-sm font-medium">
                Country code
              </label>
              <div className="relative rounded-md border">
                <button className="flex items-center w-full p-2 text-left">
                  <span>+1 United States</span>
                  <svg className="ml-auto h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  {...phoneForm.register("phoneNumber")}
                  className="w-full p-2 border rounded-md"
                  disabled={isLoading}
                  placeholder="Phone number"
                />
                {phoneForm.formState.errors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">{phoneForm.formState.errors.phoneNumber.message}</p>
                )}
              </div>
              
              <p className="text-sm text-gray-500">We'll text you a code to confirm your number.</p>
              
              <button
                type="submit"
                className="w-full py-2 px-4 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Continue"}
              </button>
            </form>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              type="button"
              onClick={switchToEmailMode}
              className="flex items-center justify-center w-full py-2 px-4 border rounded-md hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Continue with email
            </button>
            
            <button
              type="button"
              // Temporarily disabled
              // onClick={() => signIn("apple", { callbackUrl: "/" })}
              className="flex items-center justify-center w-full py-2 px-4 border rounded-md hover:bg-gray-50 transition-colors opacity-60 cursor-not-allowed"
              disabled
              title="Apple Sign-In is coming soon"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
              </svg>
              Continue with Apple
            </button>
            
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
          </div>
        </>
      ) : (
        // Email login form
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          
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
            className="w-full py-2 px-4 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
          
          <button
            type="button"
            onClick={() => setLoginMode('phone')}
            className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm"
          >
            Back to phone login
          </button>
        </form>
      )}
      
      <div className="text-center text-sm">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 