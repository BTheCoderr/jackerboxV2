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
 * Calculate distance between two coordinates in kilometers using the Haversine formula
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Generate a Prisma where clause for enhanced fuzzy search
 * Now with support for phrases, categories, and operators
 */
export function generateEnhancedSearchQuery(
  query: string, 
  fields: string[],
  options?: {
    userLocation?: { latitude: number, longitude: number },
    maxDistance?: number,
    categories?: string[],
    priceRange?: { min?: number, max?: number }
  }
): any {
  if (!query && !options) return {};
  
  const conditions: any[] = [];
  
  // Process the text query if provided
  if (query) {
    // Tokenize the query
    const { terms, phrases, operators } = tokenizeQuery(query);
    
    // Process regular terms with synonyms
    if (terms.length > 0) {
      const expandedTerms = terms.flatMap(expandWithSynonyms);
      
      // Create OR conditions for each field and term
      const termConditions = expandedTerms.flatMap(term => 
        fields.map(field => ({
          [field]: {
            contains: term,
            mode: "insensitive",
          },
        }))
      );
      
      if (termConditions.length > 0) {
        conditions.push({ OR: termConditions });
      }
    }
    
    // Process quoted phrases (exact matches)
    if (phrases.length > 0) {
      const phraseConditions = phrases.flatMap(phrase => 
        fields.map(field => ({
          [field]: {
            contains: phrase,
            mode: "insensitive",
          },
        }))
      );
      
      if (phraseConditions.length > 0) {
        conditions.push({ OR: phraseConditions });
      }
    }
    
    // Process operators (e.g., category:tools)
    for (const operator of operators) {
      const [key, value] = operator.split(':');
      
      if (key === 'category') {
        conditions.push({
          category: {
            equals: value,
            mode: "insensitive",
          },
        });
        
        // Also add category keywords to improve results
        const categoryKeywords = expandWithCategoryKeywords(value);
        if (categoryKeywords.length > 0) {
          const keywordConditions = categoryKeywords.flatMap(keyword => 
            fields.map(field => ({
              [field]: {
                contains: keyword,
                mode: "insensitive",
              },
            }))
          );
          
          conditions.push({ OR: keywordConditions });
        }
      }
    }
  }
  
  // Add category filter if provided in options
  if (options?.categories && options.categories.length > 0) {
    conditions.push({
      category: {
        in: options.categories,
        mode: "insensitive",
      },
    });
  }
  
  // Add price range filter if provided
  if (options?.priceRange) {
    const priceConditions: any[] = [];
    
    if (options.priceRange.min !== undefined) {
      priceConditions.push({
        OR: [
          { hourlyRate: { gte: options.priceRange.min } },
          { dailyRate: { gte: options.priceRange.min } },
          { weeklyRate: { gte: options.priceRange.min } },
        ],
      });
    }
    
    if (options.priceRange.max !== undefined) {
      priceConditions.push({
        OR: [
          { hourlyRate: { lte: options.priceRange.max } },
          { dailyRate: { lte: options.priceRange.max } },
          { weeklyRate: { lte: options.priceRange.max } },
        ],
      });
    }
    
    if (priceConditions.length > 0) {
      conditions.push({ AND: priceConditions });
    }
  }
  
  // Return the combined query
  return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Post-process search results to add distance and relevance scoring
 */
export function enhanceSearchResults<T extends { id: string; latitude?: number | null; longitude?: number | null }>(
  results: T[],
  query: string,
  options?: {
    userLocation?: { latitude: number, longitude: number },
    searchFields?: string[],
    sortByDistance?: boolean
  }
): (T & { distance?: number, relevanceScore?: number })[] {
  if (!results.length) return [];
  
  const enhancedResults = results.map(result => {
    const enhancedResult = { ...result } as T & { distance?: number, relevanceScore?: number };
    
    // Calculate distance if user location and item location are available
    if (options?.userLocation && result.latitude && result.longitude) {
      enhancedResult.distance = calculateDistance(
        options.userLocation.latitude,
        options.userLocation.longitude,
        result.latitude,
        result.longitude
      );
    }
    
    // Calculate relevance score based on text matching
    if (query && options?.searchFields) {
      const { terms, phrases } = tokenizeQuery(query);
      let score = 0;
      
      // Check each search field for matches
      for (const field of options.searchFields) {
        const fieldValue = (result as any)[field];
        if (!fieldValue) continue;
        
        const fieldValueLower = String(fieldValue).toLowerCase();
        
        // Score exact matches highest
        if (fieldValueLower === query.toLowerCase()) {
          score += 10;
        }
        
        // Score phrase matches
        for (const phrase of phrases) {
          if (fieldValueLower.includes(phrase)) {
            score += 5;
          }
        }
        
        // Score term matches
        for (const term of terms) {
          if (fieldValueLower.includes(term)) {
            score += 2;
          }
          
          // Check synonyms
          const synonyms = expandWithSynonyms(term);
          for (const synonym of synonyms) {
            if (fieldValueLower.includes(synonym)) {
              score += 1;
            }
          }
        }
      }
      
      enhancedResult.relevanceScore = score;
    }
    
    return enhancedResult;
  });
  
  // Sort by distance or relevance
  if (options?.sortByDistance && options.userLocation) {
    return enhancedResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  } else if (query) {
    return enhancedResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
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