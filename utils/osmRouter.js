// utils/osmRouter.js
// Lightweight OSM parser + graph router for campus-scale maps
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { XMLParser } from 'fast-xml-parser';
import { Platform } from 'react-native';

// Haversine distance in meters
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const HIGHWAY_WHITELIST = new Set([
  'footway', 'path', 'pedestrian', 'steps',
  'service', 'residential', 'living_street'
]);

let cachedGraph = null;

export async function loadOSMGraph() {
  if (cachedGraph) return cachedGraph;

  try {
    const osmAsset = Asset.fromModule(require('../map.osm'));
    await osmAsset.downloadAsync();
   const localUri = osmAsset.localUri;
   const remoteUri = osmAsset.uri;
   const uri = localUri || remoteUri;

    console.log('OSM asset resolved URI:', uri, 'platform:', Platform.OS);
 
    // Read XML content for native vs web
    let xml = '';
    if (Platform.OS === 'web') {
      const res = await fetch(remoteUri || uri);
      xml = await res.text();
    } else {
      try {
        xml = await FileSystem.readAsStringAsync(uri);
      } catch (nativeReadErr) {
        console.warn('FileSystem read failed, falling back to fetch:', nativeReadErr?.message || nativeReadErr);

       const res = await fetch(remoteUri || uri);
        xml = await res.text();
      }
    }

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', allowBooleanAttributes: true });
    const doc = parser.parse(xml);
    const osm = doc.osm;

    // Collect nodes
    const nodes = new Map();
    const rawNodes = Array.isArray(osm.node) ? osm.node : (osm.node ? [osm.node] : []);
    for (const n of rawNodes) {
      const id = String(n.id);
      const lat = parseFloat(n.lat);
      const lon = parseFloat(n.lon);
      nodes.set(id, { id, lat, lon });
    }

    // Build graph from ways
    const adj = new Map(); // id -> array of {to, weight}
    const addEdge = (a, b, w) => {
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a).push({ to: b, w });
      adj.get(b).push({ to: a, w });
    };

    const rawWays = Array.isArray(osm.way) ? osm.way : (osm.way ? [osm.way] : []);
    for (const way of rawWays) {
      // tags may be array or single object
      const tags = Array.isArray(way.tag) ? way.tag : (way.tag ? [way.tag] : []);
      const highwayTag = tags.find(t => t.k === 'highway');
      if (!highwayTag || !HIGHWAY_WHITELIST.has(highwayTag.v)) continue;

      const nds = Array.isArray(way.nd) ? way.nd : (way.nd ? [way.nd] : []);
      for (let i = 0; i < nds.length - 1; i++) {
        const a = String(nds[i].ref);
        const b = String(nds[i+1].ref);
        if (!nodes.has(a) || !nodes.has(b)) continue;
        const na = nodes.get(a); const nb = nodes.get(b);
        const w = haversine(na.lat, na.lon, nb.lat, nb.lon);
        // Ignore extremely long jumps (bad data)
        if (w > 500) continue;
        addEdge(a, b, w);
      }
    }

    cachedGraph = { nodes, adj };
    return cachedGraph;
  } catch (err) {
    console.error('Failed to load OSM graph:', err);
    throw err;
  }
}

function nearestNode(nodes, lat, lon) {
  let best = null; let bestD = Infinity;
  for (const n of nodes.values()) {
    const d = haversine(lat, lon, n.lat, n.lon);
    if (d < bestD) { bestD = d; best = n; }
  }
  return best;
}

export async function routeBetween(start, end) {
  const { nodes, adj } = await loadOSMGraph();
  const s = nearestNode(nodes, start.latitude, start.longitude);
  const t = nearestNode(nodes, end.latitude, end.longitude);
  if (!s || !t) throw new Error('Nearest nodes not found');

  // Dijkstra
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  const pq = []; // simple array-based PQ for small graphs

  for (const id of nodes.keys()) dist.set(id, Infinity);
  dist.set(s.id, 0);
  pq.push({ id: s.id, d: 0 });

  while (pq.length) {
    // pop smallest d
    pq.sort((a,b) => a.d - b.d);
    const { id, d } = pq.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    if (id === t.id) break;

    const edges = adj.get(id) || [];
    for (const e of edges) {
      const nd = d + e.w;
      if (nd < (dist.get(e.to) || Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, id);
        pq.push({ id: e.to, d: nd });
      }
    }
  }

  // Reconstruct path
  const pathIds = [];
  let cur = t.id;
  while (cur && cur !== s.id) {
    pathIds.push(cur);
    cur = prev.get(cur);
    if (!cur) break;
  }
  pathIds.push(s.id);
  pathIds.reverse();

  // Convert to coordinates for Polyline
  const coords = pathIds.map(id => {
    const n = nodes.get(id);
    return { latitude: n.lat, longitude: n.lon };
  });

  if (coords.length < 2) throw new Error('OSM route too short or not found');
  return coords;
}