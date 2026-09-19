# AEM DA + Spartacus Setup

An Angular workspace with two apps that together demonstrate how to embed
[AEM Edge Delivery Services (EDS)](https://www.aem.live/) content — authored
in [da.live](https://da.live) — into a non-EDS host application (e.g. a
Spartacus/commerce storefront), and how to ship a piece of EDS-authored UI
(a site header) *back out* as a reusable custom element that an AEM DA block
can load.

This README is written for a team picking up this repo to integrate it into
a larger app. If you just need to run something and look at it, jump to
[Quick start](#quick-start).

## Contents

| Path | What it is |
|---|---|
| `src/` (workspace root app, project name `aem-embed-demo`) | Demo host app. Shows a non-EDS app fetching and rendering AEM DA fragments client-side. |
| `projects/vwr-header-mfe/` (project name `vwr-header-mfe`) | A standalone Angular Elements micro-frontend: one custom element (`<vwr-header-mfe>`) meant to be loaded *by* an AEM DA block, not by this workspace's own app. |
| `public/scripts/fragment-embed.js` | The custom element (`<fragment-embed url="...">`) that does the actual fragment-fetch-and-render work for the demo app. Framework-agnostic — no Angular dependency, could be reused in any host. |

These two apps solve opposite directions of the same integration problem:
getting AEM DA/EDS content and a non-EDS app to render inside each other.

## Prerequisites

- Node.js version matching this repo's Angular CLI (Angular 19 → Node 18.19+
  or 20.11+; check with `node -v`)
- npm (ships with Node)
- Angular CLI is used via the local `ng` script (`npm run ng -- ...`); no
  global install required

## Quick start

```bash
npm install

# Demo host app — fetches/renders an AEM DA fragment client-side
npm start                 # ng serve, http://localhost:4200

# Header micro-frontend — builds the standalone custom element bundle
npm run build -- vwr-header-mfe
```

---

## App 1: Demo host app (`aem-embed-demo`)

Shows a non-EDS app embedding AEM DA/EDS fragment content using a custom
element with Shadow DOM, following the pattern in
[aem.live/docs/aem-embed](https://www.aem.live/docs/aem-embed).

### How it works

- [`public/scripts/fragment-embed.js`](public/scripts/fragment-embed.js)
  defines `<fragment-embed url="...">`. It attaches a Shadow DOM (isolating
  embedded content's CSS from the host app), fetches the fragment's
  `.plain.html` into a `<main>` wrapper, loads the source project's base
  `styles.css`/`fonts.css`, then finds the block div(s) in that markup and
  loads each block's own `{name}.js`/`{name}.css` from the source origin and
  runs its `decorate()` export.
- Remote stylesheets are fetched as **text** and injected as `<style>`
  elements rather than `<link>` tags, with two rewrites applied:
  - Any `:root { ... }` rule is duplicated as `:root, :host { ... }` — design
    tokens are defined under `:root` in the source project's CSS, but `:root`
    never matches inside a Shadow DOM, so via a plain `<link>` none of those
    custom properties would apply. This is the client-side equivalent of the
    "add `:host` selectors alongside `:root`" adjustment the aem-embed doc
    asks source projects to make.
  - `url(...)` references (fonts, background images) and one level of
    `@import` are resolved to absolute URLs against the stylesheet's own
    location, since an inlined `<style>`'s relative URLs would otherwise
    resolve against *this* app instead of the source origin.
- The fetched fragment markup has no `.section` class on the block's wrapper
  div (normally added by the source project's own decoration pass, which we
  don't run — see "Why not the stock `aem-embed.js`?" below). Block CSS
  commonly scopes rules as `main .section .block-name ...`, so
  `fragment-embed.js` tags that wrapper as `.section` and wraps the fetched
  markup in a real `<main>` to match.
- It must be served from `/scripts/fragment-embed.js` at the app root so its
  origin-relative lookups (`/blocks/**`, `/styles/**`) resolve against the
  *source* project. Angular's application builder copies everything under
  `public/` to the output root, which is why the file lives at
  `public/scripts/fragment-embed.js`.
- [`src/index.html`](src/index.html) loads it with
  `<script src="/scripts/fragment-embed.js" type="module"></script>`.
- [`HeroFragmentComponent`](src/app/hero-fragment/hero-fragment.component.ts)
  and
  [`CardFragmentComponent`](src/app/card-fragment/card-fragment.component.ts)
  each render one `<fragment-embed url="...">`, pointing at two different
  fragments on two different domains (`.aem.page` vs `.aem.live`) —
  `fragment-embed.js` doesn't care which, it derives `origin` from whatever
  `url` it's given. Both are unknown elements to Angular's template compiler,
  so each component declares `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.

### What actually gets fetched at runtime

Only the fragment URL is configured in the app. `fragment-embed` fetches
`.../fragments/{name}.plain.html`, finds the block in that markup, and loads
`/blocks/{block}/{block}.css` + `/blocks/{block}/{block}.js` from the source
origin automatically — so three URLs are involved per fragment, but only the
fragment URL needs to be written down anywhere in this app.

### Why not the stock `aem-embed.js`?

The [reference implementation](https://github.com/adobe/aem-embed) decorates
a fragment by dynamically importing the *source project's own*
`scripts.js`/`aem.js` and running its full `decorateMain()`. That works for a
plain content site, but a Commerce/dropins-enabled AEM project's `scripts.js`:

1. Statically imports bare specifiers like `@dropins/tools/lib.js`, which only
   resolve via an import map the source site publishes in its own `<head>` —
   absent here, so the import throws immediately.
2. Bootstraps AEM Commerce config and reads DOM elements (e.g. a real
   page-level `<header>`) that only exist on the actual site — both of which
   throw when run inside a foreign host page, regardless of anything the
   embedding app does.

Point 2 can't be fixed from the embedding side — it requires the source
project's own `scripts.js`/`aem.js` to be written with embedding in mind (the
aem-embed doc's "required adjustments to source project" section gestures at
this — guarding `loadPage()`, handling pre-existing DOM in header/footer —
but doesn't cover a commerce-config bootstrap). `fragment-embed.js` instead
skips that bootstrap and applies only the block convention a fragment
actually needs.

**If the source project is later made embed-safe**, or you're embedding a
non-commerce fragment from a plainer AEM project, the stock `aem-embed.js`
from `adobe/aem-embed` is the more complete, spec-compliant choice: vendor
its `scripts/aem-embed.js` into `public/scripts/`, load it the same way from
`index.html`, and swap the element back to `<aem-embed url="...">`.

### Known limitation: CORS

If the source AEM DA project does not send an `access-control-allow-origin`
header on the fragment/block/script/style responses, the browser will show a
CORS error in the console instead of rendering the fragment (this is a
per-source-project header, so it may or may not already be fixed by the time
you're integrating — check the console first).

To enable it, the owner of the source da.live project needs to add response
headers, either via
`https://labs.aem.live/tools/headers-edit/index.html` or the config API (see
[aem.live/docs/custom-headers](https://www.aem.live/docs/custom-headers)):

```bash
curl -X POST https://admin.hlx.page/config/{org}/sites/{site}/headers.json \
  -H 'content-type: application/json' \
  -H 'x-auth-token: {your-auth-token}' \
  --data '{
    "/us/en/fragments/**": [{ "key": "access-control-allow-origin", "value": "*" }],
    "/blocks/**":          [{ "key": "access-control-allow-origin", "value": "*" }],
    "/scripts/**":         [{ "key": "access-control-allow-origin", "value": "*" }],
    "/styles/**":          [{ "key": "access-control-allow-origin", "value": "*" }]
  }'
```

Scope `value` to a specific origin instead of `*` for anything beyond a demo.

### Run / build / test

```bash
npm start          # ng serve → http://localhost:4200
npm run build       # ng build (root app) → dist/aem-embed-demo
npm test            # ng test (Karma/Jasmine)
```

The demo page presents both directions as three tabs: two `fragment-embed`
tabs (AEM → App) and a third tab that loads the header MFE (App → AEM). That
third tab needs the `vwr-header-mfe` bundle served alongside the demo, so
`npm start` and `npm run build` both run `build:mfe` first via npm's
`prestart`/`prebuild` hooks — see
[Serving the MFE alongside the demo](#serving-the-mfe-alongside-the-demo).

---

## App 2: Header micro-frontend (`projects/vwr-header-mfe`)

A standalone, zoneless Angular Elements bundle that exposes one custom
element, `<vwr-header-mfe>`, meant to be loaded by an AEM DA **`mfe` block**
(a block pattern that `await import()`s a script and instantiates a custom
element tag), not by this workspace's app itself.

### How it works

- [`src/main.ts`](projects/vwr-header-mfe/src/main.ts) is the entry point.
  On load it registers the element:
  ```ts
  const TAG_NAME = 'vwr-header-mfe';
  if (!customElements.get(TAG_NAME)) {
    const app = await createApplication({
      providers: [provideExperimentalZonelessChangeDetection()],
    });
    const element = createCustomElement(VwrHeaderComponent, { injector: app.injector });
    customElements.define(TAG_NAME, element);
  }
  ```
  **Contract to preserve:** the `mfe` block does
  `await import(scriptUrl)` and only *then* does
  `document.createElement(tagName)` — so `customElements.define` must have
  already run by the time the dynamic `import()` promise resolves. A dynamic
  `import()` resolves once the module's top-level synchronous execution
  (including top-level `await`, as used here) completes — it does *not* wait
  for an unawaited async IIFE's internal awaits. Keep the top-level `await`
  form; don't refactor it into a fire-and-forget `(async () => {...})()`.
- [`VwrHeaderComponent`](projects/vwr-header-mfe/src/app/vwr-header.component.ts)
  is the actual header: standalone, `ViewEncapsulation.ShadowDom`,
  `OnPush`/zoneless change detection. It renders a mega-menu nav (desktop:
  click to open/close per section; below `900px` width: accordion), driven by
  static data in
  [`nav-data.ts`](projects/vwr-header-mfe/src/app/nav-data.ts) (`NAV_SECTIONS`,
  `SITE_ORIGIN`). Behavior mirrors the source site's own header
  block (open/close breakpoint, outside-click and Escape-to-close handling).
- All user-facing words in the header come from a labels object
  ([`labels.ts`](projects/vwr-header-mfe/src/app/labels.ts)), so the element can
  be localized by the AEM DA block that mounts it — see
  [Localized labels](#localized-labels-the-labels-contract).

### Localized labels (the `labels` contract)

**Input name:** `labels` — exposed both as an **attribute** (JSON string) and as
a **property** (already-parsed object) on `<vwr-header-mfe>`. Shape: a flat
object of `string` values, exactly what an AEM DA JSON sheet row (`data[0]`)
looks like.

```js
// In the AEM DA `mfe` block, after fetching the labels sheet:
const sheet = await (await fetch('/us/fr/nav-labels.json')).json();
const el = document.createElement('vwr-header-mfe');

// Attribute form (JSON string) …
el.setAttribute('labels', JSON.stringify(sheet.data[0]));
// … or property form (object) - equivalent:
el.labels = sheet.data[0];

block.append(el);
```

Or declaratively in markup:

```html
<vwr-header-mfe labels='{"login":"Connexion","register":"Créer un compte"}'></vwr-header-mfe>
```

Expected JSON shape (every key optional; the value shown is the English
default used when the key is absent):

```json
{
  "openNavigation": "Open navigation",
  "closeNavigation": "Close navigation",
  "brandAlt": "VWR, part of Avantor",
  "searchPlaceholder": "Search by keyword, supplier, or part number",
  "search": "Search",
  "askAi": "Ask AI",
  "login": "Login",
  "register": "Register",
  "account": "Account",
  "country": "United States",
  "countryPrefix": "Country",
  "allCategories": "All Categories",
  "orderEntry": "Order Entry",
  "cart": "Cart",
  "cartSubtotal": "$0.00",
  "nav./us/en/products": "Products",
  "nav./us/en/products/chemicals": "Chemicals"
}
```

- `countryPrefix` + `country` compose the country button's `aria-label`
  (`"Country: United States"` → `"Pays: France"`).
- **Nav entries** are overridden per link by its href path, using flat
  `nav.<href>` columns — the realistic DA sheet shape, where a row is a set of
  named string columns. The same overrides may also be passed as a nested
  object (`{ "nav": { "/us/en/products": "Produits" } }`) by hosts that can
  send richer JSON. Hrefs not listed keep their `nav-data.ts` label.

Tolerance rules (`normalizeLabels` in `labels.ts`, covered by
`labels.spec.ts`):

- Missing, `null`, empty, or malformed JSON → English defaults, no throw.
- Unknown keys, non-string values, and blank/whitespace values are ignored.
- A whole sheet (`{ "data": [ { ... } ] }`) or bare array is unwrapped to its
  first row, so passing the raw sheet also works.
- Supplying no `labels` at all leaves the header byte-for-byte as before.

### Integrating this into the AEM DA project

1. Build the bundle: `npm run build -- vwr-header-mfe` → output in
   `dist/vwr-header-mfe/browser/` (entry: `main.js`).
2. Host `main.js` (and any chunked assets alongside it) somewhere the AEM DA
   `mfe` block can reach at runtime — e.g. publish under that project's own
   `/scripts/` path, or another origin with CORS enabled (see the CORS note
   above; the same constraint applies here).
3. Point the `mfe` block's config (its `_mfe.json` "Tag Name" field, per the
   comment in `main.ts`) at that script URL and the tag name
   `vwr-header-mfe`.
4. Update `SITE_ORIGIN` in `nav-data.ts` (and `NAV_SECTIONS` if nav structure
   differs) to match the target site before building, if this is being
   pointed at a different environment/domain than what's currently
   hardcoded.
5. For a non-English locale, author a DA labels sheet and pass its `data[0]`
   row into the element as the `labels` attribute/property — see
   [Localized labels](#localized-labels-the-labels-contract).

### Run / build / test

```bash
npm start -- vwr-header-mfe          # ng serve for this project only
npm run build -- vwr-header-mfe       # → dist/vwr-header-mfe
npm test -- vwr-header-mfe
```

### Serving the MFE alongside the demo

`vwr-header-mfe` is its own `angular.json` build target with its own
`outputPath` (`dist/vwr-header-mfe`), so it is never part of the
`aem-embed-demo` bundle. For the demo's third tab to `await import()` the
*real* bundle — the same thing the `mfe` block does — the artifacts of the two
independent builds are flattened into one deployable output:

1. `npm run build:mfe` builds the MFE target, then
   [`scripts/stage-mfe.mjs`](scripts/stage-mfe.mjs) copies
   `dist/vwr-header-mfe/browser/` into `public/vwr-header-mfe/` (gitignored —
   it is build output, not source).
2. `public/` is already an asset input for the root app, so a normal
   `ng build` emits it at `dist/aem-embed-demo/browser/vwr-header-mfe/main.js`
   and `ng serve` serves it at `/vwr-header-mfe/main.js`.
3. The demo panel imports that URL and lets the script's own
   `customElements.define` side effect register the tag, exactly as the block
   would.

`prestart` and `prebuild` run step 1 automatically, so plain `npm start` and
`npm run build` are still the only commands needed. `vercel.json` pins the
same `buildCommand` (`npm run build`) and the `outputDirectory`
(`dist/aem-embed-demo/browser`) so the deployment picks up both builds.

---

## Repo structure

```
.
├── src/                          # Root app: aem-embed-demo (fragment embed demo)
│   ├── app/
│   │   ├── hero-fragment/
│   │   ├── card-fragment/
│   │   ├── header-mfe/           # Loads <vwr-header-mfe> via await import(), like the mfe block
│   │   └── embed-panel/          # Shared panel: direction badge + "Show embed code" toggle
│   └── index.html
├── public/
│   └── scripts/
│       └── fragment-embed.js     # Framework-agnostic <fragment-embed> custom element
├── scripts/
│   └── stage-mfe.mjs             # Flattens dist/vwr-header-mfe into public/ for the demo
├── projects/
│   └── vwr-header-mfe/           # Header micro-frontend, built independently
│       ├── src/
│       │   ├── app/
│       │   │   ├── vwr-header.component.ts
│       │   │   ├── labels.ts        # `labels` input contract + English defaults
│       │   │   └── nav-data.ts
│       │   └── main.ts           # Registers <vwr-header-mfe> custom element
│       └── public/
├── angular.json                  # Defines both projects: "aem-embed-demo" (root) and "vwr-header-mfe"
├── vercel.json                   # buildCommand + outputDirectory for the combined deploy
└── package.json
```

## Scripts reference

| Command | Effect |
|---|---|
| `npm start` | Serves the root demo app (`aem-embed-demo`) at `localhost:4200` (runs `build:mfe` first) |
| `npm start -- vwr-header-mfe` | Serves the header MFE standalone |
| `npm run build` | Builds the root app → `dist/aem-embed-demo` (runs `build:mfe` first) |
| `npm run build -- vwr-header-mfe` | Builds the header MFE → `dist/vwr-header-mfe` |
| `npm run build:mfe` | Builds the header MFE and stages it into `public/vwr-header-mfe/` |
| `npm run watch` | Root app build in watch mode (development config) |
| `npm test` | Root app unit tests (Karma/Jasmine) |
| `npm test -- vwr-header-mfe` | Header MFE unit tests |

Both projects live in one Angular CLI workspace (`angular.json`), so all
commands run from the repo root — pass the project name as an extra CLI arg
to target `vwr-header-mfe` specifically; omitting it targets the root app.
