const BASE_URL = 'https://campus-api-cuut.vercel.app';
import * as FileSystem from 'expo-file-system';

const CACHE_PATH = `${FileSystem.documentDirectory || ''}cache_buildings.json`;

export const fetchAllBuildings = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/buildings`);
    if (!response.ok) throw new Error('Failed to fetch buildings');
    const data = await response.json();
    const arr = Array.isArray(data) ? data : [data];
    try {
      if (FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(CACHE_PATH, JSON.stringify(arr));
      }
    } catch {}
    return arr;
  } catch (err) {
    try {
      if (FileSystem.documentDirectory) {
        const raw = await FileSystem.readAsStringAsync(CACHE_PATH);
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch {}
    throw err;
  }
};