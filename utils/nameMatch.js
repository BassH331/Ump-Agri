// Utility for robust, case-insensitive, fuzzy matching of building and path names

const SYNONYM_MAP = [
  // Pairs to normalize to a common form
  [/\bcentre\b/gi, 'center'],
  [/\bcenter\b/gi, 'center'],
  [/\blib\b/gi, 'library'],
  [/\blibrary\b/gi, 'library'],
  [/\bcafeteria\b/gi, 'cafeteria'],
  [/\btuckshop\b/gi, 'cafeteria'],
  [/\bcanteen\b/gi, 'cafeteria'],
  [/\bgymnasium\b/gi, 'gym'],
  [/\bgym\b/gi, 'gym'],
  [/\bres\b/gi, 'residence'],
  [/\bresidence\b/gi, 'residence'],
  [/\badmin\b/gi, 'administration'],
  [/\badministration\b/gi, 'administration'],
  [/\bict\b/gi, 'technology'],
  [/\btech\b/gi, 'technology'],
  [/\blab\b/gi, 'laboratory'],
  [/\blaboratory\b/gi, 'laboratory'],
];

export const normalizeName = (input) => {
  if (!input || typeof input !== 'string') return '';
  // Lowercase and strip accents
  let s = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  // Replace punctuation with spaces
  s = s.replace(/[\-_,.:;()\[\]{}]/g, ' ');
  // Apply synonyms
  SYNONYM_MAP.forEach(([re, repl]) => {
    s = s.replace(re, repl);
  });
  // Remove generic words that often differ between sources
  s = s.replace(/\b(building|block|hall|room|phase|wing)\b/g, ' ');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

const softNormalize = (input) => {
  if (!input || typeof input !== 'string') return '';
  let s = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[\-_,.:;()\[\]{}]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

export const tokenizeName = (input) => {
  const s = normalizeName(input);
  return s ? s.split(' ') : [];
};

export const similarityScore = (a, b) => {
  const ta = tokenizeName(a);
  const tb = tokenizeName(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const setA = new Set(ta);
  const setB = new Set(tb);
  let intersection = 0;
  setA.forEach((t) => {
    if (setB.has(t)) intersection += 1;
  });
  const union = new Set([...ta, ...tb]).size;
  const jaccard = intersection / union;
  // Add partial containment bonus (substring after normalization)
  const na = normalizeName(a);
  const nb = normalizeName(b);
  const containsBonus = na.includes(nb) || nb.includes(na) ? 0.2 : 0;
  return Math.min(1, jaccard + containsBonus);
};

export const isSimilar = (a, b, threshold = 0.4) => {
  const score = similarityScore(a, b);
  return score >= threshold;
};

export const generateNameVariants = (name) => {
  const base = normalizeName(name);
  const tokens = tokenizeName(name);
  const variants = new Set();
  variants.add(name); // original
  variants.add(base);
  // Remove generic tokens
  const filtered = tokens.filter(t => !['building','block','hall','room','phase','wing'].includes(t));
  if (filtered.length) variants.add(filtered.join(' '));
  // Try removing numbers or letter suffixes
  variants.add(base.replace(/\b([a-z]?\d+[a-z]?)\b/g, '').replace(/\s+/g, ' ').trim());
  // Try first two tokens (common prefix)
  if (filtered.length >= 2) variants.add(filtered.slice(0,2).join(' '));
  // Unique array
  return Array.from(variants).filter(v => v && v.trim().length > 0);
};

export const bestMatches = (query, list, selector = (x) => x) => {
  const q = query || '';
  const nq = normalizeName(q);
  const qsoft = softNormalize(q);
  const isShort = qsoft.length <= 3;
  const dynamicThreshold = isShort ? 0.1 : 0.3;

  const scored = list.map(item => {
    const text = selector(item);
    const baseScore = similarityScore(q, text);
    const ntSoft = softNormalize(text);
    const tokens = ntSoft.split(' ');
    const hasPrefix = qsoft && tokens.some(t => t.startsWith(qsoft));
    const containsSoft = qsoft && ntSoft.includes(qsoft);
    const bonus = (hasPrefix ? 0.3 : 0) + (containsSoft ? 0.2 : 0);
    return { item, score: Math.min(1, baseScore + bonus) };
  });

  return scored
    .filter(({ score }) => score >= dynamicThreshold)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
};