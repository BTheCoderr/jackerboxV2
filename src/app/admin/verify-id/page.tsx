import { Metadata } from 'next';
import SecureIdVerificationReview from '@/components/admin/SecureIdVerificationReview';
import { AdminAuthCheck } from '@/components/admin/AdminAuthCheck';

export const metadata: Metadata = {
  title: 'ID Verification Review | Admin Dashboard',
  description: 'Review and approve user ID verification requests',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyIdPage() {
  return (
    <AdminAuthCheck>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ID Verification Review</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <SecureIdVerificationReview />
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">ID Verification Security Information</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This verification system uses advanced security measures to protect sensitive user information:
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2 ml-4">
              <li>
                All ID documents are encrypted using AES-256 encryption before storage
              </li>
              <li>
                Documents are stored with dual-layer encryption (application-level and server-side)
              </li>
              <li>
                Access to ID documents is time-limited and logged for audit purposes
              </li>
              <li>
                All verification activities are monitored and logged securely
              </li>
              <li>
                AI-powered preprocessing helps detect potential issues with submitted IDs
              </li>
              <li>
                Rate limiting is applied to all verification endpoints to prevent abuse
              </li>
            </ul>
            
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4">
              <p className="text-sm text-yellow-800 font-medium">
                Security Reminder:
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Remember to protect user privacy by never storing, copying, or sharing ID documents outside of this secure system.
                All document accesses are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminAuthCheck>
  );
} 