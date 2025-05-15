'use client';

import { EquipmentCard } from './EquipmentCard';
import { EquipmentGrid } from './EquipmentGrid';
import { EquipmentSearch } from './EquipmentSearch';

// Export EquipmentGridSkeleton
function EquipmentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(9).fill(0).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="h-48 bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export {
  EquipmentCard,
  EquipmentGrid,
  EquipmentGridSkeleton,
  EquipmentSearch
}; 