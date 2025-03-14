'use client';

import { useFeatureFlag, useExperimentParam } from '@/hooks/useFeatureFlag';
import { FEATURE_FLAGS, EXPERIMENTS } from '@/lib/statsig-config';
import { FeatureToggle, ExperimentToggle } from '@/components/feature-flags';

export function FeatureFlagExample() {
  // Using hooks
  const isEnhancedSearchEnabled = useFeatureFlag(FEATURE_FLAGS.ENHANCED_SEARCH);
  const isPushNotificationsEnabled = useFeatureFlag(FEATURE_FLAGS.PUSH_NOTIFICATIONS);
  
  // Using experiment param hook
  const buttonColor = useExperimentParam(
    EXPERIMENTS.PRICING_DISPLAY,
    'button_color',
    'blue'
  );
  
  return (
    <div className="p-4 space-y-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">Feature Flag Examples</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Using Hooks</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded">
            <p className="font-medium">Enhanced Search</p>
            <p className={`mt-1 ${isEnhancedSearchEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {isEnhancedSearchEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          
          <div className="p-3 border rounded">
            <p className="font-medium">Push Notifications</p>
            <p className={`mt-1 ${isPushNotificationsEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {isPushNotificationsEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Using Components</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded">
            <p className="font-medium">New Booking Flow</p>
            <FeatureToggle 
              featureKey={FEATURE_FLAGS.NEW_BOOKING_FLOW}
              fallback={<p className="mt-1 text-red-600">Disabled</p>}
            >
              <p className="mt-1 text-green-600">Enabled</p>
            </FeatureToggle>
          </div>
          
          <div className="p-3 border rounded">
            <p className="font-medium">Dark Mode</p>
            <FeatureToggle 
              featureKey={FEATURE_FLAGS.DARK_MODE}
              fallback={<p className="mt-1 text-red-600">Disabled</p>}
            >
              <p className="mt-1 text-green-600">Enabled</p>
            </FeatureToggle>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Experiment Example</h3>
        
        <div className="p-3 border rounded">
          <p className="font-medium">Button Color Experiment</p>
          <p className="mt-1">Current variant: <span className="font-bold">{buttonColor}</span></p>
          
          <ExperimentToggle
            experimentKey={EXPERIMENTS.PRICING_DISPLAY}
            paramName="button_color"
            defaultVariant="blue"
            variants={{
              blue: <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">Blue Button</button>,
              green: <button className="mt-2 px-4 py-2 bg-green-500 text-white rounded">Green Button</button>,
              red: <button className="mt-2 px-4 py-2 bg-red-500 text-white rounded">Red Button</button>,
            }}
          />
        </div>
      </div>
    </div>
  );
} 