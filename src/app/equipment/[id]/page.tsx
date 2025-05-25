import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { prisma } from "@/lib/prisma";
import { EquipmentActions } from "@/components/equipment/equipment-actions";
import { ImageGallery } from "@/components/equipment/image-gallery";
import Image from "next/image";
import { ContactOwnerButton } from "@/components/equipment/contact-owner-button";
import { Suspense } from "react";
import { AvailabilityCalendar } from "@/components/equipment/availability-calendar";

interface EquipmentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function EquipmentDetailPage({
  params,
}: EquipmentDetailPageProps) {
  const equipmentId = String(params.id);
  const user = await getCurrentUser();
  
  const equipment = await prisma.equipment.findUnique({
    where: {
      id: equipmentId,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!equipment) {
    notFound();
  }

  // Parse images from JSON string
  const images = equipment.imagesJson ? JSON.parse(equipment.imagesJson) : [];
  const tags = equipment.tagsJson ? JSON.parse(equipment.tagsJson) : [];
  const isOwner = user?.id === equipment.ownerId;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{equipment.title}</h1>
        {isOwner && (
          <EquipmentActions equipmentId={equipment.id} isOwner={isOwner} />
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ImageGallery images={images} title={equipment.title} />

          <div className="mt-8">
            <div className="flex items-center mb-4">
              <span className="text-gray-600 mr-4">{equipment.category}</span>
              <span className="text-gray-600">{equipment.location}</span>
            </div>
            <p className="text-gray-700 mb-6">{equipment.description}</p>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-900">Features</h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 relative rounded-full overflow-hidden mr-4">
                  {equipment.owner.image ? (
                    <Image
                      src={equipment.owner.image}
                      alt={equipment.owner.name || 'Equipment Owner'}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                      {equipment.owner.name?.charAt(0).toUpperCase() || '👤'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{equipment.owner.name}</h3>
                  <p className="text-sm text-gray-500">Equipment Owner</p>
                </div>
              </div>
              
              {!isOwner && (
                <ContactOwnerButton 
                  ownerId={equipment.owner.id} 
                  equipmentId={equipment.id}
                  equipmentTitle={equipment.title}
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Rental Rates</h2>
              <div className="space-y-3">
                {equipment.hourlyRate && (
                  <div className="flex justify-between">
                    <span>Per Hour</span>
                    <span className="font-semibold">${equipment.hourlyRate}</span>
                  </div>
                )}
                {equipment.dailyRate && (
                  <div className="flex justify-between">
                    <span>Per Day</span>
                    <span className="font-semibold">${equipment.dailyRate}</span>
                  </div>
                )}
                {equipment.weeklyRate && (
                  <div className="flex justify-between">
                    <span>Per Week</span>
                    <span className="font-semibold">${equipment.weeklyRate}</span>
                  </div>
                )}
              </div>
            </div>

            <Suspense fallback={<div>Loading calendar...</div>}>
              <AvailabilityCalendar
                equipmentId={equipment.id}
                isOwner={isOwner}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
} 