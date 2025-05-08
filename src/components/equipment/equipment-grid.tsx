'use client';

import { Equipment, User } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface EquipmentWithOwner extends Equipment {
  owner: Pick<User, 'id' | 'name' | 'image'>;
  distance?: number;
  averageRating?: number;
  reviewCount?: number;
}

interface EquipmentGridProps {
  equipment: EquipmentWithOwner[];
  pagination: {
    total: number;
    pages: number;
    current: number;
  };
}

export function EquipmentGrid({ equipment, pagination }: EquipmentGridProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // Get the first valid image URL from the equipment
  const getEquipmentImage = (item: EquipmentWithOwner): string => {
    if (imageErrors[item.id]) {
      return '/placeholder-equipment.jpg'; // Fallback image
    }

    try {
      const images = JSON.parse(item.imagesjson || '[]');
      if (Array.isArray(images) && images.length > 0) {
        return images[0];
      }
    } catch (error) {
      console.error('Error parsing equipment images:', error);
    }

    return '/placeholder-equipment.jpg';
  };

  // Format condition for display
  const formatCondition = (condition: string): string => {
    return condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
  };

  if (equipment.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No equipment found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
        <Link href="/routes/equipment">
          <Button className="mt-4">Clear Filters</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {equipment.map((item) => (
          <Link key={item.id} href={`/routes/equipment/${item.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={getEquipmentImage(item)}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                  onError={() => handleImageError(item.id)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-0 left-0 w-full p-2 flex justify-between">
                  <Badge variant="secondary" className="bg-white/80 text-black">
                    {formatCondition(item.condition)}
                  </Badge>
                  {item.distance !== undefined && (
                    <Badge variant="secondary" className="bg-black/80 text-white">
                      <MapPin className="h-3 w-3 mr-1" />
                      {item.distance.toFixed(1)} km
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                  {item.averageRating && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="ml-1 text-sm font-medium">{item.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline">{item.category}</Badge>
                  {item.subcategory && (
                    <Badge variant="outline" className="bg-gray-50">{item.subcategory}</Badge>
                  )}
                </div>
                
                <div className="flex flex-col gap-1 mb-3">
                  {item.hourlyrate !== null && item.hourlyrate > 0 && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-3 w-3 mr-1 text-gray-500" />
                      <span className="text-gray-600">Hourly: </span>
                      <span className="ml-1 font-medium">{formatPrice(item.hourlyrate)}</span>
                    </div>
                  )}
                  
                  {item.dailyrate !== null && item.dailyrate > 0 && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                      <span className="text-gray-600">Daily: </span>
                      <span className="ml-1 font-medium">{formatPrice(item.dailyrate)}</span>
                    </div>
                  )}
                  
                  {item.weeklyrate !== null && item.weeklyrate > 0 && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                      <span className="text-gray-600">Weekly: </span>
                      <span className="ml-1 font-medium">{formatPrice(item.weeklyrate)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center">
                    {item.owner.image ? (
                      <Image
                        src={item.owner.image}
                        alt={item.owner.name || 'Owner'}
                        width={24}
                        height={24}
                        className="rounded-full mr-2"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                        <span className="text-xs text-gray-600">
                          {item.owner.name ? item.owner.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600 truncate max-w-[100px]">{item.owner.name}</span>
                  </div>
                  
                  <Badge variant="secondary" className="text-xs">
                    {item.location.split(',')[0]}
                  </Badge>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      
      {pagination.pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={{
                pathname: '/routes/equipment',
                query: {
                  ...Object.fromEntries(new URLSearchParams(window.location.search)),
                  page: page.toString(),
                },
              }}
              className={`px-4 py-2 rounded ${
                page === pagination.current
                  ? 'bg-black text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}