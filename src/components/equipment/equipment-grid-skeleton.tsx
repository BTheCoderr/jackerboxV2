export function EquipmentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
          <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-t-lg" />
          <div className="p-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-5 bg-gray-200 rounded w-1/4" />
            <div className="mt-4 flex items-center">
              <div className="w-6 h-6 bg-gray-200 rounded-full mr-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 