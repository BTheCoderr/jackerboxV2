'use client';

import { SSEStatusIndicator } from '@/components/SSEStatusIndicator';
import { useState, useEffect } from 'react';

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Only show the SSE status indicator on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {children}
      {mounted && <SSEStatusIndicator />}
    </>
  );
}