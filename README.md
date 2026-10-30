# Linkcraft — URL Shortener with Analytics

A full-stack URL shortener built with MongoDB Atlas, Express, React, Vite and Node.js. It includes anonymous link ownership, custom aliases, expiry, redirects, click analytics, link management and downloadable QR codes.

## Features

- Create short links with generated or custom aliases and optional expiry dates.
- Redirects validate enabled/expiry state and return branded 404/410 pages for unavailable links.
- Click events capture timestamp, referrer hostname, device category and browser parsed from the user agent. Raw IP addresses are not stored.
- Per-link analytics include daily clicks, top referrers, devices and browsers.
- Edit destinations and titles, disable/re-enable, delete links and download QR codes.
- Anonymous ownership: the API returns a random management key once, stores only its SHA-256 hash, and the browser stores the key locally. Export recovery keys before clearing browser storage.
- Server-side input validation, HTTP/HTTPS-only destinations, rate limits, Helmet, compression, bounded request bodies and automated backend tests.
- Responsive layout for phones and desktop.

## Requirements

- Node.js 20+ (Node 22 recommended)
- npm 10+
- MongoDB Atlas cluster or local MongoDB instance

## Setup

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Create `server/.env` based on `.env.example` and set `MONGODB_URI` to your Atlas connection string. URL-encode special characters in the database username/password. Set `PUBLIC_BASE_URL` to the public API origin when deployed.

3. Start the API and frontend:

   ```bash
   npm run dev
   ```

   Frontend: http://localhost:5173  
   API health: http://localhost:5000/api/health

4. Run tests:

   ```bash
   npm test
   ```

5. Optional seed data:

   ```bash
   npm run seed
   ```

   The seed script prints a one-time management key. Save it securely. The seeded link's sample analytics are synthetic and should be used only for local evaluation.

## Environment variables

Copy `.env.example` to `server/.env`. For the frontend, optionally create `client/.env` with `VITE_API_URL=http://localhost:5000/api`.

- `NODE_ENV`: runtime environment
- `PORT`: API port
- `MONGODB_URI`: MongoDB connection URI
- `CLIENT_ORIGIN`: allowed frontend origin; comma-separated origins are supported by the current CORS setup
- `PUBLIC_BASE_URL`: base URL used when constructing short links
- `APP_SECRET`: reserved for future encryption/rotation features; not currently used by the management-token implementation
- `SEED_DEMO`: reserved seed flag; run the seed script explicitly with `npm run seed`
- `VITE_API_URL`: optional client API base URL

## Data model

### Link

`alias` (unique indexed), `destination`, `title`, `ownerTokenHash`, `enabled`, `expiresAt`, `totalClicks`, `createdAt`, `updatedAt`.

### Click

`linkId` (indexed reference), `clickedAt`, `referrer`, `device`, `browser`. Compound index on `(linkId, clickedAt)` supports analytics time-range queries.

## Main design decisions

- **Anonymous ownership instead of registration:** users get a 256-bit random management token. Only its SHA-256 hash is stored in MongoDB; private operations require the original token in `X-Link-Owner`. The browser stores a mapping of alias to token in local storage. Export the mapping to retain access across browser resets.
- **Fast redirect path:** lookup and eligibility checks happen before a 302 redirect. Click-event persistence and the click counter update are launched asynchronously and do not block the response. This is best-effort analytics; production scale should move events to a durable queue/stream and update counters asynchronously.
- **Input validation:** Zod validates request bodies on the API. Only HTTP and HTTPS URL schemes are accepted. Aliases have a conservative character allowlist.
- **Analytics:** MongoDB aggregation pipelines group clicks by day, referrer, device and browser.
- **Deletion:** deleting a link also deletes its click events.

## Tests

The Node test runner covers valid destinations, blocked protocols, malformed URLs, invalid aliases, past expiry dates, empty updates, token hashing and user-agent/referrer parsing.

## Demo login

No demo login is needed because there is no account system. For a seeded demo link, run `npm run seed` and use the one-time management key printed in the terminal. The seed script recreates `welcome-demo` and its synthetic analytics.

## Deployment

Deploy the API and frontend separately (for example, Render for the API and Vercel for the frontend), configure environment variables, and set `PUBLIC_BASE_URL` to the API's public origin. Set `CLIENT_ORIGIN` to the deployed frontend origin. Configure Atlas Network Access for the API host. A deployed link must point to the API host because redirect routes live on the API.

## Known limitations / next steps

- Rate limiting is per IP/network, not per account. This is appropriate for anonymous ownership but should use Redis or another shared store in a multi-instance deployment.
- The current click-event write is fire-and-forget and can be lost if the process stops before MongoDB confirms the insert. A durable queue is the next step for production guarantees.
- Unique visitors are not calculated. Adding them responsibly requires a privacy-preserving, documented definition and retention policy.
- Recovery-key import and key rotation are not yet implemented; keep the exported JSON private.
- Analytics aggregation can be moved to a pre-aggregated daily collection if event volume becomes large.
- Add a durable job for expiry cleanup if expired-link retention policies require it; expiry is already enforced on every redirect.
- Add integration tests against a disposable MongoDB database, CI, structured logs, monitoring, bot filtering and abuse reporting before public production use.

## AI tools

ChatGPT was used to help plan the architecture, draft implementation code, and identify security/performance considerations. Review and understand the code before submitting; adapt this section to accurately describe your own usage.
