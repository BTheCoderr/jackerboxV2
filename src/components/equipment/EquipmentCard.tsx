'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import LazyImage from '@/components/ui/LazyImage';
import { parseImageUrls, generateResponsiveSizes } from '@/lib/imageOptimization';

interface EquipmentCardProps {
  equipment: {
    id: string;
    title: string;
    images: string[] | string;
    location: string;
    pricePerDay: number;
    distance?: number;
  };
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  // Parse images using our utility function
  const imageUrls = parseImageUrls(equipment.images);
  const imageUrl = imageUrls[0];
  
  // Generate responsive sizes
  const sizes = generateResponsiveSizes('33vw', {
    '768': '100vw',
    '1200': '50vw'
  });

  return (
    <Link 
      href={`/equipment/${equipment.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <LazyImage
          src={imageUrl}
          alt={equipment.title}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          fallbackSrc="/images/placeholder.svg"
        />
      </div>
      
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-medium text-gray-900">
          {equipment.title}
        </h3>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1 h-4 w-4"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">
              {equipment.location}
              {equipment.distance && ` (${equipment.distance.toFixed(1)} mi)`}
            </span>
          </div>
          
          <div className="font-medium text-gray-900">
            {formatCurrency(equipment.pricePerDay)}<span className="text-sm text-gray-500">/day</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default EquipmentCard; 