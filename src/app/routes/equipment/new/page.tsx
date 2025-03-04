import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, ExtendedUser } from "@/lib/auth/session";
import { EquipmentForm } from "@/components/equipment/equipment-form";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "List Your Equipment | Jackerbox",
  description: "List your equipment for rent and start earning",
};

export default async function ListEquipmentPage() {
  const user = await getCurrentUser();
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/auth/login?callbackUrl=/routes/equipment/new");
  }
  
  // Check if user's ID is verified
  const isIdVerified = user.idVerified === true;
  const isPending = user.idVerificationStatus === "pending";
  
  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">List Your Equipment</h1>
        <p className="text-gray-600 mb-8">
          Share your equipment with others and earn money when you're not using it.
        </p>
        
        {isIdVerified ? (
          <div className="bg-white rounded-lg shadow p-6">
            <EquipmentForm />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">
              {isPending ? "ID Verification Pending" : "ID Verification Required"}
            </h2>
            <p className="text-yellow-700 mb-4">
              {isPending 
                ? "Your ID verification is currently being processed. You'll be able to list equipment once your identity is verified."
                : "To ensure the safety and trust of our community, we require all users to verify their identity before listing equipment."}
            </p>
            {!isPending && (
              <Link 
                href="/routes/profile/edit" 
                className="inline-block py-2 px-4 bg-black text-white rounded-md hover:bg-opacity-80 transition-colors"
              >
                Verify Your Identity
              </Link>
            )}
          </div>
        )}
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Tips for a Great Listing</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">•</span>
              <span>
                <strong>High-quality photos:</strong> Take clear, well-lit photos from multiple angles.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">•</span>
              <span>
                <strong>Detailed description:</strong> Include specifications, condition, and any special features.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">•</span>
              <span>
                <strong>Fair pricing:</strong> Research similar items to set competitive rates.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">•</span>
              <span>
                <strong>Clear availability:</strong> Keep your calendar updated to avoid scheduling conflicts.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">•</span>
              <span>
                <strong>Responsive communication:</strong> Reply promptly to rental inquiries.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 