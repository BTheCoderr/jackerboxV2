import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeEquipmentDetailPage() {
  const equipmentPagePath = path.join(__dirname, '../app/routes/equipment/[id]/page.tsx');
  
  try {
    let content = await fs.readFile(equipmentPagePath, 'utf8');
    
    // Add Image optimization
    if (!content.includes('priority')) {
      content = content.replace(
        /<Image/g,
        '<Image priority'
      );
    }
    
    // Add Suspense boundaries
    if (!content.includes('Suspense')) {
      content = `import { Suspense } from 'react';\n${content}`;
      content = content.replace(
        /(<div[^>]*>)/,
        '$1\n<Suspense fallback={<div>Loading...</div>}>'
      );
      content = content.replace(
        /(<\/div>)$/,
        '</Suspense>$1'
      );
    }
    
    // Add route segment config
    if (!content.includes('export const dynamic')) {
      content = `export const dynamic = 'force-dynamic';\nexport const revalidate = 30;\n${content}`;
    }
    
    await fs.writeFile(equipmentPagePath, content);
    console.log('✅ Optimized equipment detail page');
  } catch (error) {
    console.error('Error optimizing equipment detail page:', error);
  }
}

async function addImageOptimization() {
  const nextConfigPath = path.join(__dirname, '../next.config.js');
  
  try {
    let content = await fs.readFile(nextConfigPath, 'utf8');
    
    // Add image optimization config
    if (!content.includes('images')) {
      content = content.replace(
        /module\.exports\s*=\s*{/,
        `module.exports = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/avif', 'image/webp'],
  },`
      );
    }
    
    await fs.writeFile(nextConfigPath, content);
    console.log('✅ Added image optimization config');
  } catch (error) {
    console.error('Error adding image optimization:', error);
  }
}

async function addCaching() {
  const middlewarePath = path.join(__dirname, '../middleware.ts');
  
  try {
    const content = `
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add caching headers for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add caching for equipment images
  if (request.nextUrl.pathname.startsWith('/images/equipment/')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }
  
  return response;
}

export const config = {
  matcher: ['/_next/static/:path*', '/images/:path*'],
};
`;
    
    await fs.writeFile(middlewarePath, content);
    console.log('✅ Added caching middleware');
  } catch (error) {
    console.error('Error adding caching:', error);
  }
}

async function main() {
  console.log('🚀 Starting performance optimizations...');
  
  await Promise.all([
    optimizeEquipmentDetailPage(),
    addImageOptimization(),
    addCaching(),
  ]);
  
  console.log('\n✨ Performance optimizations complete!');
  console.log('\nNext steps:');
  console.log('1. Rebuild the application: npm run build');
  console.log('2. Restart the development server: npm run dev');
  console.log('3. Clear browser cache and verify improvements');
}

main().catch(console.error);

export default {
  optimizeEquipmentDetailPage,
  addImageOptimization,
  addCaching,
  main,
}; 