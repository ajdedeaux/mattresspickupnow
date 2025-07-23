# Google APIs Integration Backup - Ready for Instant Reconnection

## DISCONNECTED FOR DEVELOPMENT - EASILY RECONNECTABLE

The Google Maps/Places API integration has been temporarily disconnected to prevent charges during development. All logic is preserved and documented for instant reactivation when going live.

## HOW TO RECONNECT (INSTANT ACTIVATION)

### Step 1: Enable Google API Calls
In `server/routes.ts`, change line around 65:
```typescript
// CHANGE THIS:
const stores = getMockStores(lat, lng);

// TO THIS:
const stores = await findNearbyStores(lat, lng);
```

### Step 2: Verify API Keys Are Active
Ensure these environment variables are set:
- `GOOGLE_API_KEY` (for geocoding)
- `GOOGLE_PLACES_API_KEY` (for store search)

### Step 3: Test the Integration
Test with a real ZIP code to verify API calls work correctly.

## CURRENT MOCK DATA BEHAVIOR

The system currently returns realistic mock Mattress Firm store data:
- 5 stores with real-looking names
- Tampa Bay area addresses
- Working phone numbers
- Realistic distances (0.4 - 9.7 miles)
- Business hours

## PRESERVED API LOGIC

All Google Maps integration logic is preserved in:
- `server/services/google-maps.ts` - Complete GoogleMapsService class
- Multi-strategy store search (distance + popularity + generic)
- Strict "Mattress Firm" filtering
- Store details fetching (phone, hours, ratings)
- Distance calculations
- Error handling and fallbacks

## TESTING CAPABILITIES

Even disconnected, you can test:
- ZIP code entry
- Store results display
- Location detection flow
- SMS integration
- Lead capture
- All UI/UX functionality

The only difference is mock data instead of live Google API results.

## RECONNECTION CONFIDENCE

When ready to go live:
1. Change one line in routes.ts (mock → real API)
2. Verify API keys are active
3. Test with real ZIP code
4. System immediately uses live Google data

**Zero rebuilding required - instant activation!**