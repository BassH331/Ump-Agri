const BASE_URL = 'https://campus-api-cuut.vercel.app';

export const fetchRouteByName = async (name) => {
  const response = await fetch(`${BASE_URL}/api/routes/${encodeURIComponent(name)}`);
  if (!response.ok) {
    throw new Error('Route not found in database');
  } else {
    console.log('✅ Route found:', name);
  }
  return await response.json(); // Returns: { name, start, end, coordinates }
};

export const fetchAllRoutes = async () => {
  const response = await fetch(`${BASE_URL}/api/routes`);
  if (!response.ok) {
    throw new Error('Failed to fetch all routes');
  }
  const data = await response.json();
  // Ensure array form
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.routes)) return data.routes;
  return data ? [data] : [];
};
