"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/shared/image-upload';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS } from '@/lib/constants';

const schema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  category: z.string().min(1, 'Select a category'),
  condition: z.string().min(1, 'Select the condition'),
  location: z.string().trim().min(3, 'Enter a city and state'),
  hourlyRate: z.number().nonnegative().optional(),
  dailyRate: z.number().nonnegative().optional(),
  weeklyRate: z.number().nonnegative().optional(),
  securityDeposit: z.number().nonnegative().optional(),
  images: z.array(z.string().url()).min(3, 'Add at least three photos').max(5),
}).refine(v => [v.hourlyRate, v.dailyRate, v.weeklyRate].some(n => typeof n === 'number' && n > 0), {
  message: 'At least one rental rate must be greater than zero',
  path: ['dailyRate'],
});
type Values = z.infer<typeof schema>;

export default function NewEquipmentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { images: [], category: '', condition: '' },
  });
  const setImages = (urls: string[]) => {
    setPhotos(urls);
    setValue('images', urls, { shouldValidate: true, shouldDirty: true });
  };
  const submit = async (values: Values) => {
    setSaving(true);
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          category: values.category,
          condition: values.condition,
          location: values.location,
          hourlyRate: values.hourlyRate,
          dailyRate: values.dailyRate,
          weeklyRate: values.weeklyRate,
          securityDeposit: values.securityDeposit,
          tagsJson: '[]',
          imagesJson: JSON.stringify(values.images),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.equipment?.id) {
        throw new Error(data.message || 'Unable to create equipment listing');
      }
      toast.success('Your listing was submitted for review');
      router.push(`/routes/equipment/${data.equipment.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create listing');
    } finally {
      setSaving(false);
    }
  };
  const numberField = { setValueAs: (v: string) => v === '' ? undefined : Number(v) };
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-3 text-2xl font-semibold">List your equipment</h1>
      <p className="mb-6 text-sm text-gray-600">Add clear photos and accurate rental rates. New listings are reviewed before they appear publicly.</p>
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <section>
          <h2 className="mb-2 font-medium">Equipment photos</h2>
          <ImageUpload onChange={setImages} value={photos} disabled={saving} maxFiles={5} />
          {errors.images && <p role="alert" className="mt-1 text-sm text-red-700">{errors.images.message}</p>}
        </section>
        <label className="block">Equipment title
          <input {...register('title')} className="mt-1 w-full rounded border p-2" />
          {errors.title && <span className="text-sm text-red-700">{errors.title.message}</span>}
        </label>
        <label className="block">Description
          <textarea {...register('description')} className="mt-1 w-full rounded border p-2" rows={4} />
          {errors.description && <span className="text-sm text-red-700">{errors.description.message}</span>}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">Category
            <select {...register('category')} className="mt-1 w-full rounded border p-2">
              <option value="">Choose category</option>
              {EQUIPMENT_CATEGORIES.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            {errors.category && <span className="text-sm text-red-700">{errors.category.message}</span>}
          </label>
          <label className="block">Condition
            <select {...register('condition')} className="mt-1 w-full rounded border p-2">
              <option value="">Choose condition</option>
              {EQUIPMENT_CONDITIONS.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
            {errors.condition && <span className="text-sm text-red-700">{errors.condition.message}</span>}
          </label>
        </div>
        <label className="block">Location (city and state)
          <input {...register('location')} className="mt-1 w-full rounded border p-2" placeholder="Providence, RI" />
          {errors.location && <span className="text-sm text-red-700">{errors.location.message}</span>}
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            ['hourlyRate', 'Hourly rate ($)'],
            ['dailyRate', 'Daily rate ($)'],
            ['weeklyRate', 'Weekly rate ($)'],
          ] as const).map(([field, label]) => (
            <label className="block" key={field}>{label}
              <input type="number" min="0" step="0.01" {...register(field, numberField)}
                className="mt-1 w-full rounded border p-2" />
              {errors[field] && <span className="text-sm text-red-700">{errors[field]?.message}</span>}
            </label>
          ))}
        </div>
        <label className="block">Security deposit ($, optional)
          <input type="number" min="0" step="0.01" {...register('securityDeposit', numberField)}
            className="mt-1 w-full rounded border p-2" />
          {errors.securityDeposit && <span className="text-sm text-red-700">{errors.securityDeposit.message}</span>}
        </label>
        <button type="submit" disabled={saving} className="w-full rounded bg-jacker-blue p-3 font-medium text-white disabled:opacity-50">
          {saving ? 'Submitting listing…' : 'Submit listing'}
        </button>
      </form>
    </main>
  );
}
