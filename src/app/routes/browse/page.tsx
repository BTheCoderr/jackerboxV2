'use client';

import Link from "next/link";

// Static sample data for the static build
const sampleEquipment = [
  {
    id: '1',
    title: 'Professional Camera',
    description: 'High-end DSLR camera perfect for photography',
    pricePerDay: 50,
    images: [],
    category: { name: 'Photography' },
    owner: { name: 'John Doe', image: null }
  },
  {
    id: '2',
    title: 'Power Generator',
    description: 'Portable power generator for outdoor events',
    pricePerDay: 75,
    images: [],
    category: { name: 'Power Tools' },
    owner: { name: 'Jane Smith', image: null }
  }
];

const sampleCategories = [
  { id: '1', name: 'Photography' },
  { id: '2', name: 'Power Tools' },
  { id: '3', name: 'Audio Equipment' },
];

export default function BrowseEquipmentPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Equipment</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <div className="w-full md:w-64 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Categories</h3>
            <div className="space-y-2">
              {sampleCategories.map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    className="mr-2"
                  />
                  <label htmlFor={`category-${category.id}`}>{category.name}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Price Range</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-full p-2 border rounded"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Apply Filters
          </button>
        </div>
        
        {/* Equipment Listings */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleEquipment.map((item) => (
              <div
                key={item.id}
                className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gray-200 relative">
                  <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                    No Image
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white font-semibold">${item.pricePerDay}/day</p>
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-1">{item.title}</h2>
                  <p className="text-gray-500 text-sm mb-2">
                    {item.category?.name || "Uncategorized"}
                  </p>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center mt-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden mr-2">
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                        {item.owner.name?.charAt(0) || "U"}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {item.owner.name || "Anonymous"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 