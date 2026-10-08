# Bahari Seafood website

Static English and Indonesian website for `https://seafood.baharinusantara.id/`. No build step or backend is required.

## Preview and checks

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

In a second terminal:

```sh
python3 tests/check_site.py
node --check js/main.js
```

`tests/browser-smoke.cjs` requires Playwright and Chromium. With those installed, run `node tests/browser-smoke.cjs`. Optional environment variables: `TEST_BASE_URL`, `CHROME_PATH` (an installed Chrome executable), and `SCREENSHOT_DIR` (an existing output directory). The test validates desktop/mobile pages and the WhatsApp handoff without opening WhatsApp or sending messages.

## Inquiry handling

The contact form prepares a WhatsApp message. The visitor must open the generated link and explicitly send the message in WhatsApp. The website does not send email, store submissions, or report delivery. Editing the form clears the prepared link so it cannot send stale details. Direct WhatsApp and email links remain available without JavaScript.

## Content and SEO

- Canonical homepages: `/` and `/id/`.
- Four product landing pages in each language, linked from the home catalog.
- Every page includes absolute reciprocal language alternates, canonical URL, social preview metadata, and Organization JSON-LD. Product pages also include breadcrumbs.
- Product specifications come from the existing catalog. Availability, size units where unspecified, storage/shelf-life conditions, MOQ, lead times and documents must be confirmed in the quotation. No new certification, capacity, price, stock or delivery guarantees were added.
- Update both language pages and `sitemap.xml` when adding a page. Run the link/language checks after editing.

## Deployment

Upload the HTML, `css/`, `js/`, `images/`, `videos/`, `files/`, `robots.txt`, `sitemap.xml`, and `.htaccess` together to the subdomain document root. Keep existing media and the company-profile PDF. Developer tests and this README do not need to be uploaded. Do not upload `.git/`.

`.htaccess` consolidates explicit `/index.html` and `/id/index.html` requests to the directory URLs with 301 redirects, preserving query strings. It is intended for Apache/LiteSpeed with per-directory rewrite rules enabled. These rules were tested on a local Apache server, but hosting settings must still be checked after deployment. On other servers, configure equivalent redirects in the hosting platform; canonical metadata remains present independently.

After deployment, verify both homepages, product pages, language switching, WhatsApp message preparation, the PDF download, redirects and `/sitemap.xml`. Clear the hosting cache if older HTML/JS persists. Submit `https://seafood.baharinusantara.id/sitemap.xml` in the owner's Google Search Console property and inspect the canonical URLs. Search Console submission, indexing status and real-user performance are not validated by the local tests.
