import React from 'react';

export function LoadingSpinner({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    default: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-t-jacker-blue border-r-transparent border-b-jacker-blue border-l-transparent`}
      />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <LoadingSpinner size="large" />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gray-200 rounded" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
} 