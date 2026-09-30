# EdgeWForce Deployment and Database Setup

## Supabase Database

1. Back up the existing database.
2. Open the correct project in Supabase SQL Editor.
3. Run the complete, current `supabase/supabase_production_schema.sql` once.
4. Confirm the result says `EdgeWForce database ready` and review the staff count.

The other entry points (`supabase/schema.sql`, `supabase/seed.sql`, and `supabase/migrations/all.sql`) now contain the exact same installer. They are not separate schema models or a second demo seed. Re-running any current entry point is supported. Do not replay the individual historical numbered migrations on an upgraded database.

See [the database guide](supabase/README.md) for the UUID contract, existing-database adoption, safeguards and verification SQL. Bigint row IDs remain intact; staff/user references point to stable UUID identities. Never cast a numeric staff ID directly to UUID.

## Private Configuration

Use `.env.production.example` as a template. Inject production values through the hosting provider's environment settings; never upload a private `.env` file to GitHub.

| Variable | Setting |
| --- | --- |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Actual allowed frontend HTTPS origin(s), comma-separated |
| `DATABASE_MODE` | `supabase` |
| `SUPABASE_SCHEMA_VARIANT` | `numbered` (also the default) |
| `SUPABASE_URL` | The intended Supabase project URL |
| `SUPABASE_ANON_KEY` | Public/publishable key from that same project |
| `SUPABASE_SERVICE_ROLE_KEY` | Private server-only key from that project |
| `JWT_SECRET` | A unique random application secret, not a Supabase signing-key ID |
| `SUPABASE_STORAGE_BUCKET` | `edgewforce-media` |
| `VITE_SUPABASE_URL` | Same project URL, available at frontend build time |
| `VITE_SUPABASE_ANON_KEY` | Public/publishable key only |
| `VITE_API_URL` | `/api` for same-origin deployment |

Do not put service-role keys, SMTP credentials, or AI provider secrets in any `VITE_` or `NEXT_PUBLIC_` variable. Replace exposed keys and seeded default passwords before public launch.

For Windows local development only, Node 24 with `SUPABASE_USE_SYSTEM_CA=true` can use the operating system's certificate store. Do not disable TLS verification. Keep root `.env`, `server/.env`, and `client/.env.local` pointed at the same database.

## Vercel

The repository contains `vercel.json` and an Express entry point at `api/index.js`. Use the repository root, build command `npm run build`, and output directory `client/dist`. Configure the private environment above before deploying. GitHub upload alone does not deploy the app.

The standalone Node server runs the reminder worker, but the Vercel request handler does not run a persistent background worker. Configure a separately authenticated scheduler/worker before promising automatic reminders in a serverless deployment. Email, WhatsApp, push and external AI providers also require their own valid configuration and delivery tests.

## Verification

Run `npm run db:check`, `npm run test:database`, the backend test suite, and `npm run build` before publishing. Check the deployed `/api/health` returns HTTP 200 with `database: supabase`. Then test login, staff directory, workplace creation and staff assignment on the actual deployed URL.

Do not replace or reset an existing production database just because an installer rejects an unfamiliar layout. Preserve it and inspect the reported incompatibility first.
