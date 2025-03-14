import { Metadata } from 'next';
import { FeatureFlagExample } from '@/components/examples/FeatureFlagExample';
import { ServerFeatureToggle } from '@/components/feature-flags/ServerFeatureToggle';
import { FEATURE_FLAGS } from '@/lib/statsig-config';

export const metadata: Metadata = {
  title: 'Feature Flags Demo | Jackerbox',
  description: 'Explore how feature flags and A/B testing work in Jackerbox',
};

export default async function FeatureFlagsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Feature Flags & Experimentation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Client-Side Feature Flags</h2>
          <p className="text-gray-600 mb-6">
            These feature flags are evaluated on the client side using the Statsig React bindings.
          </p>
          
          <FeatureFlagExample />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Server-Side Feature Flags</h2>
          <p className="text-gray-600 mb-6">
            These feature flags are evaluated on the server side using the Statsig Node SDK.
          </p>
          
          <div className="p-4 space-y-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold">Server Feature Flag Examples</h2>
            
            <div className="space-y-4">
              <div className="p-3 border rounded">
                <p className="font-medium">Enhanced Search (Server)</p>
                <ServerFeatureToggle 
                  featureKey={FEATURE_FLAGS.ENHANCED_SEARCH}
                  fallback={<p className="mt-1 text-red-600">Disabled</p>}
                >
                  <p className="mt-1 text-green-600">Enabled</p>
                </ServerFeatureToggle>
              </div>
              
              <div className="p-3 border rounded">
                <p className="font-medium">Beta Features (Server)</p>
                <ServerFeatureToggle 
                  featureKey={FEATURE_FLAGS.BETA_FEATURES}
                  fallback={<p className="mt-1 text-red-600">Disabled</p>}
                >
                  <p className="mt-1 text-green-600">Enabled</p>
                </ServerFeatureToggle>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">How to Use Feature Flags</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Client-Side Usage</h3>
            <pre className="mt-2 p-4 bg-gray-800 text-white rounded overflow-x-auto">
              <code>{`// Using hooks
const isFeatureEnabled = useFeatureFlag(FEATURE_FLAGS.FEATURE_NAME);

// Using components
<FeatureToggle featureKey={FEATURE_FLAGS.FEATURE_NAME}>
  <NewFeature />
</FeatureToggle>`}</code>
            </pre>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">Server-Side Usage</h3>
            <pre className="mt-2 p-4 bg-gray-800 text-white rounded overflow-x-auto">
              <code>{`// Using server components
<ServerFeatureToggle featureKey={FEATURE_FLAGS.FEATURE_NAME}>
  <ServerComponent />
</ServerFeatureToggle>

// Using API routes
const isEnabled = await isFeatureEnabledServer(
  FEATURE_FLAGS.FEATURE_NAME,
  user
);`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 