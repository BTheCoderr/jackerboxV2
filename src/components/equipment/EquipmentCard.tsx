'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import LazyImage from '@/components/ui/LazyImage';
import { parseImageUrls, generateResponsiveSizes } from '@/lib/imageOptimization';
import Image from 'next/image';

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

// Low quality image placeholder - a tiny blurred version
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="20%" />
      <stop stop-color="#f6f7f8" offset="40%" />
      <stop stop-color="#f6f7f8" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) => typeof window === 'undefined'
  ? Buffer.from(str).toString('base64')
  : window.btoa(str);

export function EquipmentCard({ equipment, priority = false }: EquipmentCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Parse images from string or array
  const images = typeof equipment.images === 'string' 
    ? [equipment.images] 
    : equipment.images || [];
  
  const imageUrl = images.length > 0 
    ? images[0] 
    : 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
  
  // Set up intersection observer to detect when card is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    
    const currentElement = document.getElementById(`equipment-card-${equipment.id}`);
    if (currentElement) {
      observer.observe(currentElement);
    }
    
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [equipment.id]);
  
  return (
    <Link 
      href={`/routes/equipment/${equipment.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
      id={`equipment-card-${equipment.id}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-sm text-gray-500">Image not available</span>
          </div>
        ) : (
          (priority || isVisible) && (
            <Image
              src={imageUrl}
              alt={equipment.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              placeholder="blur"
              blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
              fetchPriority={priority ? 'high' : 'auto'}
            />
          )
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