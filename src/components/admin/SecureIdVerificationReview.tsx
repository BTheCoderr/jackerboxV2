'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { log } from '@/lib/monitoring';

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  type: string;
  status: string;
  documentId: string;
  confidenceScore: number;
  extractedText: string;
  notes: string;
  createdAt: string;
}

export default function SecureIdVerificationReview() {
  const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch pending verification requests
  useEffect(() => {
    async function fetchPendingRequests() {
      try {
        const response = await fetch('/api/admin/verification-requests?status=pending');
        if (!response.ok) {
          throw new Error('Failed to fetch verification requests');
        }
        const data = await response.json();
        setPendingRequests(data.requests);
      } catch (error) {
        log.error('Error fetching verification requests', { error });
        toast.error('Failed to load verification requests');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPendingRequests();
  }, []);

  // Fetch secure document URL when selecting a request
  async function handleSelectRequest(request: VerificationRequest) {
    setSelectedRequest(request);
    setReviewNotes('');
    setImageUrl(null);

    try {
      const response = await fetch(`/api/admin/secure-document-url?documentId=${request.documentId}`);
      if (!response.ok) {
        throw new Error('Failed to get document URL');
      }
      const data = await response.json();
      setImageUrl(data.url);
    } catch (error) {
      log.error('Error fetching document URL', { error, documentId: request.documentId });
      toast.error('Failed to load document image');
    }
  }

  // Handle approve or reject request
  async function handleUpdateStatus(approved: boolean) {
    if (!selectedRequest) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/users/verify-id-secure', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedRequest.userId,
          approved,
          notes: reviewNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }

      // Update local state
      setPendingRequests(pendingRequests.filter(req => req.id !== selectedRequest.id));
      setSelectedRequest(null);
      setImageUrl(null);
      setReviewNotes('');

      toast.success(`Verification ${approved ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      log.error('Error updating verification status', { 
        error, 
        userId: selectedRequest.userId,
        approved
      });
      toast.error('Failed to update verification status');
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading verification requests...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {/* Left column: Request list */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Pending Verification Requests ({pendingRequests.length})</h2>
        
        {pendingRequests.length === 0 ? (
          <p className="text-gray-500">No pending verification requests</p>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {pendingRequests.map(request => (
              <div 
                key={request.id} 
                className={`border rounded p-3 cursor-pointer hover:bg-gray-50 
                  ${selectedRequest?.id === request.id ? 'border-blue-500 bg-blue-50' : ''}`}
                onClick={() => handleSelectRequest(request)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{request.userName}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm">{request.type}</span>
                  <span className={`text-sm font-medium ${
                    request.confidenceScore >= 70 ? 'text-green-600' : 
                    request.confidenceScore >= 40 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    Confidence: {request.confidenceScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right column: Selected request details */}
      <div className="border rounded-lg p-4">
        {selectedRequest ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Review Verification</h2>
            
            <div className="space-y-2">
              <h3 className="font-medium">User: {selectedRequest.userName}</h3>
              <p className="text-sm">ID Type: {selectedRequest.type}</p>
              <p className="text-sm">Submitted: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
              <p className="text-sm">
                Confidence Score: 
                <span className={`ml-2 font-medium ${
                  selectedRequest.confidenceScore >= 70 ? 'text-green-600' : 
                  selectedRequest.confidenceScore >= 40 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {selectedRequest.confidenceScore}%
                </span>
              </p>
            </div>
            
            {imageUrl ? (
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="ID Document" 
                  className="w-full max-h-[300px] object-contain"
                />
              </div>
            ) : (
              <div className="border rounded flex items-center justify-center h-[200px]">
                Loading image...
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="font-medium">Extracted Text:</h3>
              <div className="border rounded p-3 text-sm bg-gray-50 max-h-[100px] overflow-y-auto">
                {selectedRequest.extractedText || 'No text extracted'}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">AI Notes:</h3>
              <div className="border rounded p-3 text-sm">
                {selectedRequest.notes || 'No notes available'}
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Review Notes:</h3>
              <textarea
                className="w-full border rounded p-2 text-sm"
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about this verification..."
              />
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                onClick={() => handleUpdateStatus(false)}
                disabled={isUpdating}
              >
                Reject
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleUpdateStatus(true)}
                disabled={isUpdating}
              >
                Approve
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a verification request to review
          </div>
        )}
      </div>
    </div>
  );
} 