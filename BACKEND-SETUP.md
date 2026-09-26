# MDK Node.js backend

The existing React site now has a standalone Node.js server in `server/`. It stores enquiry submissions in a persistent SQLite file and serves a private admin inbox. Email and SMS delivery are optional additions, configured on the server; no provider secrets are bundled with the website.

## Local setup (VS Code)

1. Install Node.js **22.13 or newer** (Node 24 recommended). Open the `mdk-website` folder in VS Code.
2. Run `npm install`.
3. Copy `.env.node.example` to `.env.local` and set your own strong `ADMIN_EMAIL` and `ADMIN_PASSWORD` there. Do not commit `.env.local`.
4. Run `npm run dev:full`, then open **http://127.0.0.1:5173**. This command starts Vite and the Node API together. Open `/admin` and sign in with the credentials from `.env.local`.
5. Submit a test enquiry. The server stores all its fields in `data/mdk-enquiries.sqlite`. Reload `/admin` to see it. This works without Resend, Twilio or Supabase.

If you run `npm run dev` alone, you start only the website and the enquiry API is absent. Use `npm run dev:full`. On the API port, `GET /api/health` shows whether storage, email and SMS services are configured. `data/` is deliberately excluded from the ZIP and Git, so the inbox stays private.

## Production Node deployment

Run `npm run build`, set `HOST=0.0.0.0` and the environment variables on a **persistent Node.js host** and start with `npm run start`. This process serves the built website and the API on `PORT` (default 8787). Put the Node process behind HTTPS. Persist/back up `MDK_DB_PATH` on an attached disk: container files that reset on each deployment will lose enquiries. Set `SITE_URL` to the site's HTTPS origin if behind a proxy. Set a strong unique admin password. Set an abuse prevention rule for `/api/consultation` and `/api/admin/login` at your hosting provider; the built-in per-process throttle is only a baseline. Do not deploy this SQLite server inside a Vercel Function: serverless local storage is not durable.

To send the full enquiry by email, supply `RESEND_API_KEY`, `ENQUIRY_FROM` (a verified sender) and `ENQUIRY_TO`. To notify both phones, also supply `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` and `ENQUIRY_SMS_TO` as a comma-separated list of international E.164 numbers. A successful API result means the providers accepted the request; it does not guarantee final delivery. If providers are absent or fail, the enquiry is still saved in the admin inbox and the form reports that notification acceptance was not confirmed. For Indian SMS, follow the provider's sender-registration requirements.

The previous Supabase option remains available. When `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set **at build time**, the browser uses Supabase storage and admin login instead. Leave them blank for the standalone Node.js/SQLite backend. A static `dist` upload with neither a Node backend nor Supabase cannot save enquiries.

## Main API routes

| Route | Purpose |
| --- | --- |
| `POST /api/consultation` | Validate, store in SQLite, then try email and SMS. |
| `GET /api/health` | Report backend readiness without exposing credentials. |
| `POST /api/admin/login` | Check administrator credentials and issue an expiring session. |
| `POST /api/admin/refresh` | Restore a valid session. |
| `GET /api/admin/enquiries` | List the 200 most recent records for an authenticated administrator. |
| `POST /api/admin/logout` | Revoke an admin session. |

The database holds personal contact information. Limit admin access, establish a retention/deletion policy, keep secure backups, and review the privacy notice before accepting real enquiries.
