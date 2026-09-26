# Website verification

Final build checked on 18 September 2026.

## Completed

- Production TypeScript checks, Vite build and prerendering passed: 24 content pages plus a 404 page.
- All 25 generated pages have one H1 and one description. Internal page links, fragment targets and referenced local assets resolve without errors.
- Five automated tests passed, covering assessment score boundaries, invalid answers, priority ordering, valid enquiries and rejected enquiry inputs.
- All 24 content routes opened in the browser at 360px and 1440px viewport overrides with no document horizontal overflow. Earlier homepage checks also covered 375, 390, 430, 768, 1024 and 1920px.
- Reviewed light and dark homepage appearance. Corrected inherited dark-theme text colour and verified theme persistence across reload.
- Exercised mobile navigation, service and audit dialogs, Escape dismissal, roadmap navigation and testimonial navigation.
- Completed all ten assessment questions using the visible controls. Ten answers of two points produced Controlled, 20/30, 67%, with the expected breakdown.
- Training category counts: GMP 1, Auditing 1, Documentation 3, Risk 2, Food Safety 2, Quality Systems 4; All restores 13 topics.
- Comparison slider responds to keyboard input. Selecting low impact/high maturity updates the risk matrix guidance.
- FNW Audits is carried into the enquiry topic. A synthetic enquiry passed frontend validation and displayed the explicit no-send/no-storage demo confirmation.
- No browser console errors or warnings were observed during the final route and interaction checks.
- Final minified JavaScript is approximately 301 KB (92 KB gzip); CSS approximately 62 KB (16 KB gzip). Fonts are served locally.

## Delivery limits

- No public deployment or real email delivery was performed. The optional API requires the configuration documented in README.md.
- The production build was tested locally. Standard development hot reload could not be fully verified in the restricted desktop process environment.
- No Lighthouse score, formal accessibility certification or full cross-browser/device certification is claimed. Responsive checks used the available Chromium browser and viewport controls.
- Legal pages are launch drafts. Current credentials, business identity, approved contact details and final domain remain owner confirmations as listed in CONTENT-INVENTORY.md.
- The preview intentionally remains noindex until SITE_URL is configured. Insights are explicitly marked as planned content.
- The ZIP excludes node_modules, private source documents, environment secrets and temporary working files. Install dependencies using the included lockfile before development.

## September 24 revision
The original comparison slider and risk matrix were removed by request. Added credentials, expanded professional feedback, rating chart and curved reviewer selector. Latest type check, production build and logic tests are recorded separately in the delivery summary. The earlier browser checks above predate these revisions and must not be read as visual verification of the new layout.

### Current delivery verification (24 September 2026)
- `npm run build` passed with TypeScript checks and 25 prerendered pages; `npm test` passed all five tests.
- Static checks found zero broken internal route targets and confirmed the graph and portrait assets were emitted.
- Source assertions confirmed requested wording and removal of comparison and risk-matrix components.
- No live browser screenshot or device-level visual validation was available for these final revisions. Review the About and testimonial layouts on target devices before public launch.

### Profile, wheel and feedback revision
- Production build and all five logic tests passed.
- Prerendered `/roadmap` contains exactly ten `data-compliance-arrow` groups.
- Static output confirms home profile precedes Quality Challenge, Kenvue reads `Jan 2023 – Sept 2026`, API credential is fully spelled out, and Quality Manual replaces the former label.
- Internal route targets resolve. The original photo remains available at full resolution through the profile link.
- The physical shield's tiny lettering is not reliably legible in the supplied source photograph; it cannot be truthfully reconstructed. A fresh browser/device screenshot was not available in this environment, so responsive visual QA remains open.

## Corrected wheel and portrait revision
The source and prerendered HTML contain ten peripheral wheel labels and exactly ten `data-wheel-arrow` elements on both Home and `/roadmap`. The wheel is restored in its original roadmap section. Build and logic tests passed. A browser viewport/screenshot check remains outstanding in this environment.

## Home placement correction
The rendered Home HTML contains one hero review card, one ten-arrow QMS wheel below the hero, and the founder profile before Quality Challenge. The production build and five logic tests pass. Device-level visual QA still requires a browser preview.
