'use client';

import dynamic from 'next/dynamic';

// In client components, we can use dynamic with ssr: false
const DynamicNotFoundPage = dynamic(
  () => import('./NotFoundPage'),
  { ssr: false }
);

export function ClientNotFoundPage() {
  return <DynamicNotFoundPage />;
} 