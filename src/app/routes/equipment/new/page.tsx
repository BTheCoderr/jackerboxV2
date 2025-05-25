"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/shared/image-upload';

const equipmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
  condition: z.string().min(1, 'Please select a condition'),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  dailyRate: z.number().min(0, 'Daily rate must be positive'),
  weeklyRate: z.number().min(0, 'Weekly rate must be positive'),
  location: z.string().min(1, 'Location is required'),
  images: z.array(z.string()).min(1, 'At least one image is required'),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export default function NewEquipmentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      images: [],
    },
  });

  const onSubmit = async (data: EquipmentFormValues) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          images,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create listing');
      }

      const result = await response.json();
      toast.success('Equipment listed successfully!');
      router.push(`/routes/equipment/${result.id}`);
      
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setImages((prev) => [...prev, url]);
    setValue('images', [...images, url]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">List Your Equipment</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equipment Images
          </label>
          <ImageUpload
            onUpload={handleImageUpload}
            maxImages={5}
            existingImages={images}
          />
          {errors.images && (
            <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className="w-full p-2 border rounded-md"
            placeholder="e.g., Professional Grade Jackhammer"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={4}
            className="w-full p-2 border rounded-md"
            placeholder="Describe your equipment, including its features, specifications, and condition..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              {...register('category')}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select a category</option>
              <option value="power-tools">Power Tools</option>
              <option value="hand-tools">Hand Tools</option>
              <option value="construction">Construction Equipment</option>
              <option value="landscaping">Landscaping Equipment</option>
              <option value="cleaning">Cleaning Equipment</option>
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
              Condition
            </label>
            <select
              id="condition"
              {...register('condition')}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select condition</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
            {errors.condition && (
              <p className="text-red-500 text-sm mt-1">{errors.condition.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate ($)
            </label>
            <input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              {...register('hourlyRate', { valueAsNumber: true })}
              className="w-full p-2 border rounded-md"
            />
            {errors.hourlyRate && (
              <p className="text-red-500 text-sm mt-1">{errors.hourlyRate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700 mb-1">
              Daily Rate ($)
            </label>
            <input
              id="dailyRate"
              type="number"
              step="0.01"
              min="0"
              {...register('dailyRate', { valueAsNumber: true })}
              className="w-full p-2 border rounded-md"
            />
            {errors.dailyRate && (
              <p className="text-red-500 text-sm mt-1">{errors.dailyRate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="weeklyRate" className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Rate ($)
            </label>
            <input
              id="weeklyRate"
              type="number"
              step="0.01"
              min="0"
              {...register('weeklyRate', { valueAsNumber: true })}
              className="w-full p-2 border rounded-md"
            />
            {errors.weeklyRate && (
              <p className="text-red-500 text-sm mt-1">{errors.weeklyRate.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            id="location"
            type="text"
            {...register('location')}
            className="w-full p-2 border rounded-md"
            placeholder="e.g., Boston, MA"
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Listing...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
} 