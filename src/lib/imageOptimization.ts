/**
 * Utility functions for image optimization
 */

/**
 * Generates responsive image sizes attribute for Next.js Image component
 * @param defaultSizes Default sizes attribute
 * @param breakpoints Custom breakpoints configuration
 * @returns Properly formatted sizes attribute string
 */
export function generateResponsiveSizes(
  defaultSizes: string = '100vw',
  breakpoints?: Record<string, string>
): string {
  if (!breakpoints || Object.keys(breakpoints).length === 0) {
    return defaultSizes;
  }

  // Sort breakpoints by size (ascending)
  const sortedBreakpoints = Object.entries(breakpoints)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));
  
  // Build the sizes attribute
  const sizesArray = sortedBreakpoints.map(
    ([breakpoint, size]) => `(max-width: ${breakpoint}px) ${size}`
  );
  
  // Add the default size at the end
  sizesArray.push(defaultSizes);
  
  return sizesArray.join(', ');
}

/**
 * Determines if an image should be loaded with priority based on its position
 * @param index Position of the image in a list
 * @param threshold Number of images to prioritize (default: 1)
 * @returns Boolean indicating if the image should be prioritized
 */
export function shouldPrioritizeImage(index: number, threshold: number = 1): boolean {
  return index < threshold;
}

/**
 * Calculates appropriate image dimensions based on container size and aspect ratio
 * @param containerWidth Width of the container
 * @param aspectRatio Desired aspect ratio (width/height)
 * @returns Object with calculated width and height
 */
export function calculateImageDimensions(
  containerWidth: number,
  aspectRatio: number = 16/9
): { width: number; height: number } {
  const height = Math.round(containerWidth / aspectRatio);
  return {
    width: containerWidth,
    height
  };
}

/**
 * Generates a placeholder URL for a given image size
 * @param width Width of the placeholder
 * @param height Height of the placeholder
 * @param text Optional text to display on the placeholder
 * @returns URL for a placeholder image
 */
export function generatePlaceholderUrl(
  width: number = 400,
  height: number = 300,
  text: string = 'Loading...'
): string {
  // Use local SVG placeholder
  return `/images/placeholder.svg`;
}

/**
 * Extracts image URLs from a JSON string or array
 * @param images JSON string or array of image URLs
 * @param fallback Fallback URL if no images are found
 * @returns Array of image URLs
 */
export function parseImageUrls(
  images: string | string[] | null | undefined,
  fallback: string = '/images/placeholder.svg'
): string[] {
  if (!images) {
    return [fallback];
  }
  
  try {
    const parsedImages = typeof images === 'string' 
      ? JSON.parse(images) 
      : images;
    
    return Array.isArray(parsedImages) && parsedImages.length > 0
      ? parsedImages
      : [fallback];
  } catch (error) {
    console.error('Error parsing image URLs:', error);
    return [fallback];
  }
} 