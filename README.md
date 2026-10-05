# Mileage Log

Next.js 14 (App Router, TypeScript) + MongoDB + Tailwind. Based on the PRD in this chat.

## Run
1. `cp .env.example .env.local` and set `MONGODB_URI` (local MongoDB or Atlas)
2. `npm install`
3. `npm test` (engine golden fixtures F1-F4)
4. `npm run dev`, open http://localhost:3000

## Structure
- `lib/mileage.ts`  pure engine: full-to-full cycles, partials, chain breaks, resets, review flags, weighted aggregates
- `lib/auth.ts`     opaque server-side sessions (cookie holds a random token, DB holds its hash)
- `app/api/...`     route handlers: auth, vehicles, fuel entries
- `app/app/...`     signed-in pages: vehicles, dashboard + history, add fuel
- `components/`     forms and small UI pieces

Segments and aggregates are computed on read from the raw entries, so there is nothing to rebuild and no replica set is needed.
