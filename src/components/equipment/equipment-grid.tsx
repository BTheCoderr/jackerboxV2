"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';

interface Equipment {
  id: string;
  title: string;
  description: string;
  category: string;
  imagesJson: string;
  dailyRate: number | null;
  location: string;
  owner: {
    name: string | null;
    image: string | null;
  };
}

export function EquipmentGrid() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const response = await fetch('/api/equipment');
        const data = await response.json();
        setEquipment(data.equipment);
      } catch (error) {
        console.error('Error fetching equipment:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEquipment();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (equipment.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No equipment found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {equipment.map((item) => {
        const images = JSON.parse(item.imagesJson || '[]');
        const firstImage = images[0] || '/placeholder-image.jpg';

        return (
          <Link
            key={item.id}
            href={`/equipment/${item.id}`}
            className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="aspect-w-16 aspect-h-9 relative rounded-t-lg overflow-hidden">
              <Image
                src={firstImage}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600">
                {item.title}
              </h3>
              
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <span>{item.category}</span>
                <span className="mx-2">•</span>
                <span>{item.location}</span>
              </div>
              
              {item.dailyRate && (
                <p className="text-lg font-bold">
                  ${item.dailyRate}/day
                </p>
              )}
              
              <div className="mt-4 flex items-center">
                <div className="w-6 h-6 relative rounded-full overflow-hidden mr-2">
                  {item.owner.image ? (
                    <Image
                      src={item.owner.image}
                      alt={item.owner.name || 'Owner'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {item.owner.name?.[0]?.toUpperCase() || '👤'}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  {item.owner.name || 'Anonymous'}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
} 