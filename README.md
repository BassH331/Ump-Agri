# UMP Map App

A React Native Expo application for navigating the University Malaysia Pahang campus.

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd UMP-Map-App
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

## Dependencies

This project uses specific pinned versions to ensure consistent installations across different environments. The `.npmrc` file is configured to use `legacy-peer-deps=true` to resolve peer dependency conflicts automatically.

## Troubleshooting

If you encounter dependency conflicts during installation, the `.npmrc` configuration should handle them automatically. If issues persist, try:

```bash
npm install --legacy-peer-deps
```

## Project Structure

- `/screens` - Application screens
- `/components` - Reusable UI components
- `/navigation` - Navigation configuration
- `/api` - API endpoints and data
- `/assets` - Images and static assets
- `/data` - Static data files
- `/hooks` - Custom React hooks
- `/utils` - Utility functions