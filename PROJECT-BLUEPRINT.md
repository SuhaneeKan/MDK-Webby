# MDK website blueprint and source boundary

## Source-content audit

`CONTENT-INVENTORY.md` is the detailed claim register for the earlier review of the four original materials. This supplied ZIP contains that register and the website source, but **does not contain the original PDF, spreadsheet or presentation files**. Accordingly, this delivery preserves previously recorded claims; it cannot independently re-extract or authenticate the original documents. Before public launch, review the register against the originals and obtain the approvals listed there.

The register supports Megha Kandalkar's 33+ years in Pharma and FMCG, career stages, pharmacy and packaging education, supplier quality and audit experience, listed industries and training topics, and selected professional feedback. The 150+ audit figure is recorded as an owner-supplied claim, not independently documented by the profile. Exact certification remains withheld pending confirmation. Feedback is labeled professional feedback, not MDK client testimony. Personal contacts and original materials are omitted.

## Sitemap and information architecture

| Visitor goal | Routes |
| --- | --- |
| Understand the offer | `/`, `/about`, `/services` and eleven service detail routes |
| Explore fit | `/industries`, `/roadmap`, `/training` |
| Assess credibility | `/testimonials`, `/insights` |
| Take action | `/assessment`, `/contact` |
| Review disclosures | `/privacy`, `/terms`, `/disclaimer` |

These are prerendered pages with a shared navigation shell. Services, industries, training, career history, roadmap, testimonials, assessment questions and FAQ content live in `src/data.ts`; section interactions live in `src/features.tsx`; route composition and page shell live in `src/App.tsx`; theme and responsive tokens live in `src/styles.css`. `scripts/prerender.mjs` creates route metadata, sitemap and robots output.

## Visual and content strategy

Midnight navy, restrained blues, ice accents and warm light surfaces distinguish the brand from generic startup styling. Manrope supplies display type and DM Sans body type. The hero uses an original interactive quality-system diagram; a user-supplied portrait edit is used, while former-employer logos are omitted. The information sequence moves from the practical quality problem, through services and expertise, to an illustrative engagement journey and a clear consultation action. The insights page labels planned content instead of posing as published regulatory advice.

## Lead flow and launch gate

The contact form validates user input and explicitly states that it is a preview. It does **not** transmit an enquiry until an approved inbox, delivery provider, privacy copy and environment configuration are in place. The educational assessment has no email gate and does not request confidential records. `README.md` describes the optional delivery configuration. The public launch also needs approved contacts, confirmation of current career details and credentials, review of named feedback, final legal text and a real site URL.

## Verification for this delivery

On 24 September 2026, `npm ci`, `npm test` (five passing tests) and `npm run build` passed. The build prerendered 25 pages (24 content routes and one 404); an additional standalone `404.html` makes 26 HTML outputs. A static check found no broken internal route targets. Prior responsive and interaction testing is recorded in `QA-REPORT.md`; it was not repeated in a live browser in this session.
