import { fetchAllRoutes } from '../api/routes';
import { bestMatches, normalizeName, generateNameVariants } from './nameMatch';

let routesCache = [];
let loadedAt = 0;

export async function loadRoutesCache(force = false) {
  try {
    // Use a 5-minute freshness window unless force is true
    if (!force && routesCache.length && (Date.now() - loadedAt) < 5 * 60 * 1000) {
      return routesCache;
    }
    const routes = await fetchAllRoutes();
    routesCache = Array.isArray(routes) ? routes.filter(Boolean) : [];
    loadedAt = Date.now();
    console.log(`📦 Loaded ${routesCache.length} routes into cache`);
    return routesCache;
  } catch (err) {
    console.warn('Failed to load routes cache:', err?.message || err);
    return routesCache; // return existing cache if present
  }
}

export function getRoutesCache() {
  return routesCache;
}

export function findBestRoutes(query, limit = 10) {
  if (!query || !routesCache.length) return [];
  const matches = bestMatches(query, routesCache, r => r?.name || '');
  return matches.slice(0, limit);
}

export function findRouteByNameSimilar(name) {
  if (!name || !routesCache.length) return null;
  const target = normalizeName(name);

  // Exact normalized name match
  const exact = routesCache.find(r => normalizeName(r?.name || '') === target);
  if (exact) return exact;

  // Try generated variants
  const variants = generateNameVariants(name);
  for (const v of variants) {
    const vNorm = normalizeName(v);
    const hit = routesCache.find(r => normalizeName(r?.name || '') === vNorm);
    if (hit) return hit;
  }

  // Fuzzy best match fallback
  const ranked = bestMatches(name, routesCache, r => r?.name || '');
  return ranked[0] || null;
}