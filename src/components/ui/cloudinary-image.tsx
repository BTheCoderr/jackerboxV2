import { cn } from '@/lib/utils';

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  width?: number;
  height?: number;
  crop?: 'fill' | 'scale' | 'fit' | 'pad' | 'thumb' | 'crop';
  gravity?: 'auto' | 'face' | 'faces' | 'center' | 'north' | 'south' | 'east' | 'west';
  quality?: number | 'auto';
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
  responsive?: boolean;
  placeholder?: boolean;
  blur?: number;
  effect?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  transformations?: string;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * A responsive image component that uses Cloudinary for transformations
 */
export function CloudinaryImage({
  publicId,
  alt,
  width,
  height,
  crop = 'fill',
  gravity = 'auto',
  quality = 'auto',
  format = 'auto',
  responsive = true,
  placeholder = true,
  blur,
  effect,
  className,
  style,
  loading = 'lazy',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  transformations = '',
  onLoad,
}: CloudinaryImageProps) {
  // Get cloud name from environment variable
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not defined');
    return null;
  }
  
  // Build the base transformation string
  let transformationString = `q_${quality},f_${format}`;
  
  if (crop) transformationString += `,c_${crop}`;
  if (gravity) transformationString += `,g_${gravity}`;
  if (width) transformationString += `,w_${width}`;
  if (height) transformationString += `,h_${height}`;
  if (blur) transformationString += `,e_blur:${blur}`;
  if (effect) transformationString += `,e_${effect}`;
  if (transformations) transformationString += `,${transformations}`;
  
  // Base URL for the image
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  
  // URL for the main image
  const imageUrl = `${baseUrl}/${transformationString}/${publicId}`;
  
  // If responsive, create a srcSet with different widths
  let srcSet = '';
  if (responsive) {
    const breakpoints = [320, 640, 768, 1024, 1280, 1536];
    srcSet = breakpoints
      .map((breakpoint) => {
        const transformationWithWidth = transformationString.replace(
          /,w_\d+/g,
          `,w_${breakpoint}`
        );
        return `${baseUrl}/${transformationWithWidth}/${publicId} ${breakpoint}w`;
      })
      .join(', ');
  }
  
  // Create a low-quality placeholder image if needed
  const placeholderUrl = placeholder
    ? `${baseUrl}/q_10,f_auto,c_${crop},w_50,e_blur:1000/${publicId}`
    : undefined;
  
  return (
    <img
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      srcSet={responsive ? srcSet : undefined}
      sizes={responsive ? sizes : undefined}
      className={cn('max-w-full h-auto', className)}
      style={{
        ...style,
        ...(placeholder && {
          backgroundImage: `url(${placeholderUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }),
      }}
      loading={loading}
      onLoad={onLoad}
    />
  );
}

/**
 * A component for displaying a Cloudinary image with a background blur effect
 */
export function CloudinaryBlurImage({
  publicId,
  alt,
  className,
  ...props
}: CloudinaryImageProps) {
  // Get cloud name from environment variable
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not defined');
    return null;
  }
  
  // Create a low-quality blurred background image
  const blurredUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_10,f_auto,c_fill,w_50,e_blur:1000/${publicId}`;
  
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        backgroundImage: `url(${blurredUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <CloudinaryImage
        publicId={publicId}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: 0 }}
        onLoad={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          // When the main image loads, fade it in
          (e.target as HTMLImageElement).style.opacity = '1';
        }}
        {...props}
      />
    </div>
  );
} 