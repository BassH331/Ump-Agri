const BASE_URL = 'https://campus-api-cuut.vercel.app';
import * as FileSystem from 'expo-file-system';

const COORD_CACHE_PATH = `${FileSystem.documentDirectory || ''}cache_coordinates.json`;

export const fetchCoordinateByName = async (name) => {
  // First try exact match
  let response = await fetch(`${BASE_URL}/api/coordinates?name=${encodeURIComponent(name)}`);
  
  if (response.ok) {
    return await response.json();
  }
  
  // If exact match fails, try with trimmed name and fuzzy matching
  if (response.status === 404) {
    try {
      // Get all coordinates and do client-side matching
      const allCoordinates = await fetchAllCoordinates();
      
      // Normalize the search name
      const normalizedSearchName = name.toLowerCase().trim();
      
      // Try to find a match with various normalization strategies
      const match = allCoordinates.find(coord => {
        const coordName = coord.name.toLowerCase().trim();
        
        // Exact match after normalization
        if (coordName === normalizedSearchName) return true;
        
        // Check if one contains the other (for partial matches)
        if (coordName.includes(normalizedSearchName) || normalizedSearchName.includes(coordName)) return true;
        
        // Handle space variations around punctuation (dashes, etc.)
        const normalizeSpaces = (str) => str.replace(/\s*[-–—]\s*/g, '-').replace(/\s+/g, ' ');
        const normalizedCoordName = normalizeSpaces(coordName);
        const normalizedSearchNameSpaces = normalizeSpaces(normalizedSearchName);
        
        if (normalizedCoordName === normalizedSearchNameSpaces) return true;
        if (normalizedCoordName.includes(normalizedSearchNameSpaces) || normalizedSearchNameSpaces.includes(normalizedCoordName)) return true;
        
        // Handle common typos and spelling variations
        const handleTypos = (str) => {
          return str
            .replace(/achive/g, 'archive') // Fix "achive" -> "archive"
            .replace(/centre/g, 'center')  // Handle British vs American spelling
            .replace(/center/g, 'centre'); // Handle American vs British spelling
        };
        
        const typoFixedCoordName = handleTypos(coordName);
        const typoFixedSearchName = handleTypos(normalizedSearchName);
        
        if (typoFixedCoordName === typoFixedSearchName) return true;
        if (typoFixedCoordName.includes(typoFixedSearchName) || typoFixedSearchName.includes(typoFixedCoordName)) return true;
        
        return false;
      });
      
      if (match) {
        return {
          name: match.name,
          latitude: match.latitude,
          longitude: match.longitude
        };
      }
    } catch (error) {
      console.warn('Error during fuzzy coordinate matching:', error);
    }
    
    return null; // Not found, but not an error
  }
  
  throw new Error('Failed to fetch coordinates');
};


// In coordinates.js
export const fetchAllCoordinates = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/coordinates`);
    if (!response.ok) throw new Error('Failed to fetch all coordinates');
    const data = await response.json();
    const arr = Array.isArray(data) ? data : [data];
    try {
      if (FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(COORD_CACHE_PATH, JSON.stringify(arr));
      }
    } catch {}
    return arr;
  } catch (err) {
    try {
      if (FileSystem.documentDirectory) {
        const raw = await FileSystem.readAsStringAsync(COORD_CACHE_PATH);
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch {}
    throw err;
  }
};


