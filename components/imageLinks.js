// api/imageLinks.js
const BASE_URL = 'https://campus-api-cuut.vercel.app'; // Replace with your local IP

// Handle common typos and spelling variations
const handleTypos = (name) => {
  return name
    .replace(/achive/gi, 'archive')  // Fix "achive" -> "archive"
    .replace(/centre/gi, 'center')   // British -> American spelling
    .replace(/center/gi, 'centre');  // American -> British spelling (for reverse matching)
};

// Normalize spaces around punctuation
const normalizeSpaces = (str) => {
  return str.replace(/\s*[-–—]\s*/g, '-').replace(/\s+/g, ' ').trim();
};

// Fetch only building image URLs (and optionally names or IDs)
export const fetchBuildingImages = async (name) => {
  try {
    // First try exact match
    let response = await fetch(`${BASE_URL}/api/links?name=${encodeURIComponent(name)}`);
    if (response.ok) {
      const result = await response.json();
      if (result && result.imageurl) {
        return result;
      }
    }

    // If exact match fails, try with typo correction and normalization
    const normalizedName = normalizeSpaces(name.toLowerCase());
    const typoFixedName = handleTypos(normalizedName);
    
    // Try with typo-corrected name
    if (typoFixedName !== normalizedName) {
      response = await fetch(`${BASE_URL}/api/links?name=${encodeURIComponent(typoFixedName)}`);
      if (response.ok) {
        const result = await response.json();
        if (result && result.imageurl) {
          return result;
        }
      }
    }

    // If still no match, fetch all links and do fuzzy matching
    response = await fetch(`${BASE_URL}/api/links`);
    if (!response.ok) {
      throw new Error('Failed to fetch building images');
    }
    
    const allLinks = await response.json();
    const linksArray = Array.isArray(allLinks) ? allLinks : [allLinks];
    
    // Fuzzy matching with typo correction
    const match = linksArray.find(link => {
      const linkName = normalizeSpaces(link.name.toLowerCase());
      const typoFixedLinkName = handleTypos(linkName);
      const typoFixedSearchName = handleTypos(normalizedName);
      
      // Check various matching conditions
      if (typoFixedLinkName === typoFixedSearchName) return true;
      if (typoFixedLinkName.includes(typoFixedSearchName) || typoFixedSearchName.includes(typoFixedLinkName)) return true;
      
      return false;
    });
    
    if (match) {
      return match;
    }
    
    // No match found
    return null;
    
  } catch (error) {
    console.error('Error fetching building images:', error);
    throw new Error('Failed to fetch building images');
  }
};
