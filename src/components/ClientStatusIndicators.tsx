'use client';

import dynamic from 'next/dynamic';
import { Fragment } from 'react';

// Dynamically import components that may cause hydration mismatches
const SocketStatusIndicator = dynamic(
  () => import('@/components/SocketStatusIndicator').then(mod => ({ default: mod.SocketStatusIndicator })),
  { ssr: false }
);

const SSEStatusIndicator = dynamic(
  () => import('@/components/SSEStatusIndicator').then(mod => ({ default: mod.SSEStatusIndicator })),
  { ssr: false }
);

export function ClientStatusIndicators() {
  return (
    <Fragment>
      <div id="status-indicators">
        <SocketStatusIndicator />
        <SSEStatusIndicator />
      </div>
    </Fragment>
  );
} 