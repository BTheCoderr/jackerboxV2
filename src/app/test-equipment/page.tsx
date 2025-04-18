'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Equipment {
  id: string;
  title: string;
  description: string;
  category: string;
  pricePerDay?: number;
  dailyRate?: number;
  images?: string[];
  imagesJson?: string;
}

export default function TestEquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  
  // Fetch from our test endpoint
  useEffect(() => {
    async function fetchEquipment() {
      try {
        setStatus('loading');
        
        // First try the test endpoint
        const testResponse = await fetch('/api/equipment/test-endpoint');
        const testData = await testResponse.json();
        setRawResponse(JSON.stringify(testData, null, 2));
        
        // Check if we got equipment
        if (testData.equipment && Array.isArray(testData.equipment)) {
          setEquipment(testData.equipment);
          setStatus('success');
          return;
        }
        
        // If test endpoint didn't have equipment, try the main endpoint
        const mainResponse = await fetch('/api/equipment?nocache=true');
        const mainData = await mainResponse.json();
        
        // Update the raw response display
        setRawResponse(JSON.stringify(mainData, null, 2));
        
        if (mainData.equipment && Array.isArray(mainData.equipment)) {
          setEquipment(mainData.equipment);
          setStatus('success');
        } else if (Array.isArray(mainData)) {
          setEquipment(mainData);
          setStatus('success');
        } else {
          setErrorMessage('No equipment found in the API response');
          setStatus('error');
        }
      } catch (error) {
        console.error('Error fetching equipment:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
      }
    }
    
    fetchEquipment();
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Equipment API Test Page</h1>
      
      <div className="mb-8">
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <h2 className="text-xl font-semibold mb-2">API Status</h2>
          <p>Status: <span className={
            status === 'loading' ? 'text-blue-600' : 
            status === 'success' ? 'text-green-600' : 
            'text-red-600'
          }>
            {status}
          </span></p>
          {status === 'error' && <p className="text-red-600">Error: {errorMessage}</p>}
          {status === 'success' && <p>Found {equipment.length} equipment items</p>}
        </div>
        
        <div className="flex space-x-4 mb-6">
          <Link href="/routes/equipment" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Back to Equipment Page
          </Link>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Reload Test
          </button>
        </div>
      </div>
      
      {status === 'loading' && (
        <div className="text-center py-10">
          <p className="text-gray-600">Loading equipment data...</p>
        </div>
      )}
      
      {status === 'success' && equipment.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Equipment Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden shadow-sm">
                <div className="p-4">
                  <h3 className="text-lg font-medium mb-1">{item.title}</h3>
                  <p className="text-gray-700 text-sm mb-2">{item.category}</p>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                  <p className="font-semibold">
                    ${item.pricePerDay || item.dailyRate || 0}/day
                  </p>
                  
                  {/* If we have images, show the first one */}
                  {(item.images && item.images.length > 0) && (
                    <div className="mt-2">
                      <img 
                        src={item.images[0]} 
                        alt={item.title} 
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </div>
                  )}
                  
                  {/* If we don't have parsed images but have imagesJson, show that we need to parse */}
                  {(!item.images || item.images.length === 0) && item.imagesJson && (
                    <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">
                      Has image data that needs parsing
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {status === 'success' && equipment.length === 0 && (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold mb-2">No equipment found</h3>
          <p className="text-gray-600">The API returned successfully but no equipment data was found.</p>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Raw API Response</h2>
        <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
          {rawResponse || 'No data yet'}
        </pre>
      </div>
    </div>
  );
} 