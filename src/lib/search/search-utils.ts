/**
 * Enhanced search utilities for improved search functionality
 */

/**
 * Calculate the Levenshtein distance between two strings
 * This measures how many single-character edits are needed to change one string into another
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if two strings are similar based on Levenshtein distance
 * Returns true if the strings are similar enough
 */
export function isSimilar(a: string, b: string, threshold = 0.7): boolean {
  if (!a || !b) return false;
  
  // Convert to lowercase for comparison
  const strA = a.toLowerCase();
  const strB = b.toLowerCase();
  
  // Exact match
  if (strA === strB) return true;
  
  // Calculate maximum possible distance
  const maxLength = Math.max(strA.length, strB.length);
  if (maxLength === 0) return true;
  
  // Calculate actual distance
  const distance = levenshteinDistance(strA, strB);
  
  // Calculate similarity as a percentage (1 - distance/maxLength)
  const similarity = 1 - distance / maxLength;
  
  return similarity >= threshold;
}

/**
 * Tokenize a search query into individual terms
 * Now with support for quoted phrases and special operators
 */
export function tokenizeQuery(query: string): { terms: string[], phrases: string[], operators: string[] } {
  if (!query) return { terms: [], phrases: [], operators: [] };
  
  const phrases: string[] = [];
  const operators: string[] = [];
  
  // Extract quoted phrases
  const phraseRegex = /"([^"]+)"/g;
  let match;
  let processedQuery = query;
  
  while ((match = phraseRegex.exec(query)) !== null) {
    phrases.push(match[1].toLowerCase());
    // Remove the phrase from the query to avoid double processing
    processedQuery = processedQuery.replace(match[0], ' ');
  }
  
  // Extract special operators (e.g., category:tools)
  const operatorRegex = /(\w+):([\w-]+)/g;
  while ((match = operatorRegex.exec(query)) !== null) {
    operators.push(`${match[1].toLowerCase()}:${match[2].toLowerCase()}`);
    // Remove the operator from the query to avoid double processing
    processedQuery = processedQuery.replace(match[0], ' ');
  }
  
  // Process remaining terms
  // Remove special characters and convert to lowercase
  const cleanQuery = processedQuery.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split by whitespace and filter out empty strings
  const terms = cleanQuery.split(/\s+/).filter(Boolean);
  
  return { terms, phrases, operators };
}

/**
 * Expanded equipment-related synonyms and categories
 */
export const SYNONYMS: Record<string, string[]> = {
  // Tools
  'drill': ['power drill', 'electric drill', 'cordless drill', 'impact driver', 'drill driver'],
  'saw': ['circular saw', 'jigsaw', 'miter saw', 'table saw', 'chainsaw', 'reciprocating saw', 'band saw'],
  'sander': ['orbital sander', 'belt sander', 'palm sander', 'finishing sander', 'detail sander'],
  'ladder': ['step ladder', 'extension ladder', 'folding ladder', 'multi-position ladder', 'telescoping ladder'],
  'mower': ['lawn mower', 'grass cutter', 'riding mower', 'push mower', 'reel mower', 'zero-turn mower'],
  'pressure washer': ['power washer', 'pressure cleaner', 'jet washer', 'high-pressure cleaner'],
  'generator': ['power generator', 'portable generator', 'inverter generator', 'standby generator'],
  'compressor': ['air compressor', 'portable compressor', 'shop compressor'],
  
  // Photography & Video
  'camera': ['dslr', 'digital camera', 'video camera', 'camcorder', 'mirrorless camera', 'action camera'],
  'lens': ['camera lens', 'zoom lens', 'prime lens', 'wide-angle lens', 'telephoto lens', 'macro lens'],
  'tripod': ['camera stand', 'monopod', 'stabilizer', 'gimbal'],
  'lighting': ['studio lights', 'led panel', 'ring light', 'softbox', 'flash', 'strobe'],
  
  // Electronics
  'computer': ['laptop', 'desktop', 'pc', 'workstation', 'gaming computer', 'macbook', 'chromebook'],
  'projector': ['video projector', 'movie projector', 'lcd projector', 'slide projector'],
  'speaker': ['pa system', 'sound system', 'bluetooth speaker', 'powered speaker', 'subwoofer'],
  'drone': ['quadcopter', 'uav', 'aerial camera', 'flying camera'],
  
  // Vehicles
  'truck': ['pickup', 'lorry', 'van', 'utility vehicle', 'moving truck', 'box truck'],
  'trailer': ['utility trailer', 'cargo trailer', 'flatbed trailer', 'enclosed trailer'],
  'bike': ['bicycle', 'mountain bike', 'road bike', 'e-bike', 'electric bicycle'],
  
  // Outdoor & Recreation
  'tent': ['camping tent', 'canopy', 'shelter', 'pop-up tent', 'dome tent', 'cabin tent'],
  'grill': ['bbq', 'barbecue', 'smoker', 'charcoal grill', 'gas grill', 'griddle'],
  'kayak': ['canoe', 'paddleboard', 'sup', 'boat', 'rowboat'],
  'snowboard': ['ski', 'snowshoe', 'winter sports equipment'],
};

/**
 * Category to keyword mapping for better search relevance
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'tools': ['drill', 'saw', 'hammer', 'screwdriver', 'wrench', 'power tool', 'hand tool', 'workshop'],
  'photography': ['camera', 'lens', 'tripod', 'lighting', 'flash', 'studio', 'dslr', 'mirrorless'],
  'video': ['camera', 'camcorder', 'tripod', 'stabilizer', 'gimbal', 'microphone', 'lighting'],
  'audio': ['speaker', 'microphone', 'mixer', 'amplifier', 'pa system', 'sound system', 'recording'],
  'electronics': ['computer', 'laptop', 'projector', 'tv', 'monitor', 'tablet', 'phone', 'drone'],
  'vehicles': ['car', 'truck', 'van', 'trailer', 'bike', 'bicycle', 'motorcycle', 'scooter'],
  'outdoor': ['tent', 'grill', 'kayak', 'canoe', 'camping', 'hiking', 'fishing', 'hunting'],
  'party': ['speaker', 'lighting', 'tent', 'table', 'chair', 'decoration', 'karaoke', 'projector'],
  'sports': ['bike', 'kayak', 'snowboard', 'ski', 'golf', 'tennis', 'basketball', 'football'],
};

/**
 * Expand a search term with its synonyms
 */
export function expandWithSynonyms(term: string): string[] {
  const result = [term];
  
  // Check if the term is a key in our synonyms dictionary
  if (SYNONYMS[term]) {
    result.push(...SYNONYMS[term]);
  }
  
  // Check if the term is a value in our synonyms dictionary
  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    if (synonyms.includes(term)) {
      result.push(key);
      // Add other synonyms for the same key
      result.push(...synonyms.filter(s => s !== term));
    }
  }
  
  return result;
}

/**
 * Expand a category with related keywords
 */
export function expandWithCategoryKeywords(category: string): string[] {
  if (!category) return [];
  
  const normalizedCategory = category.toLowerCase();
  
  // Direct match with a category
  if (CATEGORY_KEYWORDS[normalizedCategory]) {
    return CATEGORY_KEYWORDS[normalizedCategory];
  }
  
  // Check for partial matches
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat.includes(normalizedCategory) || normalizedCategory.includes(cat)) {
      return keywords;
    }
  }
  
  return [];
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Generate a Prisma where clause for enhanced fuzzy search
 * Now with support for phrases, categories, and operators
 */
export function generateEnhancedSearchQuery(
  searchTerm: string,
  searchFields: string[],
  options: SearchOptions = {}
) {
  const query: any = {};
  const { userLocation, maxDistance, priceRange, categories } = options;

  // Add basic search conditions
  if (searchTerm) {
    query.OR = searchFields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive'
      }
    }));
  }

  // Add category filter
  if (categories?.length) {
    query.category = {
      in: categories
    };
  }

  // Add price range filter
  if (priceRange) {
    if (priceRange.min !== undefined) {
      query.dailyrate = {
        ...query.dailyrate,
        gte: priceRange.min
      };
    }
    if (priceRange.max !== undefined) {
      query.dailyrate = {
        ...query.dailyrate,
        lte: priceRange.max
      };
    }
  }

  // Add location-based filtering if coordinates are provided
  if (userLocation && maxDistance) {
    const { latitude, longitude } = userLocation;
    const latDelta = (maxDistance / 111.32); // Rough approximation: 1 degree = 111.32 km
    const lonDelta = maxDistance / (111.32 * Math.cos(latitude * Math.PI / 180));

    query.AND = [
      {
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta
        }
      },
      {
        longitude: {
          gte: longitude - lonDelta,
          lte: longitude + lonDelta
        }
      }
    ];
  }

  return query;
}

/**
 * Post-process search results to add distance and relevance scoring
 */
export function enhanceSearchResults(
  results: any[],
  searchTerm: string,
  options: {
    userLocation?: { latitude: number; longitude: number };
    searchFields?: string[];
    sortByDistance?: boolean;
  } = {}
) {
  const { userLocation, searchFields = [], sortByDistance } = options;
  
  let enhancedResults = results.map(item => {
    const result = { ...item };
    
    // Calculate distance if user location is provided
    if (userLocation && item.latitude && item.longitude) {
      result.distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );
    }
    
    // Calculate relevance score based on search term matches
    if (searchTerm && searchFields.length > 0) {
      let relevanceScore = 0;
      searchFields.forEach(field => {
        const value = item[field];
        if (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) {
          relevanceScore += 1;
        }
      });
      result.relevanceScore = relevanceScore;
    }
    
    return result;
  });
  
  // Sort by distance if requested
  if (sortByDistance && userLocation) {
    enhancedResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }
  
  return enhancedResults;
}

/**
 * Generate search suggestions based on a partial query and existing data
 */
export function generateSuggestions(
  partialQuery: string, 
  existingTerms: string[], 
  maxSuggestions = 5
): string[] {
  if (!partialQuery) return [];
  
  const lowercaseQuery = partialQuery.toLowerCase();
  
  // First, find exact matches that start with the query
  const exactMatches = existingTerms
    .filter(term => term.toLowerCase().startsWith(lowercaseQuery))
    .slice(0, maxSuggestions);
  
  // If we have enough exact matches, return them
  if (exactMatches.length >= maxSuggestions) {
    return exactMatches;
  }
  
  // Otherwise, find similar terms using fuzzy matching
  const fuzzyMatches = existingTerms
    .filter(term => !exactMatches.includes(term) && isSimilar(lowercaseQuery, term.toLowerCase(), 0.6))
    .slice(0, maxSuggestions - exactMatches.length);
  
  return [...exactMatches, ...fuzzyMatches];
} 