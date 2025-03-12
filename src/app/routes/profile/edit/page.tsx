// Add dynamic export to ensure proper data fetching
export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/auth-utils";
import { ProfileForm } from "@/components/profile/profile-form";
import { StripeIdentityVerification } from "@/components/profile/stripe-identity-verification";
import { PhoneVerificationForm } from "@/components/profile/phone-verification-form";
import { db } from "@/lib/db";

export default async function EditProfilePage() {
  // Ensure user is authenticated
  const user = await requireAuth();
  
  // Get the user's ID verification status
  const userWithVerification = await db.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      idVerified: true,
      idVerificationStatus: true,
      idVerificationDate: true,
    },
  });
  
  if (!userWithVerification) {
    redirect("/routes/profile");
  }
  
  // Convert string date to Date object if it exists
  const idVerificationDate = userWithVerification.idVerificationDate 
    ? new Date(userWithVerification.idVerificationDate) 
    : null;
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>
      <ProfileForm user={user} />
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Phone Verification</h2>
        <PhoneVerificationForm user={user} />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">ID Verification</h2>
        <StripeIdentityVerification 
          user={{
            id: user.id,
            idVerified: userWithVerification.idVerified,
            idVerificationStatus: userWithVerification.idVerificationStatus,
            idVerificationDate: idVerificationDate,
          }} 
        />
      </div>
    </div>
  );
} 