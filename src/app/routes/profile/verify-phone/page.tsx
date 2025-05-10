"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CSRFTokenInput, useCSRFToken } from "@/components/CSRFTokenProvider";
import { apiClient } from "@/lib/utils/api-client";

// Firebase imports
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Define the form schema
const phoneVerificationSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number"),
  verificationCode: z.string().min(6, "Verification code must be at least 6 characters").optional(),
});

type PhoneVerificationFormValues = z.infer<typeof phoneVerificationSchema>;

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export default function VerifyPhonePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { csrfToken } = useCSRFToken();

  // Initialize Firebase app
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

  useEffect(() => {
    try {
      // Initialize Firebase only on client side
      const app = initializeApp(firebaseConfig);
      setFirebaseApp(app);
      setAuth(getAuth(app));
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setError("Failed to initialize verification service");
    }
  }, []);

  useEffect(() => {
    // Countdown timer for resending code
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PhoneVerificationFormValues>({
    resolver: zodResolver(phoneVerificationSchema),
    defaultValues: {
      phone: session?.user?.phone || "",
      verificationCode: "",
    },
  });

  const setupRecaptcha = () => {
    if (!auth || recaptchaVerifier) return;

    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal',
        'callback': () => {
          // reCAPTCHA solved, allow sending verification code
        },
        'expired-callback': () => {
          // Reset reCAPTCHA
          setRecaptchaVerifier(null);
          toast.error("reCAPTCHA expired. Please try again.");
        }
      });
      setRecaptchaVerifier(verifier);
    } catch (error) {
      console.error("Error setting up reCAPTCHA:", error);
      setError("Failed to set up verification. Please try again later.");
    }
  };

  const sendVerificationCode = async (phone: string) => {
    if (!auth || !recaptchaVerifier) {
      setError("Verification service not initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send verification code via Firebase
      const confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      setVerificationId(confirmationResult.verificationId);
      setCodeSent(true);
      setCountdown(60); // 60 seconds countdown for resend
      toast.success("Verification code sent to your phone");
    } catch (error) {
      console.error("Error sending verification code:", error);
      setError("Failed to send verification code. Please try again.");
      // Reset reCAPTCHA
      setRecaptchaVerifier(null);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    if (!verificationId) {
      setError("Verification ID not found");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify the code with our backend
      await apiClient.post("/api/users/verify-phone", {
        verificationId,
        code,
        phone: watch("phone"),
      });

      toast.success("Phone number verified successfully");
      
      // Update session
      await update();
      
      // Redirect to profile page
      router.push("/routes/profile");
    } catch (error) {
      console.error("Error verifying code:", error);
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: PhoneVerificationFormValues) => {
    if (!codeSent) {
      // Send verification code
      await sendVerificationCode(data.phone);
    } else if (data.verificationCode) {
      // Verify the code
      await verifyCode(data.verificationCode);
    }
  };

  useEffect(() => {
    if (!codeSent) {
      setupRecaptcha();
    }
  }, [codeSent, auth]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg border shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Verify Your Phone Number</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <CSRFTokenInput />
          <input type="hidden" name="_csrf" value={csrfToken} />
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-black"
              placeholder="+1 (555) 123-4567"
              disabled={codeSent}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
          
          {!codeSent && (
            <div id="recaptcha-container" className="flex justify-center my-4"></div>
          )}
          
          {codeSent && (
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                {...register("verificationCode")}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Enter the 6-digit code"
              />
              {errors.verificationCode && (
                <p className="mt-1 text-sm text-red-600">{errors.verificationCode.message}</p>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => router.push("/routes/profile")}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {codeSent && countdown > 0 ? (
              <div className="text-sm text-gray-500">
                Resend code in {countdown}s
              </div>
            ) : codeSent ? (
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setRecaptchaVerifier(null);
                  setupRecaptcha();
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Resend Code
              </button>
            ) : null}
            
            <button
              type="submit"
              disabled={isLoading || (codeSent && !watch("verificationCode"))}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-opacity-80 disabled:opacity-50"
            >
              {isLoading
                ? "Processing..."
                : codeSent
                ? "Verify Code"
                : "Send Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
