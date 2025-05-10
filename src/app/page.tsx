"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { fetchWithRetry } from "@/lib/utils/fetch-with-retry";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Equipment {
  id: string;
  title: string;
  description: string;
  condition: string;
  location: string;
  hourlyRate: number | null;
  dailyRate: number | null;
  weeklyRate: number | null;
  isVerified: boolean;
  images?: string[];
  imagesJson?: string;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface EquipmentWithOwner extends Equipment {
  owner?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export default function HomePage() {
  const { data: session } = useSession();
  const [featuredEquipment, setFeaturedEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({});
  const [equipment, setEquipment] = useState<EquipmentWithOwner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const fetchFeaturedEquipment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use fetchWithRetry instead of regular fetch
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/equipment?limit=6`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        maxRetries: 2, // Try up to 3 times total (initial + 2 retries)
        retryDelay: 800 // Start with 800ms delay, then increase by backoffFactor
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeaturedEquipment(data.equipment || []);
      } else {
        console.error("Error fetching equipment:", response.statusText);
        setError(`Failed to load equipment: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching featured equipment:", error);
      setError(`Failed to load equipment: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchFeaturedEquipment();
  }, [fetchFeaturedEquipment]);
  
  // Handle image load errors
  const handleImageError = (id: string) => {
    setImageLoadError(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // Helper function to get placeholder image
  const getPlaceholderImage = () => {
    return 'https://res.cloudinary.com/dgtqpyphg/image/upload/c_scale,w_400,h_300/e_blur:1000,q_1,f_auto/sample';
  };

  // Get equipment image source with fallback
  const getEquipmentImageSrc = (equipment: Equipment, index: number = 0) => {
    // If image already failed to load, use fallback
    if (imageLoadError[equipment.id]) {
      return getPlaceholderImage();
    }
    
    // Try to get image from images array
    if (equipment.images && equipment.images.length > 0) {
      return equipment.images[0];
    }
    
    // Try to parse imagesJson
    if (equipment.imagesJson) {
      try {
        const images = JSON.parse(equipment.imagesJson);
        if (images && images.length > 0) {
          return images[0];
        }
      } catch (e) {
        console.error("Error parsing imagesJson", e);
      }
    }
    
    // Fallback to numbered placeholder based on ID
    return getPlaceholderImage();
  };
  
  // Get a subset of categories for the homepage
  // Make sure EQUIPMENT_CATEGORIES is treated as an array
  const featuredCategories = Array.isArray(EQUIPMENT_CATEGORIES) 
    ? EQUIPMENT_CATEGORIES.slice(0, 6) 
    : (typeof EQUIPMENT_CATEGORIES === 'object' 
        ? Object.values(EQUIPMENT_CATEGORIES).slice(0, 6) as string[]
        : ["Construction Tools", "Power Tools", "Hand Tools", "Gardening & Landscaping", "Photography & Video", "Audio Equipment"]);
  
  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const data = await response.json();
      setEquipment(data);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment');
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      item.title.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(equipment.map(item => item.title))];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 mt-4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </Card>
          ))}
                    </div>
                      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search Equipment</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="w-full md:w-64">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="aspect-video relative mb-4">
              {item.images && item.images.length > 0 ? (
                <Image
                  src={item.images[0]}
                  alt={item.title}
                  fill
                  className="object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-4">{item.description}</p>
            
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{item.title}</Badge>
              <Badge variant={item.condition === 'AVAILABLE' ? 'success' : 'destructive'}>
                {item.condition}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={item.owner?.image || '/default-avatar.png'} />
                  <AvatarFallback>{item.owner?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{item.owner?.name || 'Unknown Owner'}</p>
                  <p className="text-xs text-gray-500">{item.owner?.email || 'No email'}</p>
                </div>
              </div>
              
              <Link href={`/routes/equipment/${item.id}`}>
                <Button variant="outline">View Details</Button>
                  </Link>
            </div>
          </Card>
        ))}
          </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No equipment found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
