import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth-utils";
import { ProfileForm } from "@/components/profile/profile-form";
import { StripeIdentityVerification } from "@/components/profile/stripe-identity-verification";
import { PhoneVerificationForm } from "@/components/profile/phone-verification-form";

export default async function EditProfilePage() {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>
      <ProfileForm user={user} />
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Identity Verification</h2>
        <StripeIdentityVerification user={user} />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Phone Verification</h2>
        <PhoneVerificationForm user={user} />
      </div>
    </div>
  );
} 