/**
 * Search utilities for improved search functionality
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
 */
export function tokenizeQuery(query: string): string[] {
  if (!query) return [];
  
  // Remove special characters and convert to lowercase
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split by whitespace and filter out empty strings
  return cleanQuery.split(/\s+/).filter(Boolean);
}

/**
 * Common equipment-related synonyms
 */
export const SYNONYMS: Record<string, string[]> = {
  'drill': ['power drill', 'electric drill', 'cordless drill', 'impact driver'],
  'saw': ['circular saw', 'jigsaw', 'miter saw', 'table saw', 'chainsaw'],
  'ladder': ['step ladder', 'extension ladder', 'folding ladder'],
  'mower': ['lawn mower', 'grass cutter', 'riding mower'],
  'camera': ['dslr', 'digital camera', 'video camera', 'camcorder'],
  'computer': ['laptop', 'desktop', 'pc', 'workstation'],
  'truck': ['pickup', 'lorry', 'van', 'utility vehicle'],
  'generator': ['power generator', 'portable generator', 'inverter'],
  'pressure washer': ['power washer', 'pressure cleaner', 'jet washer'],
  'tent': ['camping tent', 'canopy', 'shelter'],
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
 * Generate a Prisma where clause for fuzzy search
 */
export function generateFuzzySearchQuery(query: string, fields: string[]): any {
  if (!query) return {};
  
  // Tokenize the query
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return {};
  
  // Expand tokens with synonyms
  const expandedTokens = tokens.flatMap(expandWithSynonyms);
  
  // Create OR conditions for each field and token
  const conditions = expandedTokens.flatMap(token => 
    fields.map(field => ({
      [field]: {
        contains: token,
        mode: "insensitive",
      },
    }))
  );
  
  return { OR: conditions };
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