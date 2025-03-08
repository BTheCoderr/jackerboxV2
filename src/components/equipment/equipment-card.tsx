"use client";

import { Equipment, User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { useState, useEffect } from "react";

interface EquipmentCardProps {
  equipment: Equipment & {
    owner: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // Process image URL to ensure it works correctly
  const processImageUrl = (url: string): string => {
    if (!url) return '/images/placeholder.svg';
    
    // If it's an Unsplash URL, ensure it has the right parameters
    if (url.includes('unsplash.com')) {
      // Add direct access parameters for Unsplash
      const baseUrl = url.split('?')[0]; // Remove any existing parameters
      return `${baseUrl}?fit=crop&w=800&h=600&q=80&auto=format`;
    }
    
    // If it's a Cloudinary URL, ensure it has the right parameters
    if (url.includes('cloudinary.com')) {
      // Keep Cloudinary URLs as they are, they should be properly formatted
      return url;
    }
    
    return url;
  };
  
  // Generate a fallback image URL based on the equipment title and category
  const getFallbackImageUrl = () => {
    const category = equipment.category.toLowerCase().replace(/\s+/g, '-');
    const title = equipment.title.toLowerCase().replace(/\s+/g, '-');
    const uniqueParam = `random=${Date.now()}-${equipment.id.substring(0, 8)}`;
    return `https://source.unsplash.com/featured/800x600?${category},${title}&${uniqueParam}`;
  };
  
  useEffect(() => {
    try {
      // Parse the images JSON
      const images = JSON.parse(equipment.imagesJson || '[]');
      
      // Use the first image if available, otherwise use a fallback
      if (images && images.length > 0 && images[0]) {
        setImageUrl(processImageUrl(images[0]));
      } else {
        setImageUrl(getFallbackImageUrl());
      }
    } catch (error) {
      console.error('Error parsing equipment images:', error);
      setImageUrl(getFallbackImageUrl());
    }
  }, [equipment.imagesJson]);
  
  return (
    <Link
      href={`/routes/equipment/${equipment.id}`}
      className="block h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative h-48 bg-gray-100">
        <img
          src={imageError ? getFallbackImageUrl() : imageUrl}
          alt={equipment.title}
          className="w-full h-full object-cover"
          onError={() => {
            setImageError(true);
            setImageUrl(getFallbackImageUrl());
          }}
        />
        {equipment.isVerified && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Verified
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg truncate text-jacker-blue">{equipment.title}</h3>
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
            equipment.condition === 'Like New' ? 'bg-green-100 text-green-800' :
            equipment.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
            equipment.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {equipment.condition}
          </span>
        </div>
        
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{equipment.description}</p>
        
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{equipment.location}</span>
        </div>
        
        <div className="mt-4 flex justify-between items-end">
          <div>
            {equipment.dailyRate && (
              <p className="font-bold text-lg text-jacker-orange">
                {formatCurrency(equipment.dailyRate)}<span className="text-sm font-normal text-gray-600">/day</span>
              </p>
            )}
            {!equipment.dailyRate && equipment.hourlyRate && (
              <p className="font-bold text-lg text-jacker-orange">
                {formatCurrency(equipment.hourlyRate)}<span className="text-sm font-normal text-gray-600">/hour</span>
              </p>
            )}
            {!equipment.dailyRate && !equipment.hourlyRate && equipment.weeklyRate && (
              <p className="font-bold text-lg text-jacker-orange">
                {formatCurrency(equipment.weeklyRate)}<span className="text-sm font-normal text-gray-600">/week</span>
              </p>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {equipment.owner.name || "Beta Owner"}
          </div>
        </div>
      </div>
    </Link>
  );
} 