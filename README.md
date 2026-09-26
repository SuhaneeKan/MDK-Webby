# MDK Global Consultant website

**For a working Node.js backend and admin inbox, follow [BACKEND-SETUP.md](BACKEND-SETUP.md).** Run `npm run dev:full` for the website and API together; `npm run dev` starts only the frontend. Submissions persist in SQLite even without email/SMS credentials.

A complete React + TypeScript + Vite project for MDK Quality Management System Consulting. Includes 25 pre-rendered pages, midnight/ice blue glass surfaces, responsive layouts and a Vercel enquiry API with email and SMS notifications. The header retains the existing MDK wordmark with the full company name. An official logo asset was not provided in the available files.

## Run locally

Install Node.js 22.13 or newer. Extract the ZIP, open the `mdk-website` folder in VS Code and use its terminal:

```sh
npm install
npm run dev
```

Open the local address printed in the terminal (normally http://127.0.0.1:5173). Keep the terminal running. Stop it with Ctrl+C.

Production build and preview:

```sh
npm run build
npm run preview
```

Tests:

```sh
npm test
```

The ZIP includes the tested `dist` output for immediate static hosting. Do not double-click `index.html`; serve it over HTTP. Vite's development server uses standard React fast refresh. The production builder type-checks the project, uses an in-process TypeScript transform, bundles with Vite/Rollup, minifies JavaScript with Terser, and pre-renders each route. This avoids requiring an esbuild subprocess during production builds in restricted desktop environments.

## Vercel deployment

1. Put the extracted project in your own Git repository. Do not commit `node_modules`, local `.env` files or credentials.
2. In Vercel, choose **Add New → Project**, import that repository and set the project root to the folder containing `package.json`.
3. Select the **Vite** framework preset. Build command: `npm run build`. Output directory: `dist`. The supplied `vercel.json` also sets these values, clean URLs and response headers. No catch-all rewrite is required because all pages are pre-rendered.
4. Deploy a preview first. Review the site and complete `CONTENT-INVENTORY.md` owner confirmations.
5. For public launch, add `SITE_URL` under project environment variables, using the final HTTPS origin (for example your actual approved custom domain). Redeploy. This adds canonical URLs, sitemap entries and absolute Open Graph/X image URLs, and removes the preview noindex setting.
6. Configure the email and SMS provider variables below, test delivery on the preview deployment, then launch. Static-only hosting cannot run the enquiry API.

Without `SITE_URL`, the build intentionally adds `noindex,nofollow`, disallows crawling and leaves the sitemap empty. The included social card is ready and is referenced once a real public origin is set. Do not use an invented domain.

Official setup references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel project configuration](https://vercel.com/docs/project-configuration).

## Pages

- `/` Home
- `/about` About, career timeline and education
- `/services` Service overview, detail dialogs and audit types
- `/services/qms-consulting`
- `/services/regulatory-compliance`
- `/services/data-integrity`
- `/services/internal-auditors`
- `/services/documentation`
- `/services/audit-readiness`
- `/services/investigation-capa`
- `/services/supplier-quality`
- `/services/capability-building`
- `/services/change-control`
- `/services/digital-monitoring`
- `/industries` Industry explorer and audit types
- `/roadmap` Interactive journey, ten-arrow interactive compliance wheel and professional feedback
- `/training` Filterable training catalogue
- `/testimonials` Professional feedback carousel and qualitative themes
- `/assessment` Ten-question educational maturity assessment
- `/insights` Clearly marked planned articles
- `/contact` Consultation/enquiry form and LinkedIn
- `/privacy` Privacy notice
- `/terms` Terms draft
- `/disclaimer` Information and assessment limitations
- `/404` Custom not-found page, also exported as `404.html`

## Interactions

- Sticky glass navigation, mobile menu and persisted light/dark theme (system preference initially).
- Pointer-responsive ambient lighting, gentle background movement, QMS connections and selectable nodes.
- Animated experience/audit counters and hover states. Reduced-motion preference disables animations.
- Service and Chemical / Packaging Material / FNW / API audit dialogs, keyboard focus containment, Escape close and focus return.
- Expandable challenge cards, career timeline and FAQs.
- Eleven-step roadmap with objectives, activities, potential outputs and next-stage controls.
- Interactive industry selector and connected QMS visual with pointer and touch response.
- Seven training filters, prefilled enquiry topic links, 29 selected professional feedback excerpts and touch-swipe controls.
- Ten-question assessment, previous/next, scoring, result bars, strengths, focus areas and reset confirmation. No email gate or confidential uploads.
- Accessible form labels and native input validation. Form success means the email provider accepted the message; the page reports SMS acceptance separately.
- Optional progressive-enhancement WebMCP assessment tool where supported by the browser. It updates the same visible assessment state and does not transmit data.

## Editing content

`src/data.ts` owns business contacts, services, training, industries, timeline, testimonials, roadmap, questions and FAQs. Update it and rebuild. `src/App.tsx` contains the site shell and routes. `src/features.tsx` contains reusable sections and interactions. `src/styles.css` contains the design tokens and responsive styles, with the final blue/glass theme at the end.

The **150+ professional audits** figure and the four audit types were explicitly supplied by the owner during this task. Counter display is in `Authority` in `src/App.tsx`; audit details are in `AuditTypes` in `src/features.tsx`. Do not represent these as MDK client totals.

The owner explicitly approved publication of the business email, two phone numbers and GSTIN. They are configured in `src/data.ts`. Professional reviewer email addresses are never included. The WhatsApp button remains off because no WhatsApp business number was approved.

## Form delivery

The frontend submits to the Vercel function `api/consultation.js`. The function validates form fields, consent, origin, submission timing and request size, and applies a best-effort per-instance throttle. It sends the full enquiry to the configured business inbox via Resend, then sends abbreviated notifications to the two configured mobile numbers through Twilio. Email and SMS provider credentials are required for live operation; see **Live enquiries: email and SMS** below and `.env.example`. Do not commit keys. Provider acceptance is not proof of final delivery. A Vite local preview does not run Vercel functions, so verify on a configured Vercel preview deployment.

## Content and launch confirmations

See `CONTENT-INVENTORY.md` for factual provenance, testimonial permissions, exclusions and missing details. Before launch, confirm certification/issuer details, final business identity, legal text, final domain and broader use of professional feedback. The founder section uses a half-body studio edit of the supplied photograph. At the owner’s clarification, the replacement shield uses a supplied close-up of the plaque with “MEGHA S. KANDALKAR” and service engraving; the unaltered source photograph remains linked for reference. Other award details are not asserted. Insights are planned content, not fabricated articles.

The scoring bands and roadmap are educational illustrations. No certification, regulatory approval or audit outcome is promised.

## Assets and dependencies

DM Sans and Manrope are served locally from their Fontsource packages under their included open font licences. Lucide icons are used under the package licence. The original social card was generated for this project; it contains no person, client mark or private information. Keep package licences with redistributed dependencies. The source PDFs, spreadsheet and presentation are deliberately absent from the deliverable.

See `QA-REPORT.md` for completed validation and practical limits. This project has not been deployed to a public account and no email has been sent.

## Live enquiries

See `.env.example` for Resend and Twilio configuration. The Vercel API must be configured before sending; static hosting does not run the form.

## If the form says “unavailable on this hosting setup”

That message means `/api/consultation` returned HTTP 404 or 405. A `dist` upload, VS Code Live Server, Vite preview, and static hosting serve pages but do not execute the Vercel API. Import the **complete `mdk-website` project**, with `api/consultation.js` at its root, into Vercel. Set the root directory to `mdk-website` if the repository contains its parent. In the deployed site, opening `https://YOUR-DOMAIN/api/consultation` in a browser should show JSON stating “Method not allowed.” If it shows a hosting 404 page, the function was not deployed; check the Vercel project's root and Functions tab. Next set all environment variables from `.env.example` in the Vercel project's Environment Variables settings, including a real verified Resend sender and an SMS-capable Twilio sender. Set `SITE_URL` to the exact origin used for the form, without a trailing path. Redeploy, send a test enquiry, then check the business inbox and both phones. Never put API credentials in the website's public files.

If the function returns “Online enquiries are temporarily unavailable,” it is running but is missing at least one required setting. If it returns “Request origin not allowed,” `SITE_URL` does not match the current deployed site. Email and SMS provider acceptance is not final inbox or handset delivery; inspect provider logs for final status.

## Private admin inbox

A separate `/admin` page displays shared stored enquiries for authorized MDK staff. Configure a Supabase project and follow **ADMIN-SETUP.md**. The form writes to the database before attempting email/SMS notifications. This also works on static hosting once the Supabase URL, publishable key and row-level security rules are configured. Without a configured database, no admin storage is possible; see the setup guide.
