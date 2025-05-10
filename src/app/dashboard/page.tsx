"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';

// Mock data for development
const MOCK_LISTINGS = [
  {
    id: "mock-listing-1",
    title: "Professional DSLR Camera Kit",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
    status: "active",
    dailyRate: 120,
    totalEarnings: 1250,
    totalRentals: 8
  },
  {
    id: "mock-listing-2",
    title: "DJ Equipment Package",
    image: "https://images.unsplash.com/photo-1611425125524-b15a19feb9f7",
    status: "active",
    dailyRate: 250,
    totalEarnings: 2800,
    totalRentals: 12
  },
  {
    id: "mock-listing-3",
    title: "Mobile Recording Studio",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
    status: "pending",
    dailyRate: 125,
    totalEarnings: 0,
    totalRentals: 0
  },
];

const MOCK_RENTALS = [
  {
    id: "mock-rental-1",
    equipmentId: "clrkl6a9700016rhl7p0k7o6x",
    equipmentTitle: "Professional DSLR Camera Kit",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
    startDate: new Date("2023-10-15"),
    endDate: new Date("2023-10-18"),
    status: "completed",
    totalAmount: 360,
    ownerName: "Jane Smith"
  },
  {
    id: "mock-rental-2",
    equipmentId: "clrkl6a9700026rhl7p0k7o6y",
    equipmentTitle: "DJ Equipment Package",
    image: "https://images.unsplash.com/photo-1611425125524-b15a19feb9f7",
    startDate: new Date("2023-11-05"),
    endDate: new Date("2023-11-07"),
    status: "active",
    totalAmount: 500,
    ownerName: "John Doe"
  },
  {
    id: "mock-rental-3",
    equipmentId: "clrkl6a9700046rhl7p0k7o7a",
    equipmentTitle: "Professional Drone Package",
    image: "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9",
    startDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
    endDate: new Date(Date.now() + 86400000 * 8), // 8 days from now
    status: "upcoming",
    totalAmount: 450,
    ownerName: "Robert Johnson"
  }
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'rentals'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Please Sign In</h1>
        <p className="mb-8 text-lg text-gray-600">You need to be signed in to view your dashboard.</p>
        <Link href="/auth/login" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  // For development mode, we'll use mock data
  const userType = session?.user?.userType || 'both';
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.name || 'User'}</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/routes/equipment/new">
            <Button variant="default">List New Equipment</Button>
          </Link>
          <Link href="/routes/equipment">
            <Button variant="outline">Browse Equipment</Button>
          </Link>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-md ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          {(userType === 'owner' || userType === 'both') && (
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-4 px-1 border-b-2 font-medium text-md ${
                activeTab === 'listings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Listings
            </button>
          )}
          {(userType === 'renter' || userType === 'both') && (
            <button
              onClick={() => setActiveTab('rentals')}
              className={`py-4 px-1 border-b-2 font-medium text-md ${
                activeTab === 'rentals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Rentals
            </button>
          )}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium">Total Equipment</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">{MOCK_LISTINGS.length}</p>
                <div className="flex items-center mt-2">
                  <span className="text-green-500 text-sm font-medium">+33%</span>
                  <span className="text-gray-500 text-sm ml-2">from last month</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium">Active Rentals</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {MOCK_RENTALS.filter(rental => rental.status === 'active').length}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-green-500 text-sm font-medium">Current</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium">Total Earnings</h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(MOCK_LISTINGS.reduce((sum, listing) => sum + listing.totalEarnings, 0))}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-gray-500 text-sm">Lifetime earnings</span>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start p-3 bg-gray-50 rounded-md">
                  <div className="mr-4 mt-1 text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">New rental request</p>
                    <p className="text-sm text-gray-500">John Doe wants to rent your DJ Equipment Package</p>
                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start p-3 bg-gray-50 rounded-md">
                  <div className="mr-4 mt-1 text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Payment received</p>
                    <p className="text-sm text-gray-500">Payment of $360 for DSLR Camera Kit rental</p>
                    <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-start p-3 bg-gray-50 rounded-md">
                  <div className="mr-4 mt-1 text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Return reminder</p>
                    <p className="text-sm text-gray-500">Your DJ Equipment Package is due for return tomorrow</p>
                    <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">My Equipment Listings</h2>
              <Link href="/routes/equipment/new">
                <Button variant="default" size="sm">Add New Equipment</Button>
              </Link>
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              {MOCK_LISTINGS.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">You haven't listed any equipment yet.</p>
                  <Link href="/routes/equipment/new" className="mt-4 inline-block text-blue-500 underline">
                    List your first equipment
                  </Link>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earnings
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rentals
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {MOCK_LISTINGS.map((listing) => (
                      <tr key={listing.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 relative">
                              <Image
                                src={listing.image}
                                alt={listing.title}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            listing.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(listing.dailyRate)}/day
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(listing.totalEarnings)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {listing.totalRentals}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/routes/equipment/${listing.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                            View
                          </Link>
                          <Link href={`/routes/equipment/${listing.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'rentals' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">My Rentals</h2>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              {MOCK_RENTALS.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">You haven't rented any equipment yet.</p>
                  <Link href="/routes/equipment" className="mt-4 inline-block text-blue-500 underline">
                    Browse equipment
                  </Link>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {MOCK_RENTALS.map((rental) => (
                      <tr key={rental.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 relative">
                              <Image
                                src={rental.image}
                                alt={rental.equipmentTitle}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{rental.equipmentTitle}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rental.startDate.toLocaleDateString()} to {rental.endDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rental.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : rental.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {rental.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rental.ownerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(rental.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/routes/rentals/${rental.id}`} className="text-blue-600 hover:text-blue-900">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 