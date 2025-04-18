'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Equipment {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  pricePerDay: number | null;
  images: string[];
}

export default function EquipmentTestPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add a cache-busting parameter
      const response = await fetch(`/api/equipment/test-endpoint?nocache=${Date.now()}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.status === 'success') {
        setEquipment(data.equipment || []);
        setCount(data.count || 0);
      } else {
        setError(data.message || 'Unknown error');
        setEquipment([]);
      }
    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment');
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Equipment Test Page</h1>
        <Button 
          onClick={fetchEquipment}
          variant="outline"
          className="flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Database Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Testing database connection...</p>
          ) : error ? (
            <div className="flex items-center text-red-500 gap-2">
              <AlertTriangle size={20} />
              <span>Error: {error}</span>
            </div>
          ) : (
            <p className="text-green-600">
              Connection successful! Found {count} equipment items in the database.
            </p>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <p className="text-xs text-gray-500">
            This page directly queries the database to verify data is accessible.
          </p>
        </CardFooter>
      </Card>

      {!loading && !error && equipment.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Sample Equipment Items:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="h-48 relative">
                  {item.images && item.images.length > 0 ? (
                    <Image
                      src={item.images[0]}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-2">{item.category} • {item.location}</p>
                  <p className="text-sm mb-2 line-clamp-2">{item.description}</p>
                  {item.pricePerDay && (
                    <p className="font-bold">${item.pricePerDay}/day</p>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Link href={`/routes/equipment/${item.id}`} className="w-full">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : !loading && !error ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Equipment Found</h2>
          <p className="text-gray-600 mb-6">
            Your database is connected but has no equipment records.
          </p>
          <div className="flex justify-center">
            <Link href="/routes/equipment/new">
              <Button>Create Equipment Listing</Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
} 