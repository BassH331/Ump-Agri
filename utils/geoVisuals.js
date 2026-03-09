// Helper for visualizing GPS accuracy as a smaller, clamped circle
const ACCURACY_MIN_RADIUS = 5; // meters
const ACCURACY_MAX_RADIUS = 100; // meters (reflect real-world GPS variability)
const ACCURACY_RADIUS_SCALE = 1.0; // render true reported accuracy

function getAccuracyRadius(accuracy) {
  if (typeof accuracy !== 'number' || !isFinite(accuracy) || accuracy <= 0) {
    return ACCURACY_MIN_RADIUS;
  }
  const scaled = accuracy * ACCURACY_RADIUS_SCALE;
  return Math.max(ACCURACY_MIN_RADIUS, Math.min(scaled, ACCURACY_MAX_RADIUS));
}

// CommonJS export for Node/Jest; Metro supports importing CommonJS from ESM
module.exports = { getAccuracyRadius, ACCURACY_MIN_RADIUS, ACCURACY_MAX_RADIUS, ACCURACY_RADIUS_SCALE };