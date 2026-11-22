# CampusCycle

A second-hand marketplace for students. CampusCycle lets students **sell, give away or swap**
textbooks, calculators, laptops, cycles and hostel essentials with people on their own campus —
no shipping, no payment processing, no middleman.

This repository is being built in stages. **Steps 1–7 are complete.** Every screen is designed,
responsive and interactive; the whole product experience runs on real MongoDB data through a
MongoDB/Mongoose REST API behind `/api`; `/marketplace` has full discovery — search, faceted filters,
price range, sorting and pagination, all executed by MongoDB; the product detail page and seller
profile are complete; the enquiry and offer system is live end to end; and favourites and the
student dashboard are backed by the same API.

- 📐 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the Step 0 blueprint (data model, business
  rules BR-1…BR-24, folder conventions).
- 🔌 [`docs/API.md`](docs/API.md) — the Step 2 endpoint reference (every route, envelope, error
  code, schema, and curl example).

---

## Tech stack

| Layer      | Choice                                            |
| ---------- | ------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack, React 19)      |
| Language   | TypeScript (strict)                               |
| Styling    | Tailwind CSS 4 (`@tailwindcss/turbopack`)         |
| Icons      | `lucide-react`                                    |
| Data (API) | MongoDB + Mongoose (`lib/db`, `app/api`)          |
| Validation | Zod (shared by the API and the forms)             |
| Data (UI)  | Server Components read MongoDB through `lib/services` |

---

## Getting started

Requires **Node.js 20.9+** (Next.js 16 minimum), npm, and a **MongoDB** instance
(local `mongod`, or a free MongoDB Atlas cluster).

```bash
npm install

# 1. Point the app at your database
cp .env.example .env.local        # macOS / Linux
copy .env.example .env.local      # Windows
# then edit MONGODB_URI if you are not using localhost

npm run dev
```

Open <http://localhost:3000>. Check the API and the database connection at
<http://localhost:3000/api/health>.

`.env.local` is **gitignored** and holds your connection string. Never commit it,
and never expose it to the browser — see [Environment variables](#environment-variables).

### Scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload.               |
| `npm run build`     | Production build (also runs the TypeScript check).  |
| `npm run start`     | Serve the production build.                         |
| `npm run lint`      | ESLint over the whole project.                      |
| `npm run typecheck` | `tsc --noEmit`, no output files.                    |

All three checks (`build`, `lint`, `typecheck`) pass on a clean checkout.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is gitignored.

| Variable | Scope | Purpose |
| -------- | ----- | ------- |
| `MONGODB_URI` | **server only** | MongoDB connection string (**secret**). |
| `MONGODB_DB_NAME` | server only | Optional. Overrides the database name in the URI. |
| `NEXT_PUBLIC_APP_URL` | public | Canonical URL for metadata and links. |
| `NEXT_PUBLIC_MAX_IMAGES` | public | Image limit for the future uploader (default 5). |

Only `NEXT_PUBLIC_*` variables reach the browser. `MONGODB_URI` is read exclusively by
server-side code (`lib/db/connect.ts`, which imports `server-only`), so it can never end up in a
client bundle. Full details are in [`docs/API.md`](docs/API.md#6-environment-variables).

---

## Routes

| Route                     | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `/`                       | Landing page: hero search, categories, newest, free/exchange.  |
| `/marketplace`            | Browse with search, filters, sorting and pagination.           |
| `/marketplace/[id]`       | Listing detail: gallery, details, seller, similar listings.    |
| `/sell`                   | Create-a-listing form with live card preview.                  |
| `/favorites`              | Saved listings from `/api/favorites`, with availability states. |
| `/dashboard`              | Overview: the six live counters across listings, enquiries, offers, favourites. |
| `/dashboard/listings`     | Manage your listings: edit, change status, delete.             |
| `/dashboard/enquiries`    | Received / sent enquiries; accept, reject or cancel (real data). |
| `/dashboard/offers`       | Received / sent offers; accept, reject, counter or withdraw.    |
| `/marketplace/[id]/edit`  | Edit one of your own listings (owner-only, 404 otherwise).     |
| `/setup`                  | Create or pick the student profile this browser acts as.       |
| `/seller/[id]`            | Public seller profile: contact preference, active + sold items. |

---

## Project structure

```
app/                     App Router routes (pages, layouts, loading/error/not-found)
  api/                   Step 2 route handlers (products, enquiries, offers, favorites, users, health)
components/
  common/                Shared presentational bits (InfoBanner)
  dashboard/             Dashboard-only components (nav, stat card, request cards)
  layout/                Shell: header, footer, mobile nav, container, page header
  listings/              Listing card/grid/gallery, badges, sell form, contact dialogs
  marketplace/           Search, sort, filters, active chips, toolbar
  providers/             FavoritesProvider (API-backed favourites state)
  ui/                    Design-system primitives (button, input, card, badge, …)
hooks/                   useMarketplaceNavigation, useIdentity
lib/
  api/                   Envelope + error helpers, error-handler wrapper, query/body parsing, actor
  db/                    Cached Mongoose connection, models, enums, DTO serializers
  services/              Business logic per resource (products, enquiries, offers, favorites, users)
  validators/            Zod schemas per resource
  utils/                 Small helpers (regex escaping, …)
  …                      Types, constants, filtering, stores
docs/                    ARCHITECTURE.md (Step 0 blueprint) + API.md (Step 2) + STEP-3…7.md reports
```

### The important files

- **`lib/types.ts`** — every domain type (`Listing`, `Student`, `Enquiry`, `Offer`, `ApiFavorite`, …).
  These are the shapes the API returns, so they are the contract. The `Api*` variants are re-declared
  here (rather than imported from `lib/db/serialize.ts`) so client components never pull in a
  `server-only` module just for a type.
- **`lib/marketplace.ts`** — the URL ⇄ filter-object translation (`parseMarketplaceFilters`,
  `filtersToProductQuery`, `filtersToSearchParams`, `collectFilterIssues`). It validates and
  normalises the query; the actual filtering happens in MongoDB via `listProducts`. The server page
  and the API route share exactly this logic, so behaviour can never drift between them.
- **`lib/contact.ts`** — the enquiry/offer **payload builders** (`buildEnquiryDraft` /
  `buildOfferDraft`) and shared Zod schemas. From Step 6 the dialogs POST real bodies through the
  `lib/contact.ts` endpoints; the builders keep the client and server shapes in step.
- **`lib/constants.ts`** — categories, conditions, listing types, sort options, enquiry/offer
  statuses and their display labels. One source of truth for every label in the UI.
- **`lib/favorites-store.ts` + `components/providers/favorites-provider.tsx`** — the favourites seam.
  The store is a thin client over `GET/POST/DELETE /api/favorites`; the provider hydrates the id set
  for the acting student and applies every save/remove optimistically (with rollback + toast). No
  component knows about HTTP.
- **`lib/navigation.ts`** — the header and dashboard nav link definitions.
- **`lib/db/connect.ts`** — the cached Mongoose connection (Step 2). Connects lazily, reuses the
  connection across requests, and creates indexes once per process.
- **`lib/db/models/`** — the five Mongoose schemas (`User`, `Product`, `Enquiry`, `Offer`,
  `Favorite`), each with its indexes and field validation.
- **`lib/api/`** — the response envelope, the `ApiError` type, the `withErrorHandler` wrapper
  that maps Zod/Mongoose errors to HTTP, and the actor/query/body helpers.
- **`lib/services/`** — the business logic, one file per resource. All the BR-x rules live here.
- **`lib/validators/`** — the Zod schemas that define what the API accepts (and, from Step 3,
  what the forms accept too).
- **`docs/ARCHITECTURE.md`** — the full blueprint: data model, API contract, business rules
  (BR-1 … BR-25), validation rules and folder conventions.
- **`docs/API.md`** — the Step 2 endpoint reference: every route, the envelope, every error
  code, the database schema, and copy-pasteable examples.

### How the marketplace state works

The URL **is** the query state. `/marketplace` reads `searchParams` on the server, runs the query
through `listProducts` (MongoDB) and renders the grid. The only client component is the toolbar,
which pushes new URLs (`?q=…&category=…&sort=…`) — search is debounced and uses `replace` so it
does not flood history. That means:

- Results are shareable and bookmarkable.
- The back/forward buttons work as expected.
- No client-side data fetching or state-syncing bugs.
- The browser only ever receives the current page of already-filtered results.

---

## Step 1 status

**Done — the entire UI, on mock data.**

- [x] Root layout, fonts, metadata, global styling with Tailwind 4 theme tokens.
- [x] Navbar, footer, and a responsive mobile navigation drawer.
- [x] Home page with hero search, category grid, newest and free/exchange sections.
- [x] Marketplace: search, category/type/condition/price filters, sorting, active-filter chips,
      pagination, empty state, loading skeleton.
- [x] Listing detail page: gallery, details, seller card, contact dialogs, similar listings.
- [x] Sell form with real validation and a live listing-card preview.
- [x] Favourites, dashboard (overview/listings/enquiries/offers) and seller profile pages.
- [x] Reusable `ui/` primitives; no duplicated large JSX blocks.
- [x] Error boundary, global error boundary and not-found pages.
- [x] Light-mode only, mobile-first, keyboard-accessible.

**Deliberately not in Step 1** (see `docs/ARCHITECTURE.md` for the plan):

- No MongoDB, Mongoose models, or API routes.
- No authentication — the dashboard always shows the demo student.
- No image uploads; listings render a category tile instead.
- No dark mode.
- Write actions (mark sold, accept offer, publish listing) are disabled with an explanatory
  banner, because there is nothing to persist to yet.

---

## Step 2 status

**Done — the entire backend foundation, verified end to end.**

- [x] Production-quality MongoDB connection utility: env-var driven, cached on `globalThis`
      (survives HMR and serverless invocations), `bufferCommands: false` to fail fast,
      `server-only` so the URI can never reach the client.
- [x] Explicit, idempotent index creation (`ensureIndexes()`), because Mongoose's implicit
      `autoIndex` is disabled in production.
- [x] Five Mongoose models — `User`, `Product`, `Enquiry`, `Offer`, `Favorite` — with indexes,
      validation and soft deletes.
- [x] Standard response envelope (`{ success, data, meta? }` / `{ success, error, code, details? }`)
      and a typed `ApiError` → HTTP-status mapping.
- [x] Zod validators for every write endpoint, plus typed query-param parsing.
- [x] Service layer with all the Step 0 business rules (BR-2 … BR-24) enforced.
- [x] Route handlers for products, enquiries, offers, favorites, users and health.
- [x] `npm run build`, `npm run lint` and `npm run typecheck` all pass.
- [x] Verified with a 65-assertion end-to-end smoke test against a real MongoDB (65 passed,
      0 failed), including the partial-unique and text indexes.

**Deliberately not in Step 2** (see `docs/ARCHITECTURE.md` for the plan):

- No authentication — identity is the `x-student-id` header (data integrity, not security).
- No UI wiring: the pages still read `lib/mock-data.ts`. Swapping them to `fetch` is Step 3.
- No image uploads; `images` is a URL array.
- No seed script — create data through the API instead.
- `/api/dashboard/stats`, `/api/meta/categories` and the `/api/students/me` family are deferred.

### API at a glance

| Method | Route | Purpose |
| ------ | ----- | ------- |
| `GET` | `/api/health` | Liveness + DB connectivity. |
| `GET` `POST` | `/api/users` | List / create student profiles (identity bootstrap). |
| `GET` `POST` | `/api/products` | Browse & search / create a listing. |
| `GET` `PUT` `PATCH` `DELETE` | `/api/products/[id]` | Read / update / soft-delete (owner only). |
| `GET` `POST` | `/api/enquiries` | List the actor's enquiries / submit one. |
| `GET` `PUT` `PATCH` | `/api/enquiries/[id]` | Read / accept · reject · withdraw · close. |
| `GET` `POST` | `/api/offers` | List the actor's offers / submit one. |
| `GET` `PUT` `PATCH` | `/api/offers/[id]` | Read / accept · reject · withdraw. |
| `GET` `POST` `DELETE` | `/api/favorites` | List / save / unsave (always actor-scoped). |

Every endpoint, with request/response bodies and curl examples, is documented in
**[`docs/API.md`](docs/API.md)**.

> **Indexes:** they are created once per process on the first database connection, so simply
> hitting `/api/health` (or any endpoint) after a fresh database is enough to provision them.
> Nothing relies on Mongoose `autoIndex`, which is off everywhere.

---

## Step 3 status

**Done — the frontend now runs on real MongoDB data, with full Product CRUD.**

- [x] **Identity without auth.** A non-`httpOnly` cookie (`campuscycle_student_id`) holds the
      acting student's `_id`. The browser sets it in `lib/identity.ts`; Server Components read the
      same cookie through `next/headers` (`lib/session.ts`); writes send it as `x-student-id`.
      New visitors are routed through `/setup` to create a profile.
- [x] **Marketplace reads the database.** Home, `/marketplace`, the detail page and the seller
      profile call the product/user services directly (Server Components), not `lib/mock-data.ts`.
- [x] **Create.** `/sell` renders a form with client validation, a live card preview, and a real
      `POST /api/products` (returns `201`).
- [x] **Read.** `/marketplace` (search, filters, sort, pagination) and `/marketplace/[id]` show
      real listings with a real seller profile.
- [x] **Update.** `/marketplace/[id]/edit` (owner-only) pre-fills the form and sends `PUT`.
- [x] **Status updates.** `/dashboard/listings` changes status inline (`available` · `reserved` ·
      `sold` · inactive) through `PATCH /api/products/[id]`, with the allowed transitions enforced
      server-side.
- [x] **Delete.** Soft-delete from the dashboard (`DELETE /api/products/[id]`); the row disappears
      from browse and the detail URL becomes a `404`.
- [x] **Validation on both sides.** The forms reuse the server's Zod schemas
      (`lib/validators/product.ts`, `lib/validators/user.ts`), so client and server can never drift.
- [x] **Loading / empty / error / success states.** Route- and section-level skeletons, empty
      states for filtered and personal lists, an error boundary, and a toast provider for
      success feedback. Every mutation calls `router.refresh()`, so the UI reflects the database.
- [x] `npm run build`, `npm run lint` and `npm run typecheck` all pass.
- [x] Verified with a 54-assertion API suite and a 33-assertion page suite against a real MongoDB
      (both fully green), including real `307` redirects and real `404`s.

**Deliberately not in Step 3** (still out of scope):

- No authentication — identity is a self-declared cookie/header, for data integrity only.
- No offers, enquiries or favourites wiring; those pages still read `lib/mock-data.ts` and show a
  "not part of this step" notice where they would list live data.
- No image uploads — `images` stays a URL array (up to five URLs in the form).
- No search-index or geospatial work.

### How a write flows

```
Form (client)                 API route                       Service + Mongo
─────────────                 ─────────                       ───────────────
validate with Zod  ──POST──▶  parse body (Zod)  ──────────▶   requireActor(x-student-id)
(lib/validators)              withErrorHandler                 apply business rules (BR-x)
                              ─◀─ 201 { success, data }  ◀──   Mongoose save / find
router.refresh()  ◀── re-render Server Components from the DB
```

Reads skip the HTTP hop: a Server Component calls the service directly after
`await connectToDatabase()`, so the page and the API always agree on filtering.

---

## Step 4 status

**Done — complete marketplace discovery on real MongoDB data.**

- [x] **Search** by product name and description — a case-insensitive substring regex
      (`escapeRegex`-guarded, so `?q=[` returns `200`, not `500`). Tags are matched too.
- [x] **Filter** by category, condition, listing type, minimum price and maximum price —
      AND across facets, `$in` for multi-value facets, `$gte`/`$lte` for price.
- [x] **Sort** by newest, price low→high and price high→low (plus most-viewed), each with a
      `createdAt` tie-breaker for stable paging.
- [x] **Pagination** — `page`/`limit` (1–48) via `skip`/`limit`, real links, accurate
      `meta.total` computed by `countDocuments` on the filtered query.
- [x] **Clear filters** — "Clear all", per-chip ✕ and the empty-state action all return to
      `/marketplace`.
- [x] **Empty state** — a dedicated "No listings match those filters" panel when `meta.total = 0`.
- [x] **Filters preserved in the URL** — the URL is the query state; defaults are omitted, so a
      filtered browse is shareable and back/forward-safe.
- [x] **Debounced search** — 350 ms `useDebouncedValue`, `replace` navigation, and a spinner driven
      by `useTransition`.
- [x] **Filtering through the backend, not the browser** — both `/marketplace` and
      `GET /api/products` call `listProducts`; the browser only receives the current page of
      already-filtered results. The Step 1 in-memory `filterListings`/`sortListings` were deleted.
- [x] **Error handling** — the API rejects invalid price/category/sort/page/limit with
      `400 VALIDATION_ERROR`; the page tolerates bad links, shows a "filters ignored" banner, and
      has a marketplace error boundary for database failures.
- [x] `npm run build`, `npm run lint` and `npm run typecheck` all pass.
- [x] Verified with a 56-assertion discovery suite plus the 54-assertion and 33-assertion Step 3
      regressions — all green against a real MongoDB.

**Deliberately not in Step 4** (still out of scope):

- No enquiries, offers or favourites wiring — those pages still read `lib/mock-data.ts`.
- No authentication — identity stays a self-declared cookie/header, for data integrity only.
- No image uploads, geospatial search or `$text` ranking (substring search is intentional).

Full write-up — API query examples, frontend flow, backend filtering logic and the checklist — is in
**[`docs/STEP-4.md`](docs/STEP-4.md)**.

### How a browse request flows

```
URL (?q=&category=&minPrice=&sort=&page=)
  │
  ├─ API caller ──▶ GET /api/products ─┐
  │                                    ├─▶ productQuerySchema (Zod) ─▶ listProducts(query)
  └─ /marketplace (Server Component) ──┘                                   │
        parseMarketplaceFilters ─ filtersToProductQuery ───────────────────┘
                                                                           │
        Mongo filter: status "available" (BR-6) + $in facets + price $gte/$lte + $or regex
                     .sort(buildSort(sort)).skip((page-1)*limit).limit(limit)
                                                                           │
        ◀── { items: ProductDto[], meta: { page, limit, total, totalPages } }
```

---

## Step 5 status

**Done — the product detail page and seller profile, on real MongoDB data.**

- [x] **Product detail** (`/marketplace/[id]`) — image gallery, title, price, listing type,
      condition, description, category, status, posted date, seller information, a seller profile
      link, contact/enquiry + make-offer + favourite CTAs, and similar listings.
- [x] **Seller profile** (`/seller/[id]`) — seller name, contact preference, active listings, sold
      listings, listing counts and a short listing history.
- [x] **Real data** — both pages read MongoDB through the service layer in Server Components.
- [x] **Product not found** — a real `404` (`not-found.tsx`); deleted/inactive listings are excluded.
- [x] **Seller not found** — a real `404` (`not-found.tsx`).
- [x] **Sold product** — reachable by link with an explicit "This item has been sold" notice; CTAs
      disabled.
- [x] **Inactive product** — soft-deleted rows are hidden and their URL is a `404`.
- [x] **Loading state** — `<Suspense>` skeletons while the seller/viewer/similar reads stream.
- [x] **API / database errors** — route-level `error.tsx` boundaries with retry (a DB outage is never
      shown as "listing removed").
- [x] **Contact preference** — a new `contactPreference` field (`message` · `email` · `either`) on the
      user model, validators, serializer and setup form; shown as a label only, never the email.
- [x] **Enquiry/offer integration points** — `lib/contact.ts` builds and validates the exact future
      request bodies; **no backend is implemented and nothing is sent**.
- [x] `npm run build`, `npm run lint` and `npm run typecheck` all pass.
- [x] Verified with a 55-assertion page suite plus the 54-, 33- and 56-assertion Step 3/4
      regressions — all green against a real MongoDB.

**Deliberately not in Step 5** (still out of scope):

- No enquiry or offer **backend** — the CTAs and dialogs are UI + integration points only.
- No authentication — identity stays a self-declared cookie/header, for data integrity only.
- No image uploads — the gallery renders a category tile until `images` are populated.
- Favourites still persist in `localStorage` (no `/api/favorites` wiring).

Full write-up — changed files, dynamic routing, data flow, state coverage and the checklist — is in
**[`docs/STEP-5.md`](docs/STEP-5.md)**.

### How a listing detail request flows

```
GET /marketplace/:id
  │
  ├─ getProductById(id) ─▶ Product.findOne({ _id, status: { $ne: "deleted" } }).populate(seller)
  │      ✗ missing/removed ─▶ notFound()  (real 404)      ✗ DB failure ─▶ error.tsx
  │
  └─ <Suspense>  ListingDetailContent (Promise.all)
        ├─ resolveSeller(sellerId)   ─▶ full profile (card: name, campus, stats, preference)
        ├─ getCurrentStudentId()     ─▶ cookie viewer id (own-listing detection)
        └─ listProducts(category, available) ─▶ similar listings
        ▼
   gallery · price · details · contact dialogs · seller card · similar listings
```

---

## Step 6 status

**Done — the complete enquiry and offer system, end to end.**

- [x] **Enquiry form + API** — the listing detail CTAs POST real bodies to `/api/enquiries`
      (`productId`, `buyerId`, `sellerId`, `message`, optional `offerPrice`) with inline field
      errors and a success/error toast.
- [x] **Seller enquiry inbox** (`/dashboard/enquiries`) — real received enquiries with a **Sent**
      tab for the buyer side, and accept / reject actions with an optional reply.
- [x] **Buyer cancel** — a buyer cancels their own pending enquiry; every terminal state is final.
- [x] **Offer form + API** — `POST /api/offers` (`offerPrice`, `message`, optional `enquiryId`);
      the service snapshots the asking price into `originalPrice`.
- [x] **Seller offer management** (`/dashboard/offers`) — real received offers plus a **Sent** tab,
      with accept / reject / **counter** actions.
- [x] **Counter offers** — the seller counters a pending offer with a price strictly between the
      buyer's offer and the asking price (BR-25); the buyer then accepts, rejects or withdraws.
- [x] **Status transitions** — enquiry `pending → accepted | rejected | cancelled`; offer
      `pending → accepted | rejected | withdrawn | countered` and `countered → accepted | rejected |
      withdrawn`. An illegal move is **422 RULE_VIOLATION**; the wrong side gets **403**.
- [x] **Business rules** — own listing **403** (BR-5); non-`available` product **409**
      (BR-6/22); offers on free/exchange **422** (BR-7); one pending per (product, buyer) **409**
      (BR-10/11); `offerPrice > 0` and `<` asking **422** (BR-21); accepting an offer reserves the
      product and auto-rejects the sibling pending + countered offers (BR-14).
- [x] **Timestamps** — `createdAt` / `updatedAt` / `respondedAt` maintained; accepting an offer
      recalculates the seller's denormalised stats (BR-24).
- [x] **API error responses** — every failure path returns the standard envelope with a stable code
      (`VALIDATION_ERROR`, `UNAUTHORIZED_ACTOR`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE`,
      `LISTING_UNAVAILABLE`, `RULE_VIOLATION`).
- [x] **Dashboard overview** — real received enquiry and offer counts (with "waiting" hints).
- [x] `npm run build`, `npm run lint` and `npm run typecheck` all pass.
- [x] Verified with a 117-assertion Step 6 suite plus the 54-, 33-, 56- and 55-assertion Step 3/4/5
      regressions — all green against a real MongoDB.

**Deliberately not in Step 6** (still out of scope):

- No authentication — identity stays a self-declared cookie/header, for data integrity only.
- No image uploads — the gallery renders a category tile until `images` are populated.
- Favourites still persist in `localStorage` (no `/api/favorites` wiring).
- No notifications or email — every enquiry/offer event is visible in-app only.

Full write-up — changed files, both lifecycles, business rules, data flow and the checklist — is in
**[`docs/STEP-6.md`](docs/STEP-6.md)**.

### How an enquiry / offer request flows

```
POST /api/enquiries | /api/offers
  │
  ├─ requireActor(request)          ─▶ x-student-id → real student   ✗ 401 UNAUTHORIZED_ACTOR
  ├─ readJsonBody + Zod schema      ─▶ 400 VALIDATION_ERROR (bad id, short message, offerPrice ≤ 0)
  │
  └─ service (enquiry.service / offer.service)
        ├─ load product (not soft-deleted)      ✗ 404 NOT_FOUND
        ├─ BR-5  actor ≠ seller                 ✗ 403 FORBIDDEN
        ├─ BR-6/22 product.status === available ✗ 409 LISTING_UNAVAILABLE
        ├─ BR-7  sale-only (offers)             ✗ 422 RULE_VIOLATION
        ├─ BR-21 offerPrice < price             ✗ 422 RULE_VIOLATION
        ├─ BR-10/11 one pending per (product, buyer) ✗ 409 DUPLICATE
        └─ insert ─▶ 201 pending
              ▼
  respond (PUT/PATCH /api/[id])
        ├─ owner check (seller vs buyer)        ✗ 403 FORBIDDEN
        ├─ transition table                     ✗ 422 RULE_VIOLATION
        └─ accept offer ─▶ product reserved (BR-14)
                        ─▶ siblings rejected, autoRejected: true
                        ─▶ recalculateUserStats (BR-24)
```

---

## Step 7 status

**Done — API-backed favourites and the complete student dashboard.**

- [x] **Favourites API** — `GET /api/favorites` (list with a derived `availability` label),
      `POST /api/favorites` (`productId`), `DELETE /api/favorites?productId=…` (also accepts a JSON
      body). Every method requires `x-student-id`; favourites are always scoped to the actor.
- [x] **Favourite button** — the heart on every card and on the detail page now saves for real.
      `FavoritesProvider` hydrates from `GET /api/favorites` and updates **optimistically** with
      rollback + a toast on failure; the button disables while its request is in flight.
- [x] **Favourites page** (`/favorites`) — server-rendered from `listFavorites(actor)`, so it is
      authoritative. Available items render the normal card; reserved/sold items render the card with
      an explanatory strip; removed (soft-deleted or hard-deleted) items render a greyed placeholder
      instead of a link that would 404. Remove-one and Clear-all are live.
- [x] **BR-17** — a favourite is **never** auto-removed when its listing is reserved, sold or
      deleted; it stays with an `available | reserved | sold | unavailable` label until the student
      removes it.
- [x] **BR-5 / BR-12** — saving your own product is **403**; saving the same product twice is **409
      DUPLICATE** (backed by the unique index).
- [x] **Dashboard overview** — the six required counters, each derived from the same services the API
      uses: **active listings**, **reserved**, **sold**, **pending enquiries**, **pending offers** and
      **saved items** (plus quick actions).
- [x] **Dashboard sections** — My Listings (view/edit/delete/change status), Enquiries (received +
      sent, accept/reject/cancel) and Offers (received + sent, accept/reject/counter/withdraw) all
      read real data through the service layer.
- [x] **Responsive dashboard navigation** — a horizontally scrollable tab strip on small screens that
      becomes a sticky vertical sidebar (icon + description per section) at `lg`.
- [x] **UI feedback** — every mutation shows the server's own message via the toast system; the
      dashboard's identity guard still redirects to `/setup` (real `307`).
- [x] **Dead code removed** — `lib/mock-data.ts` and `DEMO_STUDENT_ID` are gone; nothing reads mock
      data any more.
- [x] `npm run build`, `npm run lint` and `npm run typecheck` all pass.
- [x] Verified with a 79-assertion Step 7 suite plus the 54-, 33-, 56-, 55- and 117-assertion
      Step 3/4/5/6 regressions — all green against a real MongoDB.

**Deliberately not in Step 7** (still out of scope):

- No authentication — identity stays a self-declared cookie/header, for data integrity only.
- No image uploads — the gallery and thumbs still render a category tile until `images` are populated.
- No notifications or email — every event is visible in-app only.

Full write-up — changed files, the favourites/dashboard data flow, manual test scenarios and the
checklist — is in **[`docs/STEP-7.md`](docs/STEP-7.md)**.

### How a favourite and the dashboard flow

```
Heart click (client)
  │
  └─ FavoritesProvider.toggleFavorite(productId)
        ├─ optimistic: flip the id in the local set, mark the button busy
        └─ POST /api/favorites { productId }   ✗ 403 own / 409 duplicate / 404 missing
              └─ on failure: roll back the set + toast the server message

/favorites (Server Component)
  │
  ├─ getCurrentActor()                    ✗ no cookie ─▶ "Choose a profile" prompt
  └─ listFavorites(actor) ─▶ Favorite.find({ user }).populate(product.seller)
        └─ serializeFavorite ─▶ availability = f(product.status)   (BR-17)
              ▼
   available ─▶ ListingCard
   reserved  ─▶ ListingCard + "Reserved" strip
   sold      ─▶ ListingCard + "Sold" strip
   deleted   ─▶ greyed placeholder (no dead link) + Remove

/dashboard (Server Component)
  │
  └─ Promise.all([
       listProducts({ sellerId, status: [available, reserved, sold, deleted] }),
       listEnquiries({ role: "seller" }, actor),
       listOffers({ role: "seller" }, actor),
       listFavorites(actor),
     ])
        ▼
   active · reserved · sold · pending enquiries · pending offers · saved items
```

---

## Step 8 status

**Done — a production-quality validation, error-handling and UI-polish pass over Steps 1–7.**

No new business features: the data model, the endpoints, the business rules and the identity model are
all untouched. Step 8 tightened the edges.

- [x] **Client-side validation** — every form parses its draft with the *same* Zod schema the API uses,
      so the two can never disagree. Failures are mapped to fields by one helper
      (`lib/form-errors.ts`) and shown inline plus in a shared `<FormAlert>` banner.
- [x] **Server-side validation** — every route handler validates body/query at the boundary before any
      service runs; Zod issues become `400 VALIDATION_ERROR` with a `details[]` array.
- [x] **Consistent API errors** — one envelope, one code→status matrix, asserted end-to-end:
      `VALIDATION_ERROR` 400 · `INVALID_ID` 400 · `UNAUTHORIZED_ACTOR` 401 · `FORBIDDEN` 403 ·
      `NOT_FOUND` 404 · `DUPLICATE` 409 · `LISTING_UNAVAILABLE` 409 · `RULE_VIOLATION` 422 ·
      `INTERNAL_ERROR` 500. Malformed JSON behaves like a schema failure.
- [x] **HTTP status codes** — `201` for every create, `200` for reads/updates/deletes; `PATCH` remains a
      documented alias of `PUT`.
- [x] **Loading states** — route-level skeletons where they are safe (`/setup`, `/sell`, `/dashboard`,
      `/dashboard/listings`, `/favorites`) and in-page `<Suspense>` skeletons for streamed sections.
- [x] **Empty / error states** — an `EmptyState` on every list; a shared `RouteError` view (with
      **Try again**) behind every `error.tsx`.
- [x] **Toast feedback** — every mutation raises a toast carrying the server's own message.
- [x] **Confirmation dialogs** — one reusable `ConfirmDialog` (pending-aware) guards "Clear all" saved
      items and the listing "Remove" flow.
- [x] **Form submission prevention** — submit buttons disable and spin for the whole request; dialogs
      cannot be double-submitted and their cancel/overlay are inert while a destructive action runs.
- [x] **Invalid route + not-found handling** — a global 404 and per-segment not-found pages; a page that
      can 404 resolves its resource **before** its Suspense boundary, so the status code stays a real
      `404` (this is why `/marketplace/[id]` and `/seller/[id]` deliberately have no `loading.tsx`).
- [x] **Image error fallback** — `ListingImage` swaps a dead photo URL for the category tile; `Avatar`
      falls back to initials.
- [x] **Accessibility** — real labels, `aria-invalid` / `aria-describedby` / `aria-required` wired
      automatically by the field context (never pointing at a missing element), a focus-trapping
      dialog hook (`useDialog`) with Escape + focus restore + scroll lock, and visible focus throughout.
- [x] **Responsive design** — mobile drawer/sheets, stacked grids and no horizontal scroll on every page.
- [x] **Safe handling of missing fields** — `serialize.ts` narrows `unknown` and defaults collections,
      so a sparse or legacy document renders instead of throwing.
- [x] **Duplication removed** — `form-errors`, `FormAlert`, `FieldContext`, `useDialog`,
      `ConfirmDialog`, `RouteError`, `RouteNotFound`, `ListingImage` are each the single implementation.
- [x] `npm run build`, `npm run lint` (0 warnings) and `npm run typecheck` all pass.
- [x] Verified with a 124-assertion Step 8 suite plus the 54-, 33-, 56-, 55-, 117- and 79-assertion
      Step 3/4/5/6/7 regressions — all green against a real MongoDB.

Full write-up — changed files, the validation / API-error / accessibility / responsive checklists,
manual test scenarios and the completion checklist — is in **[`docs/STEP-8.md`](docs/STEP-8.md)**.

### How validation, errors and feedback flow

```
Form submit (client)
  │
  ├─ parse with the SAME Zod schema the API uses
  │     ├─ invalid ─▶ zodIssuesToFieldErrors → inline per-field + <FormAlert>   (no request sent)
  │     └─ valid   ─▶ disable button + spinner
  │
  └─ fetchJson  (attaches x-student-id, parses the envelope)
        ├─ 2xx  ─▶ toast + router.refresh()
        └─ !ok  ─▶ ApiClientError { status, code, message, details }
                    ├─ details[] ─▶ mapped onto the same field errors
                    └─ else      ─▶ <FormAlert> / toast

Page request (server)
  GET /marketplace/[id]
    ├─ getProductById(id)              ← resolved BEFORE <Suspense>
    │     ├─ NOT_FOUND ─▶ notFound()   → real 404 + not-found.tsx
    │     └─ other     ─▶ error.tsx    → 500 + "Try again" (retry)
    └─ <Suspense fallback={Skeleton}>  ← slow, secondary reads stream in
```

---

## Notes for reviewers

- All listing thumbnails use a tinted **category tile** (a Lucide icon on a soft background)
  because the mock listings have no photos. The `next/image` code path is already wired and
  activates automatically once a listing has image URLs.
- `next.config.ts` currently allows images from any HTTPS host. This will be narrowed to the
  real storage/CDN host when image uploads are added (still out of scope after Step 7).
- The `loading.tsx` files and inline `<Suspense>` boundaries create streaming Suspense
  boundaries. A rendered fallback commits the HTTP response at `200`, after which a
  `redirect()`/`notFound()` can only be applied client-side. To keep real status codes, every
  guard runs **before** its boundary: `/dashboard` and `/sell` check identity in a `layout.tsx`,
  and the listing/seller pages resolve their entity before wrapping the slower reads in
  `<Suspense>`. The root `app/loading.tsx` (which wrapped *every* route) was removed for this
  reason. As a result `/dashboard` and `/sell` return a real `307` and unknown listing/seller
  URLs return a real `404` (verified). See `node_modules/next/dist/docs/01-app/02-guides/streaming.md`
  §"Status codes".
