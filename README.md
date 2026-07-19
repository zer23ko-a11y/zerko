# KER-Lab - Police Stop Location Tracker

A mobile app for iOS and Android that allows users to pin and track police stop locations on a map.

## Features
- 📍 Pin locations on Google Maps
- 🚨 Track police stops and incidents
- 📱 Cross-platform (iOS & Android)
- ⚡ Fast, responsive UI
- 🗺️ Real-time map updates

## Tech Stack
- **Framework:** React Native with Expo
- **Map:** Google Maps
- **Language:** TypeScript
- **State Management:** Zustand
- **API:** REST with Axios

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Google Maps API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/zer23ko-a11y/KER-Lab.git
cd KER-Lab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Google Maps API Key

# Start the development server
npm start
```

### Running on Device/Emulator

```bash
# iOS
npm run ios

# Android
npm run android

# Web (for testing)
npm run web
```

## Project Structure

```
KER-Lab/
├── app/                    # Main app screens
│   ├── index.tsx          # App entry point
│   ├── map.tsx            # Map screen
│   └── pins.tsx           # Pins list view
├── components/            # Reusable UI components
│   ├── MapView.tsx        # Google Maps wrapper
│   ├── PinMarker.tsx      # Custom map marker
│   └── Button.tsx         # Shared button component
├── stores/                # Zustand state management
│   └── pinsStore.ts       # Pins and locations state
├── services/              # API and external services
│   ├── api.ts             # REST API client
│   └── geocoding.ts       # Location services
├── types/                 # TypeScript type definitions
│   └── index.ts           # App types
├── hooks/                 # Custom React hooks
│   ├── useLocation.ts     # Location tracking
│   └── useMap.ts          # Map controls
├── utils/                 # Utility functions
│   └── helpers.ts         # Common helpers
├── assets/                # Images, icons, fonts
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── .env.example           # Environment variables template
```

## How it Works

KER-Lab is a location tracking application that:

1. **Captures Location** - Users can enable location services to track their current position
2. **Pins Incidents** - Long-press on the map to pin a police stop location
3. **Records Details** - Add title, description, and severity level to each pin
4. **Syncs Data** - All pins are stored locally and synced to the backend server
5. **Views Nearby** - See all pins in your area with filtering options

## Key Files to Create Next

1. `app/index.tsx` - Main app navigation
2. `components/PinMarker.tsx` - Custom marker component
3. `stores/authStore.ts` - User authentication state
4. `services/geocoding.ts` - Address lookup
5. `hooks/useMap.ts` - Map utilities

## Development

### Adding a New Pin
- Long press on the map to add a new location
- Fill in incident details
- Pin is saved locally and synced to server

### Viewing Pins
- Pins appear as custom markers on the map
- Tap a marker to see details
- Swipe to delete or edit

## Contributing

Please follow the existing code style and submit pull requests with clear descriptions.

## License

MIT
