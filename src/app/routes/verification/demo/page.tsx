'use client';

import { useState } from 'react';
import { BasicIdVerificationForm } from '@/components/profile/basic-id-verification-form';
import { IdVerificationReview } from '@/components/admin/id-verification-review';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IdVerificationDemoPage() {
  const [activeTab, setActiveTab] = useState('user');
  
  // Mock user data for the demo
  const mockUser = {
    id: 'demo-user-123',
    idVerified: false,
    idVerificationStatus: null,
    idDocumentType: null,
    idVerificationDate: null,
  };
  
  // Mock user with pending verification
  const mockPendingUser = {
    id: 'demo-user-456',
    idVerified: false,
    idVerificationStatus: 'pending',
    idDocumentType: 'passport',
    idVerificationDate: new Date(),
  };
  
  // Mock verified user
  const mockVerifiedUser = {
    id: 'demo-user-789',
    idVerified: true,
    idVerificationStatus: 'approved',
    idDocumentType: 'driver_license',
    idVerificationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">ID Verification System Demo</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Free ID Verification System</CardTitle>
          <CardDescription>
            A cost-effective solution for verifying user identities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Basic OCR verification using Tesseract.js (no external API costs)</li>
            <li>Document type detection (passport, driver's license, national ID)</li>
            <li>Confidence scoring to determine verification status</li>
            <li>Admin review interface for manual verification</li>
            <li>User-friendly upload interface with preview</li>
            <li>Status tracking and notifications</li>
          </ul>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="user">User View</TabsTrigger>
          <TabsTrigger value="pending">Pending Status</TabsTrigger>
          <TabsTrigger value="verified">Verified Status</TabsTrigger>
          <TabsTrigger value="admin">Admin Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="user">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">User Verification Form</h2>
            <p className="text-gray-600 mb-6">
              This form allows users to upload their ID documents for verification. The system will 
              analyze the document using OCR and determine if it can be automatically verified or 
              needs manual review.
            </p>
            
            <BasicIdVerificationForm user={mockUser} />
          </div>
        </TabsContent>
        
        <TabsContent value="pending">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Pending Verification Status</h2>
            <p className="text-gray-600 mb-6">
              After a user submits their ID, they may see this pending status while waiting for 
              admin review. This happens when the automatic verification couldn't confidently 
              verify the document.
            </p>
            
            <BasicIdVerificationForm user={mockPendingUser} />
          </div>
        </TabsContent>
        
        <TabsContent value="verified">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Verified Status</h2>
            <p className="text-gray-600 mb-6">
              Once a user's ID is verified, either automatically or through admin review, they 
              will see this confirmation. Verified users can access all platform features that 
              require identity verification.
            </p>
            
            <BasicIdVerificationForm user={mockVerifiedUser} />
          </div>
        </TabsContent>
        
        <TabsContent value="admin">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Admin Review Interface</h2>
            <p className="text-gray-600 mb-6">
              Administrators use this interface to review ID verification requests that couldn't 
              be automatically verified. They can view details and approve or reject each request.
            </p>
            
            <IdVerificationReview />
          </div>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">How It Works</h3>
              <p className="text-sm text-gray-600 mt-1">
                The system uses Tesseract.js for Optical Character Recognition (OCR) to extract text 
                from ID documents. It then analyzes the text to identify document types, numbers, and 
                other key information. Based on the confidence score, it either automatically verifies 
                the ID or flags it for manual review.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Security Considerations</h3>
              <p className="text-sm text-gray-600 mt-1">
                In a production environment, ID documents should be stored securely with encryption 
                and access controls. The demo implementation focuses on the verification workflow 
                rather than secure storage. For a full deployment, consider using secure cloud storage 
                with proper access restrictions.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">Future Enhancements</h3>
              <p className="text-sm text-gray-600 mt-1">
                The system could be enhanced with face matching (comparing the ID photo to a selfie), 
                document tampering detection, and integration with external verification services for 
                higher-risk transactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 