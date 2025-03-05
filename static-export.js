// This script helps with static export by excluding dynamic routes
// It's used during the build process to determine which routes to include in the static export

// Define the routes that should be included in the static export
const staticRoutes = [
  '/',
  '/about',
];

// Export the routes for Next.js to use
export default function exportPathMap() {
  const pathMap = {};
  
  // Add each static route to the path map
  staticRoutes.forEach(route => {
    pathMap[route] = { page: route };
  });
  
  return pathMap;
} 