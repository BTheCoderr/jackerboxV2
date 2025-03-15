'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Equipment {
  id: string;
  title: string;
  images: string | string[];
  location: string;
  pricePerDay: number;
  distance?: number;
}

interface EquipmentCardProps {
  equipment: Equipment;
  priority?: boolean;
}

// Simple base64 encoded blur placeholder (smaller and faster than SVG)
const blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

export function EquipmentCard({ equipment, priority = false }: EquipmentCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Parse images from string or array
  const images = typeof equipment.images === 'string' 
    ? [equipment.images] 
    : equipment.images || [];
  
  const imageUrl = images.length > 0 
    ? images[0] 
    : 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
  
  return (
    <Link 
      href={`/routes/equipment/${equipment.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-sm text-gray-500">Image not available</span>
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={equipment.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            onError={() => setImageError(true)}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            placeholder="blur"
            blurDataURL={blurDataURL}
            fetchPriority={priority ? 'high' : 'auto'}
          />
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 text-lg font-medium text-gray-900 group-hover:text-blue-600">
          {equipment.title}
        </h3>
        
        <p className="mb-2 text-sm text-gray-600">
          {equipment.location}
          {equipment.distance && (
            <span className="ml-2 text-xs text-gray-500">
              ({equipment.distance} miles away)
            </span>
          )}
        </p>
        
        <div className="mt-auto">
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(equipment.pricePerDay)}
            <span className="ml-1 text-sm font-normal text-gray-600">/ day</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

export default EquipmentCard; 