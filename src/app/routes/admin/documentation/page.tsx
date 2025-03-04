import { getCurrentUser } from "@/lib/auth/auth-utils";
import Link from "next/link";

export default async function AdminDocumentationPage() {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    throw new Error("Unauthorized");
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Documentation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">User Management</h2>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Overview</h3>
              <p className="mb-4">
                The user management section allows you to view and manage all users on the platform.
                You can filter users by verification status, role, and search by name or email.
              </p>
              
              <h3 className="text-lg font-medium mb-4">Key Features</h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>View all users with pagination</li>
                <li>Filter users by verification status and role</li>
                <li>Search users by name or email</li>
                <li>View detailed user profiles</li>
                <li>Manually verify user IDs</li>
                <li>Grant or revoke admin privileges</li>
                <li>Delete user accounts</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-4">ID Verification</h3>
              <p className="mb-4">
                Users can verify their identity through Stripe Identity or be manually verified by an admin.
                The verification statuses are:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Verified:</strong> The user's identity has been confirmed</li>
                <li><strong>Pending:</strong> The verification is in progress</li>
                <li><strong>Requires Input:</strong> Additional information is needed from the user</li>
                <li><strong>Canceled:</strong> The verification was canceled</li>
                <li><strong>Not Verified:</strong> The user has not attempted verification</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Equipment Management</h2>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Overview</h3>
              <p className="mb-4">
                The equipment management section allows you to view, filter, and moderate all equipment listings on the platform.
                You can perform bulk actions and review individual listings.
              </p>
              
              <h3 className="text-lg font-medium mb-4">Content Moderation</h3>
              <p className="mb-4">
                All equipment listings go through a moderation process to ensure they meet platform standards.
                The moderation statuses are:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li><strong>Pending:</strong> The listing is awaiting review</li>
                <li><strong>Approved:</strong> The listing has been approved and is visible to users</li>
                <li><strong>Rejected:</strong> The listing has been rejected and is not visible to users</li>
                <li><strong>Flagged:</strong> The listing requires additional review</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-4">Bulk Actions</h3>
              <p className="mb-4">
                You can perform the following actions on multiple equipment listings at once:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Approve:</strong> Approve multiple listings</li>
                <li><strong>Reject:</strong> Reject multiple listings</li>
                <li><strong>Flag:</strong> Flag multiple listings for review</li>
                <li><strong>Delete:</strong> Delete multiple listings</li>
                <li><strong>Export:</strong> Export listing data to CSV</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Image Processing</h2>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Overview</h3>
              <p className="mb-4">
                The platform uses a sophisticated image processing pipeline that combines AWS S3, Amazon Rekognition, and Cloudinary.
              </p>
              
              <h3 className="text-lg font-medium mb-4">Pipeline Components</h3>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li><strong>AWS S3:</strong> Used for secure storage of original images</li>
                <li><strong>Amazon Rekognition:</strong> Used for content moderation, face comparison, and text detection</li>
                <li><strong>Cloudinary:</strong> Used for image optimization, transformation, and delivery</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-4">Automatic Moderation</h3>
              <p className="mb-4">
                Images are automatically checked for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Inappropriate content</li>
                <li>Image quality (brightness, sharpness, clarity)</li>
                <li>Whether it's a real photo (not a screenshot or digital creation)</li>
                <li>Text content (for ID verification)</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Quick Links</h2>
            </div>
            
            <div className="p-6">
              <ul className="space-y-2">
                <li>
                  <Link href="/routes/admin" className="text-jacker-blue hover:underline">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/routes/admin/users" className="text-jacker-blue hover:underline">
                    User Management
                  </Link>
                </li>
                <li>
                  <Link href="/routes/admin/equipment" className="text-jacker-blue hover:underline">
                    Equipment Management
                  </Link>
                </li>
                <li>
                  <Link href="/routes/admin/rentals" className="text-jacker-blue hover:underline">
                    Rental Management
                  </Link>
                </li>
                <li>
                  <Link href="/routes/admin/payments" className="text-jacker-blue hover:underline">
                    Payment Management
                  </Link>
                </li>
                <li>
                  <Link href="/routes/admin/reports" className="text-jacker-blue hover:underline">
                    Financial Reports
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Admin Tools</h2>
            </div>
            
            <div className="p-6">
              <ul className="space-y-4">
                <li>
                  <h3 className="font-medium">Create Admin User</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Run this command to create a new admin user:
                  </p>
                  <div className="bg-gray-100 p-2 rounded-md text-sm font-mono">
                    npm run create-admin your-email@example.com
                  </div>
                </li>
                <li>
                  <h3 className="font-medium">Test Image Processing</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Run this command to test the image processing pipeline:
                  </p>
                  <div className="bg-gray-100 p-2 rounded-md text-sm font-mono">
                    npm run test-image-processing
                  </div>
                </li>
                <li>
                  <h3 className="font-medium">Test ID Verification</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Run this command to test the ID verification process:
                  </p>
                  <div className="bg-gray-100 p-2 rounded-md text-sm font-mono">
                    npm run test-id-verification
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 