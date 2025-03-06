'use client';

import { useState, useEffect } from 'react';
import { isTestMode, TEST_PHONE_NUMBERS, TEST_VERIFICATION_CODE } from '@/lib/test-utils';

export function TestModeInfo() {
  const [showTestInfo, setShowTestInfo] = useState(false);
  
  useEffect(() => {
    // Only show in non-production environments
    setShowTestInfo(
      typeof window !== 'undefined' && 
      (process.env.NODE_ENV !== 'production' || 
       process.env.NEXT_PUBLIC_TEST_MODE === 'true')
    );
  }, []);
  
  if (!showTestInfo) return null;
  
  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-yellow-800">Test Mode Active</h3>
        <button 
          onClick={() => setShowTestInfo(false)}
          className="text-yellow-500 hover:text-yellow-700"
        >
          Dismiss
        </button>
      </div>
      
      <div className="mt-2 text-sm text-yellow-700">
        <p className="mb-2">
          For testing purposes, you can use these phone numbers without receiving an actual SMS:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          {TEST_PHONE_NUMBERS.map((phone) => (
            <li key={phone} className="cursor-pointer hover:underline" onClick={() => {
              navigator.clipboard.writeText(phone);
              alert(`Copied ${phone} to clipboard!`);
            }}>
              {phone} <span className="text-xs">(click to copy)</span>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Verification code for test numbers: <span className="font-mono bg-yellow-100 px-1 rounded">{TEST_VERIFICATION_CODE}</span>
        </p>
      </div>
    </div>
  );
} 