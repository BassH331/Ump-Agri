const { getAccuracyRadius, ACCURACY_MIN_RADIUS, ACCURACY_MAX_RADIUS, ACCURACY_RADIUS_SCALE } = require('../utils/geoVisuals');

describe('getAccuracyRadius', () => {
  test('returns min radius for invalid or non-positive accuracy', () => {
    expect(getAccuracyRadius(undefined)).toBe(ACCURACY_MIN_RADIUS);
    expect(getAccuracyRadius(null)).toBe(ACCURACY_MIN_RADIUS);
    expect(getAccuracyRadius('10')).toBe(ACCURACY_MIN_RADIUS);
    expect(getAccuracyRadius(NaN)).toBe(ACCURACY_MIN_RADIUS);
    expect(getAccuracyRadius(-5)).toBe(ACCURACY_MIN_RADIUS);
    expect(getAccuracyRadius(0)).toBe(ACCURACY_MIN_RADIUS);
  });

  test('scales and clamps accuracy values', () => {
    // Small accuracy -> scaled but >= min
    const smallAcc = 4; // meters
    const expectedSmall = Math.max(ACCURACY_MIN_RADIUS, smallAcc * ACCURACY_RADIUS_SCALE);
    expect(getAccuracyRadius(smallAcc)).toBe(expectedSmall);

    // Large accuracy -> scaled but clamped to max
    const largeAcc = 200; // meters
    const scaledLarge = largeAcc * ACCURACY_RADIUS_SCALE; // 100
    expect(getAccuracyRadius(largeAcc)).toBe(Math.min(scaledLarge, ACCURACY_MAX_RADIUS));
  });

  test('monotonic increase up to clamp', () => {
    const a1 = getAccuracyRadius(10);
    const a2 = getAccuracyRadius(20);
    expect(a2).toBeGreaterThanOrEqual(a1);
    const a3 = getAccuracyRadius(1000);
    expect(a3).toBe(ACCURACY_MAX_RADIUS); // clamped
  });
});