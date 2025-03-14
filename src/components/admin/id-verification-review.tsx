"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertTriangle, User } from "lucide-react";

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  documentType: string;
  submittedAt: Date;
  confidence: number;
}

export function IdVerificationReview() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  
  useEffect(() => {
    fetchVerificationRequests();
  }, []);
  
  const fetchVerificationRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/admin/id-verification-requests");
      
      if (!response.ok) {
        throw new Error("Failed to fetch verification requests");
      }
      
      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      setError("Failed to load verification requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/id-verification/${userId}/approve`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to approve verification");
      }
      
      // Remove the approved request from the list
      setRequests(requests.filter(req => req.userId !== userId));
      
      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error approving verification:", error);
      setError("Failed to approve verification. Please try again.");
    }
  };
  
  const handleReject = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/id-verification/${userId}/reject`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to reject verification");
      }
      
      // Remove the rejected request from the list
      setRequests(requests.filter(req => req.userId !== userId));
      
      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error rejecting verification:", error);
      setError("Failed to reject verification. Please try again.");
    }
  };
  
  const handleViewDetails = (requestId: string) => {
    setSelectedRequest(selectedRequest === requestId ? null : requestId);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={fetchVerificationRequests}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (requests.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No Pending Verification Requests</h3>
        <p className="text-gray-600 mt-1">
          All ID verification requests have been processed.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Pending ID Verification Requests
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Review and approve or reject user ID verification requests.
        </p>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {requests.map((request) => (
          <li key={request.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">
                      {request.userName ? request.userName.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    {request.userName || request.userEmail}
                  </h4>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(request.submittedAt).toLocaleDateString()} • 
                    </span>
                    <span className="ml-1 text-xs font-medium text-gray-500">
                      {request.documentType.replace('_', ' ')}
                    </span>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      {Math.round(request.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDetails(request.id)}
                  className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                  {selectedRequest === request.id ? "Hide Details" : "View Details"}
                </button>
                <button
                  onClick={() => handleApprove(request.userId)}
                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleReject(request.userId)}
                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {selectedRequest === request.id && (
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-900 mb-2">
                  Verification Details
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">User ID</p>
                    <p className="font-medium">{request.userId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Document Type</p>
                    <p className="font-medium capitalize">{request.documentType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Submitted</p>
                    <p className="font-medium">{new Date(request.submittedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Confidence Score</p>
                    <p className="font-medium">{Math.round(request.confidence * 100)}%</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => handleReject(request.userId)}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(request.userId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
} 