"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertTriangle, User, Search, Filter, Calendar, ArrowUpDown, Eye, EyeOff, Clock, FileText } from "lucide-react";

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  documentType: string;
  submittedAt: Date;
  confidence: number;
  documentImageUrl?: string;
  selfieImageUrl?: string;
  notes?: string;
}

type SortField = 'submittedAt' | 'confidence' | 'userName';
type SortOrder = 'asc' | 'desc';

export function IdVerificationReview() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VerificationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('submittedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showImages, setShowImages] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0
  });
  
  useEffect(() => {
    fetchVerificationRequests();
  }, []);
  
  useEffect(() => {
    // Apply filters and sorting
    let result = [...requests];
    
    // Apply document type filter
    if (documentTypeFilter !== 'all') {
      result = result.filter(req => req.documentType === documentTypeFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(req => 
        (req.userName?.toLowerCase().includes(query) || false) || 
        req.userEmail.toLowerCase().includes(query) ||
        req.userId.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'submittedAt') {
        comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      } else if (sortField === 'confidence') {
        comparison = a.confidence - b.confidence;
      } else if (sortField === 'userName') {
        const nameA = a.userName || a.userEmail;
        const nameB = b.userName || b.userEmail;
        comparison = nameA.localeCompare(nameB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredRequests(result);
  }, [requests, searchQuery, documentTypeFilter, sortField, sortOrder]);
  
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
      setStats(data.stats || {
        total: data.requests.length,
        approved: 0,
        rejected: 0,
        pending: data.requests.length
      });
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      setError("Failed to load verification requests. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApprove = async (userId: string) => {
    setProcessingRequest(userId);
    try {
      const response = await fetch(`/api/admin/id-verification/${userId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          notes: "Approved by admin"
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to approve verification");
      }
      
      // Remove the approved request from the list
      setRequests(requests.filter(req => req.userId !== userId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        approved: prev.approved + 1,
        pending: prev.pending - 1
      }));
      
      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error approving verification:", error);
      setError("Failed to approve verification. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };
  
  const handleReject = async (userId: string, reason: string = "Rejected by admin") => {
    setProcessingRequest(userId);
    try {
      const response = await fetch(`/api/admin/id-verification/${userId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to reject verification");
      }
      
      // Remove the rejected request from the list
      setRequests(requests.filter(req => req.userId !== userId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        rejected: prev.rejected + 1,
        pending: prev.pending - 1
      }));
      
      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error rejecting verification:", error);
      setError("Failed to reject verification. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };
  
  const handleViewDetails = (requestId: string) => {
    setSelectedRequest(selectedRequest === requestId ? null : requestId);
  };
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to descending
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    
    return sortOrder === 'asc' 
      ? <ArrowUpDown className="h-4 w-4 text-blue-600" /> 
      : <ArrowUpDown className="h-4 w-4 text-blue-600" />;
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
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-xs text-blue-600 font-medium">Total</p>
            <p className="text-lg font-semibold text-blue-800">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-xs text-green-600 font-medium">Approved</p>
            <p className="text-lg font-semibold text-green-800">{stats.approved}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-md">
            <p className="text-xs text-red-600 font-medium">Rejected</p>
            <p className="text-lg font-semibold text-red-800">{stats.rejected}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-xs text-yellow-600 font-medium">Pending</p>
            <p className="text-lg font-semibold text-yellow-800">{stats.pending}</p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-grow max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-500 mr-1" />
            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              className="block w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All document types</option>
              <option value="passport">Passport</option>
              <option value="driver_license">Driver's License</option>
              <option value="national_id">National ID</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowImages(!showImages)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showImages ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Images
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Images
              </>
            )}
          </button>
          
          <button
            onClick={fetchVerificationRequests}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Clock className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Table header */}
      <div className="hidden md:flex px-4 py-3 bg-gray-100 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="w-1/3 flex items-center cursor-pointer" onClick={() => handleSort('userName')}>
          User {getSortIcon('userName')}
        </div>
        <div className="w-1/6 flex items-center">
          Document Type
        </div>
        <div className="w-1/6 flex items-center cursor-pointer" onClick={() => handleSort('submittedAt')}>
          Date {getSortIcon('submittedAt')}
        </div>
        <div className="w-1/6 flex items-center cursor-pointer" onClick={() => handleSort('confidence')}>
          Confidence {getSortIcon('confidence')}
        </div>
        <div className="w-1/6 flex items-center justify-end">
          Actions
        </div>
      </div>
      
      {/* Requests list */}
      <ul className="divide-y divide-gray-200">
        {filteredRequests.length === 0 ? (
          <li className="px-4 py-6 text-center text-gray-500">
            No verification requests match your filters
          </li>
        ) : (
          filteredRequests.map((request) => (
            <li key={request.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="md:w-1/3 flex items-center">
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
                    <p className="text-xs text-gray-500 truncate">{request.userEmail}</p>
                  </div>
                </div>
                
                <div className="md:w-1/6 mt-2 md:mt-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <FileText className="h-3 w-3 mr-1" />
                    {request.documentType.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="md:w-1/6 mt-2 md:mt-0 text-xs text-gray-500">
                  {new Date(request.submittedAt).toLocaleDateString()} 
                  <span className="hidden md:inline"> • </span>
                  <br className="md:hidden" />
                  {new Date(request.submittedAt).toLocaleTimeString()}
                </div>
                
                <div className="md:w-1/6 mt-2 md:mt-0">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          request.confidence > 0.7 
                            ? 'bg-green-500' 
                            : request.confidence > 0.4 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.round(request.confidence * 100)}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs font-medium">
                      {Math.round(request.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="md:w-1/6 mt-3 md:mt-0 flex md:justify-end space-x-2">
                  <button
                    onClick={() => handleViewDetails(request.id)}
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                  >
                    {selectedRequest === request.id ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    onClick={() => handleApprove(request.userId)}
                    disabled={processingRequest === request.userId}
                    className={`px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md ${
                      processingRequest === request.userId 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-green-200'
                    }`}
                  >
                    {processingRequest === request.userId ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-3 w-3 mr-1 border-t-2 border-green-700 rounded-full"></span>
                        Processing
                      </span>
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(request.userId)}
                    disabled={processingRequest === request.userId}
                    className={`px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md ${
                      processingRequest === request.userId 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-red-200'
                    }`}
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
                  
                  {showImages && request.documentImageUrl && (
                    <div className="mt-3 mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">ID Document Image</p>
                      <div className="relative aspect-[3/2] max-w-md overflow-hidden rounded border border-gray-200">
                        <img 
                          src={request.documentImageUrl} 
                          alt="ID Document" 
                          className="object-contain w-full h-full"
                        />
                      </div>
                    </div>
                  )}
                  
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
                  
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Rejection Reason (optional)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Enter reason for rejection"
                      id={`rejection-reason-${request.id}`}
                    ></textarea>
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        const reasonEl = document.getElementById(`rejection-reason-${request.id}`) as HTMLTextAreaElement;
                        handleReject(request.userId, reasonEl?.value || "Rejected by admin");
                      }}
                      disabled={processingRequest === request.userId}
                      className={`px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md ${
                        processingRequest === request.userId 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-red-50'
                      }`}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(request.userId)}
                      disabled={processingRequest === request.userId}
                      className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md ${
                        processingRequest === request.userId 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-green-700'
                      }`}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
} 