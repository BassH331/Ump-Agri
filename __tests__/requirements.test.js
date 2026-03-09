const fs = require('fs');
const path = require('path');

function read(file) {
  return fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
}

describe('Project Requirements Alignment', () => {
  test('app.json has location permissions and Google Maps key', () => {
    const appJson = JSON.parse(read('app.json'));
    const android = appJson.expo?.android || {};
    expect(android).toBeTruthy();
    const permissions = android.permissions || [];
    expect(permissions).toEqual(expect.arrayContaining([
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION'
    ]));
    const config = appJson.expo?.android?.config || {};
    const apiKey = config.googleMaps?.apiKey;
    expect(typeof apiKey).toBe('string');
    expect(apiKey.length).toBeGreaterThan(0);
  });

  test('Secure storage is used for persisted preferences', () => {
    const onboardingContext = read('contexts/OnboardingContext.js');
    const settingsContext = read('contexts/SettingsContext.js');
    expect(onboardingContext).toMatch(/expo-secure-store/);
    expect(settingsContext).toMatch(/expo-secure-store/);
  });

  test('Map components include Circle on native and stubs on web', () => {
    const native = read('components/MapComponents.native.js');
    const web = read('components/MapComponentsWeb.js');
    expect(native).toMatch(/Circle/);
    expect(web).toMatch(/Circle/);
  });

  test('Home and Directions screens render accuracy circle', () => {
    const home = read('screens/HomeScreen.js');
    const dir = read('screens/DirectionsScreen.js');
    expect(home).toMatch(/<Circle/);
    expect(dir).toMatch(/<Circle/);
  });

  test('Routing via OpenRouteService is configured', () => {
    const dir = read('screens/DirectionsScreen.js');
    expect(dir).toMatch(/openrouteservice/i);
  });

  test('Offline and cache routing utilities exist', () => {
    const osmRouter = read('utils/osmRouter.js');
    const routeCache = read('utils/routeCache.js');
    expect(osmRouter).toMatch(/routeBetween/);
    expect(osmRouter).toMatch(/loadOSMGraph/);
    expect(routeCache).toMatch(/loadRoutesCache/);
  });
});