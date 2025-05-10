"use client";

import { Equipment, User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { useState, useEffect } from "react";
import { StarIcon } from 'lucide-react';

interface EquipmentCardProps {
  equipment: Equipment & {
    owner: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
  priority?: boolean;
}

export function EquipmentCard({ equipment, priority = false }: EquipmentCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Process image URL to ensure it works correctly
  const processImageUrl = (url: string): string => {
    if (!url || url === '') return getFallbackImageUrl();
    
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
  
  // Generate a fallback image URL based on the equipment category
  const getFallbackImageUrl = () => {
    const category = equipment.category.toLowerCase().replace(/\s+/g, '-');
    return `/images/equipment-placeholders/${category}.svg`;
  };
  
  useEffect(() => {
    setIsLoading(true);
    try {
      // Parse the images JSON
      const images = JSON.parse(equipment.imagesJson || '[]');
      
      // Use the first image if available, otherwise use a fallback
      if (images && images.length > 0 && images[0] && images[0] !== '') {
        setImageUrl(processImageUrl(images[0]));
      } else {
        setImageUrl(getFallbackImageUrl());
      }
    } catch (error) {
      console.error('Error parsing equipment images:', error);
      setImageUrl(getFallbackImageUrl());
    } finally {
      setIsLoading(false);
    }
  }, [equipment.imagesJson]);
  
  // Ensure we have a valid image URL
  const safeImageUrl = imageUrl && imageUrl !== '' 
    ? (imageError ? getFallbackImageUrl() : imageUrl) 
    : '/images/placeholder.svg';
  
  const handleImageError = () => {
    setImageError(true);
    setImageUrl(getFallbackImageUrl());
  };

  return (
    <Link
      href={`/routes/equipment/${equipment.id}`}
      className="group block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-500"
    >
      <div className="relative w-full h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <Image
            src={safeImageUrl}
            alt={equipment.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
            priority={priority}
          />
        )}
        {equipment.isVerified && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Verified
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg truncate text-jacker-blue group-hover:text-blue-600 dark:group-hover:text-blue-400">{equipment.title}</h3>
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
        
        {(equipment.rating > 0 || equipment.reviewCount > 0) && (
          <div className="mt-2 flex items-center">
            <div className="flex items-center">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">
                {equipment.rating.toFixed(1)}
              </span>
            </div>
            <span className="mx-1 text-gray-400">·</span>
            <span className="text-sm text-gray-500">
              {equipment.reviewCount} {equipment.reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
} 