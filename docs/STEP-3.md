# CampusCycle — Step 3 Report

**Connecting the frontend to the real Product API, and completing Product CRUD.**

Step 3 replaces every product-related use of `lib/mock-data.ts` with real MongoDB reads and
writes, and adds the full create → read → update → status → delete lifecycle. No authentication
was added; identity is the self-declared cookie/header described in `docs/ARCHITECTURE.md` §4.1.
Offers, enquiries and favourites remain mock and out of scope.

---

## 1. Files changed

### New — identity & session plumbing

| File | Purpose |
| ---- | ------- |
| `lib/identity.ts` | Browser cookie read/write for `campuscycle_student_id` (the acting student `_id`). |
| `lib/session.ts` | Server-side `getCurrentStudentId()` / `getCurrentStudent()` via `next/headers`. |
| `hooks/use-identity.ts` | Client hook exposing the current student + a setter/clearer. |
| `components/layout/identity-chip.tsx` | Header chip showing who this browser is acting as. |
| `components/account/setup-form.tsx` | Create-or-pick-profile form used by `/setup`. |
| `app/setup/page.tsx`, `app/setup/loading.tsx` | Identity bootstrap route. |

### New — API client & feedback

| File | Purpose |
| ---- | ------- |
| `lib/api/client.ts` | `fetchJson()` — attaches `x-student-id`, unwraps the envelope, throws typed `ApiClientError` with `fieldErrors()`. |
| `hooks/use-toast.ts`, `components/providers/toast-provider.tsx` | Lightweight toast for success/error feedback, mounted in the root layout. |

### New — Product CRUD UI

| File | Purpose |
| ---- | ------- |
| `components/listings/listing-form.tsx` | Shared create/edit form: Zod client validation, live card preview, up to 5 image URLs, seller fields. |
| `components/dashboard/listing-manage-row.tsx` | Per-listing status changer + delete with confirm. |
| `app/marketplace/[id]/edit/page.tsx` | Owner-only edit route (redirects to `/setup` when anonymous, `404` for non-owners). |
| `app/sell/layout.tsx` | Identity gate for the sell flow (runs before the loading boundary → real `307`). |
| `components/listings/listing-detail-skeleton.tsx` | Suspense fallback for the detail page. |

### New — supporting services & API

| File | Purpose |
| ---- | ------- |
| `lib/services/user.service.ts` | Student reads/writes + `getUserById` used by seller pages. |
| `lib/services/stats.service.ts` | Home/dashboard counts computed from real listings. |
| `app/api/users/[id]/route.ts` | `GET` a single student (so the identity chip can resolve a name). |

### Rewired to the database (were mock)

| File | Change |
| ---- | ------ |
| `app/page.tsx` | Home stats + newest/free/exchange rails read the services; data wrapped in explicit `<Suspense>`. |
| `app/marketplace/page.tsx` | Search/filter/sort/pagination run against `listProducts`; `<Suspense>` around results. |
| `app/marketplace/[id]/page.tsx` | Real listing + seller; guard (`notFound`) before the boundary; `<Suspense>` around secondary reads. |
| `app/seller/[id]/page.tsx` | Real profile + available listings; guard before the boundary. |
| `app/sell/page.tsx` | Renders the create form only (gate moved to `layout.tsx`). |
| `app/dashboard/page.tsx` | Real listing stats; enquiries/offers replaced with a "not part of this step" notice. |
| `app/dashboard/listings/page.tsx` | Real listings with inline status + delete. |
| `app/dashboard/layout.tsx` | Dashboard identity gate (before the boundary → real `307`). |
| `app/layout.tsx` | Mounts the toast provider + identity chip. |
| `components/layout/site-header.tsx` | Shows the identity chip. |

### Removed

| File | Reason |
| ---- | ------ |
| `app/loading.tsx` | A root `loading.tsx` wraps **every** route in a Suspense boundary, forcing HTTP 200 and defeating real `redirect()`/`notFound()` status codes. |
| `app/marketplace/loading.tsx` | Same reason (wraps nested listing routes). |
| `app/marketplace/[id]/loading.tsx` | Replaced by the explicit `<Suspense>` + `ListingDetailSkeleton`. |
| `app/seller/[id]/loading.tsx` | Replaced by an explicit `<Suspense>` fallback. |

> `app/dashboard/loading.tsx`, `app/dashboard/listings/loading.tsx`, `app/sell/loading.tsx` and
> `app/setup/loading.tsx` are kept: their guards live in a parent `layout.tsx`, i.e. **above** the
> boundary, so the status codes stay correct.

---

## 2. API flow

Every write goes through one path, so error handling and identity are consistent.

```
listing-form.tsx / listing-manage-row.tsx
        │  client-side Zod check (lib/validators/product.ts)
        ▼
lib/api/client.ts  fetchJson("/api/products/…", { method, body })
        │  • sets content-type: application/json
        │  • sets x-student-id  ← readStudentId() (cookie)
        ▼
app/api/products/route.ts  or  app/api/products/[id]/route.ts
        │  runtime = "nodejs", dynamic = "force-dynamic"
        │  withErrorHandler(...)  ← lib/api/handler.ts
        │     • parseQuery / parseBody with Zod
        │     • requireActor(req)  ← reads x-student-id → ApiError(401) if absent
        ▼
lib/services/product.service.ts
        │  • business rules (BR-2 … BR-24)
        │  • status transitions (BR-13)
        │  • recalculateUserStats() on status change
        ▼
Mongoose model  →  MongoDB
        ▲
        └─ returns { success: true, data, meta? }   |   { success: false, error, code, details? }
```

Client side, on success:

```
toast.success(...)  +  router.refresh()
        └─ Server Components re-render from the database, so the UI updates immediately
```

### Endpoints exercised in Step 3

| Method | Route | Used by | Success |
| ------ | ----- | ------- | ------- |
| `GET` | `/api/products` | browse / seller / home | `200` + `meta` (page, total, totalPages) |
| `POST` | `/api/products` | `/sell` create form | `201` |
| `GET` | `/api/products/[id]` | detail / edit pre-fill | `200` |
| `PUT` | `/api/products/[id]` | edit form (full update) | `200` |
| `PATCH` | `/api/products/[id]` | dashboard status change | `200` |
| `DELETE` | `/api/products/[id]` | dashboard delete (soft) | `200` |
| `GET` | `/api/users/[id]` | identity chip / seller card | `200` |
| `GET` `POST` | `/api/users` | `/setup` list / create | `200` / `201` |

Reads on Server Components skip HTTP entirely: pages call the same service functions directly
after `await connectToDatabase()`, so a browsed page and a fetched API page can never disagree.

### Identity (no auth)

`x-student-id` is a 24-char Mongo `_id`, taken from the `campuscycle_student_id` cookie. It is
attached automatically by `fetchJson` and read server-side by `requireActor`. It is **data
integrity, not security** — the cookie is editable, exactly like the header. Ownership checks
(e.g. edit/delete) compare the actor to `product.sellerId` and return `404` rather than `403` so
the page never confirms that someone else's listing exists.

---

## 3. Database flow

### Write (create)

```
POST /api/products
  → parseBody(createProductSchema)
        • normalises: price forced to 0 for free/exchange, tags lowercased+deduped
        • cross-field rules BR-8/BR-9/BR-20
  → requireActor → sellerId = actor
  → Product.create({ ...input, sellerId, status: "available", viewCount: 0 })
  → recalculateUserStats(sellerId)   // activeListings / soldCount
  → 201 { success: true, data: ProductDto }
```

### Write (update / status / delete)

```
PUT   → merge patch onto stored doc → re-parse with createProductSchema (BR-23) → save
PATCH → assertTransition(from, to) using ALLOWED_STATUS_TRANSITIONS (BR-13) → save
DELETE → soft delete: status = "deleted" (never a hard row removal)
```

Status transitions enforced in `lib/services/product.service.ts`:

```
available → reserved · sold · deleted
reserved  → available · sold · deleted
sold      → available              (explicit relist only)
deleted   → (terminal)
```

### Read

```
listProducts({ q, category, condition, listingType, minPrice, maxPrice, sort, page, limit, sellerId, status })
  → builds a Mongo filter, applies text/sort, returns { items: ProductDto[], meta }
```

- Public browse forces `status: available` (BR-6); owners may query their own `sellerId` to see
  reserved/sold/inactive rows in the dashboard.
- Soft-deleted (`deleted`, shown as **Inactive**) rows are excluded from browse and the detail
  route returns `404`.

### Serialisation

Mongoose documents never leave the server. `lib/db/serialize.ts` (`server-only`) converts each
document to a plain DTO (`ProductDto`, `UserDto`) with a string `id`, so client components only
ever receive JSON-safe shapes.

---

## 4. Manual testing steps

Prerequisites: MongoDB running at `mongodb://127.0.0.1:27017/campuscycle`, `.env.local` set, then
`npm run dev` (or `npm run build && npx next start`).

1. **Bootstrap identity.** Open `/setup`, create a student (name, handle, campus). Confirm the
   header identity chip shows your name. This sets the `campuscycle_student_id` cookie.
2. **Create a listing.** Go to `/sell`. Try submitting empty → inline field errors appear. Fill in
   a title (≥5 chars), description (≥20 chars), price, category, condition and pickup location;
   set the listing type to **Free** and confirm the price field is disabled/zeroed. Submit →
   success toast, redirect to the new listing.
3. **Verify persistence.** Open `/marketplace`; the new listing is in the grid. Use search,
   category/type/condition filters, price range and sorting — results match. Open the listing
   detail page: seller name, condition, listing type and details are correct.
4. **Edit.** From the listing, open **Edit**. Change the title/price, submit → success toast and
   the detail page shows the new values. Confirm the edit URL is owner-only: sign out of the
   cookie (or use another profile) and the edit URL returns a `404`.
5. **Status update.** Open `/dashboard/listings`. Change a listing to **Reserved**, then **Sold**,
   then back to **Available** via the inline control. Confirm each change persists after a refresh
   and that a `reserved`/`sold` item disappears from public browse (but stays visible to you).
6. **Delete.** Delete a listing from the dashboard (confirm the dialog). It vanishes from the
   dashboard, from `/marketplace`, and its detail URL now returns a `404`.
7. **Empty states.** Filter `/marketplace` down to nothing → "No listings match those filters".
   Open a brand-new profile with no listings → seller page shows the empty state.
8. **Error states.** Stop MongoDB and reload a data page → the error boundary renders instead of a
   crash. Restart MongoDB.
9. **Loading states.** Throttle the network (or reload quickly) and confirm skeletons appear for
   the home rails, the marketplace grid and the listing detail before content streams in.
10. **Status codes.** `curl -I` each of: `/dashboard` and `/sell` → `307`; an unknown listing id and
    an unknown seller id → `404`; `/`, `/marketplace`, `/setup` → `200`.

### Automated verification (run during Step 3)

- **API suite — 54/54 pass:** `node campuscycle-step3-e2e.mjs` (server on `:3001`). Covers create,
  read, update, all valid and invalid status transitions, soft delete, owner-only access,
  validation failures and envelope shape.
- **Page suite — 33/33 pass:** `node campuscycle-step3-pages.mjs`. Covers every page's render, real
  `307` redirects for gated routes, and real `404`s for unknown listings/sellers.

---

## 5. STEP 3 completion checklist

- [x] **Create form** — `/sell` with all required fields (name, description, price, category,
      condition, listing type, image URLs, pickup location, tags).
- [x] **Client validation** — Zod schemas shared with the server, inline field errors.
- [x] **Server validation** — `createProductSchema` / `updateProductSchema` in the route handler,
      cross-field rules BR-8/BR-9/BR-20/BR-23.
- [x] **`POST /api/products`** — returns `201` with the created listing.
- [x] **Marketplace fetches real products** — home, `/marketplace`, detail and seller pages read
      MongoDB through the service layer; no mock product data remains.
- [x] **Detail page** — real listing + seller, real `404` for unknown/removed ids.
- [x] **Edit listing** — `/marketplace/[id]/edit`, owner-only, pre-filled, sends `PUT`.
- [x] **Delete listing** — soft delete from the dashboard, removed from browse, detail `404`.
- [x] **Status update** — `available` · `reserved` · `sold` · inactive, transitions enforced
      server-side (BR-13).
- [x] **Listing types** — For Sale / Free / Exchange.
- [x] **Conditions** — New / Like New / Good / Fair.
- [x] **Statuses** — Available / Reserved / Sold / Inactive.
- [x] **Loading states** — route- and section-level skeletons (Suspense boundaries).
- [x] **Empty states** — filtered marketplace, seller with no listings, dashboard with none.
- [x] **Error states** — error boundary + typed API errors surfaced as toasts/inline messages.
- [x] **Success feedback** — toast provider on every successful mutation.
- [x] **UI updates after mutations** — `router.refresh()` re-renders Server Components from the DB.
- [x] **Quality gates** — `npm run typecheck`, `npm run lint`, `npm run build` all pass.
- [x] **Verification** — 54/54 API assertions + 33/33 page assertions against real MongoDB.
- [x] **Out of scope respected** — no offers, enquiries or favourites wiring; no auth; no uploads.

**Step 3 is complete. Not starting Step 4.**
