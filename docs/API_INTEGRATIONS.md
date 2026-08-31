# API integrations and production defaults

Tiger intentionally avoids assuming that third-party services are live in every environment. The app uses safe fallbacks and only upgrades to live data when the matching API keys are configured.

## Verified API status

| API | Status | Tiger feature usage | Notes |
|---|---|---|---|
| wger | IMPLEMENTED | Workout Builder search and exercise enrichment | Real lookup flow added to Tiger and normalized into Tiger’s exercise model |
| Open Food Facts | IMPLEMENTED | Nutrition Tracker barcode lookup | Real barcode lookup flow added with product normalization and manual fallback |
| Firebase | IMPLEMENTED | Auth, Firestore, Storage | Enforced only when env config is present |
| Weather provider | NOT IMPLEMENTED | No live production UI feature currently calls it | Service layer exists but no end-to-end UI is wired to it |
| AQI provider | NOT IMPLEMENTED | No live production UI feature currently calls it | Service layer exists but no end-to-end UI is wired to it |
| Geocoding | NOT IMPLEMENTED | No live UI currently uses it | Service layer exists but no feature is wired to it |
| Frankfurter | NOT IMPLEMENTED | No live UI currently uses it | Not integrated into a real Tiger feature |
| MediaWiki/Wikipedia | NOT IMPLEMENTED | Not used in current app flow | Kept as optional educational enrichment only |
| Open Library | NOT IMPLEMENTED | Not used in current app flow | Kept as optional educational enrichment only |
| YouTube Data API | NOT IMPLEMENTED | Not used | Rejected unless a production scenario and quota plan are valid |
| Google Calendar | NOT IMPLEMENTED | Not used | Tiger owns its appointment system first |

## Required environment variables

Copy `.env.example` to `.env.local` and fill in the values you want to enable:

- `VITE_FIREBASE_*` for Firebase Auth/Firestore/Storage
- `VITE_ADMIN_PASSWORD` to protect the admin panel
- `VITE_OPENWEATHER_API_KEY` for weather lookups
- `VITE_AQI_API_KEY` for air quality data
- `VITE_GEOCODING_API_KEY` for location search
- `VITE_EXERCISE_API_KEY` for exercise metadata via API Ninja
- `VITE_CURRENCY_API_KEY` for currency conversion

## Runtime behavior

The shared API layer in `src/services/api/client.ts`:

- uses a 5s timeout
- caches responses in memory with TTL
- falls back to safe default values when the API is unavailable or unconfigured
- never claims live data success without an actual network response

## Deployment notes

- Firebase config must be set in the hosting environment before auth and database features are expected to work.
- The Android TWA asset links file requires the real release certificate SHA-256 fingerprint.
- Admin access stays disabled until `VITE_ADMIN_PASSWORD` is set in the deployed environment.
- The app should be treated as a demo-safe frontend until the secure server-side verification layer exists for payment entitlement confirmation.
