"use client";

import { Equipment, User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";

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
  const images = equipment.imagesJson ? JSON.parse(equipment.imagesJson) : [];
  const defaultImage = "/placeholder-equipment.jpg"; // You'll need to add this image to your public folder
  
  return (
    <Link
      href={`/routes/equipment/${equipment.id}`}
      className="block rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
    >
      <div className="relative h-48 bg-gray-100">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={equipment.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        {equipment.isVerified && (
          <div className="absolute top-2 right-2 bg-jacker-blue text-white text-xs px-2 py-1 rounded-full">
            Verified
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg truncate text-jacker-blue">{equipment.title}</h3>
          <span className="text-sm bg-gray-100 px-2 py-1 rounded">
            {equipment.condition}
          </span>
        </div>
        
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
          {equipment.description}
        </p>
        
        <div className="mt-3 flex items-center text-sm text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1 text-jacker-blue"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
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
          
          <div className="flex items-center">
            {equipment.owner.image ? (
              <div className="w-6 h-6 rounded-full bg-jacker-blue mr-2 overflow-hidden">
                <img
                  src={equipment.owner.image}
                  alt={equipment.owner.name || "Owner"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-jacker-blue text-white flex items-center justify-center mr-2 text-xs">
                {equipment.owner.name ? equipment.owner.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <span className="text-sm text-gray-600">
              {equipment.owner.name || "Owner"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 