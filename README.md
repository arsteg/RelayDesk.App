# RelayDesk Order (React Native / Expo)

Android-first customer ordering app. Talks **only** to the FastAPI backend
(`RelayDesk.Api`). API contracts are kept in a self-contained local copy under `src/shared` (imported as `@relaydesk/shared`).

## Features
- Invited-customer onboarding (accept invitation) and login
- Menu / product browsing
- Cart + checkout (pickup or delivery)
- Place order (totals computed by the backend)
- Live order status via WebSocket, with polling fallback
- Order history

## Setup

```bash
cd RelayDesk.App
npm install
cp .env.example .env     # set EXPO_PUBLIC_API_URL to your backend
npm run typecheck        # tsc --noEmit
npm start                # Expo dev server
npm run android          # build & run on an Android device/emulator
```

### API base URL (`EXPO_PUBLIC_API_URL`)
- Android emulator → `http://10.0.2.2:8000`
- Physical device → your machine's LAN IP, e.g. `http://192.168.1.20:8000`
- Production → your deployed API's HTTPS URL (WebSockets upgrade to `wss://`).

The value is read in `src/api/config.ts`; `EXPO_PUBLIC_*` vars are inlined by Expo
at build time.

## Onboarding deep link
The accept screen reads a token from a deep link:
`relaydeskorder://accept?token=<token>`. You can also paste the token manually on
the Accept screen. (The token comes from the invitation link the business sends; a
production build would register an `https` App Link to open invite URLs directly.)

## Structure
```
app/            expo-router screens (index, login, accept, menu, cart, orders/*)
src/api/        client (fetch), realtime (WebSocket + fallback), session (SecureStore), config
src/state/      auth + cart React contexts
src/components/ small UI kit
src/money.ts    Hermes-safe money/quantity formatting
```

Business rules (totals, tax, transitions) live on the backend; this app never
computes money. Shared API types live in `src/shared` (imported as
`@relaydesk/shared`, wired in `metro.config.js` + `tsconfig.json`). They mirror the
web app's copy — regenerate both from one source if you change the contract.
