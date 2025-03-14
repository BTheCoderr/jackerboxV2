import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSuggestions } from '@/lib/search/search-utils';

export const dynamic = 'force-dynamic';

/**
 * API endpoint for search suggestions
 * GET /api/search/suggestions?query=drill&type=equipment
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || 'equipment';
    
    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }
    
    let suggestions: string[] = [];
    
    // Get suggestions based on the type
    switch (type) {
      case 'equipment':
        // Get unique equipment titles and descriptions
        const equipmentTitles = await db.equipment.findMany({
          select: { title: true },
          distinct: ['title'],
          where: { isAvailable: true },
          take: 100,
        });
        
        const equipmentDescriptions = await db.equipment.findMany({
          select: { description: true },
          distinct: ['description'],
          where: { isAvailable: true },
          take: 100,
        });
        
        // Extract unique terms from titles and descriptions
        const titleTerms = equipmentTitles.map(e => e.title);
        const descriptionTerms = equipmentDescriptions
          .map(e => e.description || '')
          .filter(Boolean)
          .flatMap(desc => desc.split(/\s+/).filter(term => term.length > 3));
        
        // Combine and deduplicate terms
        const equipmentTerms = Array.from(new Set([...titleTerms, ...descriptionTerms]));
        
        // Generate suggestions
        suggestions = generateSuggestions(query, equipmentTerms);
        break;
        
      case 'location':
        // Get unique locations
        const locations = await db.equipment.findMany({
          select: { location: true },
          distinct: ['location'],
          where: { 
            location: { not: '' },
            isAvailable: true 
          },
          take: 100,
        });
        
        // Extract location terms
        const locationTerms = locations
          .map(e => e.location || '')
          .filter(Boolean);
        
        // Generate suggestions
        suggestions = generateSuggestions(query, locationTerms);
        break;
        
      case 'category':
        // Get unique categories
        const categories = await db.equipment.findMany({
          select: { category: true },
          distinct: ['category'],
          where: { 
            category: { not: '' },
            isAvailable: true 
          },
          take: 100,
        });
        
        // Extract category terms
        const categoryTerms = categories
          .map(e => e.category || '')
          .filter(Boolean);
        
        // Generate suggestions
        suggestions = generateSuggestions(query, categoryTerms);
        break;
        
      default:
        break;
    }
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate search suggestions' },
      { status: 500 }
    );
  }
} 