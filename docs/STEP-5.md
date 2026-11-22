# CampusCycle — Step 5 Report

**Product detail + seller experience on real MongoDB data.**

Step 5 turns `/marketplace/[id]` and `/seller/[id]` into complete, database-backed pages: a listing
detail with gallery, price, type, condition, description, category, status, posted date, seller
information, a profile link, contact/enquiry CTAs, a favourite CTA and similar listings; and a seller
profile with name, contact preference, active listings, sold listings, listing counts and a short
listing history.

The enquiry and offer **backends are deliberately not implemented** — Step 5 ships the UI and the
integration points only. Nothing is sent to the server. Authentication, uploads, offers, enquiries and
favourites wiring all remain out of scope.

---

## 1. Files changed

### New

| File | Purpose |
| ---- | ------- |
| `lib/contact.ts` | **Integration point.** Enquiry/offer endpoint constants, `buildEnquiryDraft` / `buildOfferDraft` payload builders, `parseAmount`, and the shared Zod schemas the future submit will validate against. |
| `app/marketplace/[id]/error.tsx` | Route error boundary for a failed listing read (retry + back to marketplace). |
| `app/seller/[id]/error.tsx` | Route error boundary for a failed profile read. |
| `app/seller/[id]/not-found.tsx` | 404 surface for an unknown student. |

### Changed

| File | Change |
| ---- | ------ |
| `lib/types.ts` | Added `ContactPreference` (`"message" \| "email" \| "either"`) and the optional `Student.contactPreference` / `UserSummary.contactPreference`. |
| `lib/constants.ts` | Added `CONTACT_PREFERENCES` (label + description per value) and `contactPreferenceLabel(value)`. |
| `lib/db/enums.ts` | Added `CONTACT_PREFERENCE_VALUES` (derived from the option list — one source of truth). |
| `lib/db/models/user.model.ts` | Added the `contactPreference` field (enum, default `"message"`) to the schema + `IUser`. |
| `lib/validators/user.ts` | `contactPreference` added to both `createUserSchema` and `updateUserSchema` (enum, optional). |
| `lib/db/serialize.ts` | `UserSummaryDto`/`UserDto` carry `contactPreference`; a defensive `contactPreference()` narrower drops unknown values. |
| `lib/services/user.service.ts` | `createUser` persists `contactPreference`. |
| `lib/api/errors.ts` | Added `isNotFoundError(error)` — distinguishes a genuine missing/removed resource from a real failure. |
| `components/account/setup-form.tsx` | Added a **Contact preference** `Select` (state, validation, submission). |
| `components/listings/seller-card.tsx` | Added a **"Prefers"** meta row rendering `contactPreferenceLabel`. |
| `app/marketplace/[id]/page.tsx` | Distinguishes not-found from DB errors, renders a **sold/reserved notice**, adds a **Status** detail row, and refines `generateMetadata`. |
| `app/seller/[id]/page.tsx` | Rewritten: not-found vs DB-error handling, parallel **available + sold** queries, a **Sold history** section, contact preference via the seller card, updated skeleton. |
| `components/listings/contact-dialogs.tsx` | Builds/validates the exact future request bodies via `lib/contact.ts`, uses `noValidate` forms, and only shows **Make an offer** for `sale` listings (BR-7). |

> **Why `contactPreference` is a preference, not contact details.** `docs/ARCHITECTURE.md` §6.3 says
> contact is *enquiry only — no direct contact details exposed*. So the field stores how a seller
> would like to be reached (`message` · `email` · `either`) and the UI renders the **label only**.
> A raw email address is never displayed on a listing or profile.

---

## 2. Dynamic routing

Both routes are dynamic segments that read a real document id straight from the URL.

```
app/
  marketplace/
    [id]/
      page.tsx        ← /marketplace/:id   (product detail)
      error.tsx       ← boundary for a failed read
      not-found.tsx   ← 404 surface (pre-existing)
  seller/
    [id]/
      page.tsx        ← /seller/:id        (seller profile)
      error.tsx
      not-found.tsx
```

### `params` is a Promise (Next.js 16)

In Next.js 16 the segment is asynchronous — it must be awaited in the page **and** in
`generateMetadata`:

```ts
interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  await connectToDatabase();
  const { id } = await params;          // ← awaited, not destructured directly
  …
}
```

Both routes also declare `export const dynamic = "force-dynamic"` (the seller page explicitly; the
detail page is dynamic because it reads the identity cookie), so nothing is cached across students.

### Real status codes: guard **before** the Suspense boundary

A rendered streaming fallback commits the HTTP response at `200`, after which a `notFound()` can
only swap the streamed UI — it can no longer change the status code. So each page **resolves its
entity first**, then wraps only the slower, secondary reads in `<Suspense>`:

```
app/marketplace/[id]/page.tsx
  getProductById(id)  ──► isNotFoundError? ──► notFound()   (real 404)
                        └─ else ──► rethrow  ──► error.tsx   (real error)
  └─ <Suspense fallback={<ListingDetailSkeleton/>}>
        ListingDetailContent  ← seller profile + viewer identity + similar listings stream in
```

```
app/seller/[id]/page.tsx
  getUserById(id)     ──► isNotFoundError? ──► notFound()   (real 404)
                        └─ else ──► rethrow  ──► error.tsx
  └─ <Suspense fallback={<SellerListingsSkeleton/>}>
        SellerListings  ← available + sold queries stream in
```

`isNotFoundError` (in `lib/api/errors.ts`) returns `true` for `NOT_FOUND` **and** `INVALID_ID`, so a
hand-typed `/marketplace/not-an-id` is a clean `404` rather than a `500`. A dropped database
connection throws something else and reaches `error.tsx` — an outage is never disguised as
"this listing was removed".

---

## 3. Data flow

Server Components read MongoDB directly through the service layer; the browser only receives
rendered HTML plus two small client islands (the favourite button and the contact dialogs).

### Listing detail

```
GET /marketplace/:id
  │
  ├─ await connectToDatabase()                         lib/db/connect.ts
  ├─ getProductById(id)                                product.service
  │     Product.findOne({ _id, status: { $ne: "deleted" } })
  │       .populate(seller summary).lean()
  │     → serializeProduct() → ProductDto              (excludes deleted → NOT_FOUND)
  │     ✗ not found ─► notFound()      (404)
  │     ✗ other      ─► throw          (error.tsx)
  │
  └─ <Suspense>
       ListingDetailContent (Promise.all):
         • resolveSeller(sellerId)     → UserDto → Student   (full profile for the card)
         • getCurrentStudentId()       → cookie viewer id    (own-listing detection)
         • listProducts({ category, status:["available"], … limit: similarListings+1 })
                                        → similar listings (same category, excluding current)
       → renders: gallery · badges · price · description · details · CTAs · seller card · similar
```

`listing.status` is passed straight through, so a `reserved`/`sold` item is reachable by link
(BR-6 only hides it from browse) and the page explains its state up front with a status notice.

### Seller profile

```
GET /seller/:id
  │
  ├─ await connectToDatabase()
  ├─ getUserById(id)                                   user.service
  │     ✗ not found ─► notFound()   ✗ other ─► throw (error.tsx)
  │
  └─ <Suspense>
       SellerListings (Promise.all):
         • listProducts({ sellerId, status:["available"], sort:"newest", limit:48 })
         • listProducts({ sellerId, status:["sold"],      sort:"newest", limit:12 })
       → Available listings (N) grid + Sold (M) history grid
```

Reserved and deleted rows are **never** queried here, so a public profile only ever exposes
`available` + `sold` (BR-6). Only the owner sees the others, in `/dashboard/listings`.

### The two client islands

| Island | Responsibility |
| ------ | -------------- |
| `FavoriteButton` | Toggles a saved listing (still `localStorage`; out of Step 5 scope). |
| `ContactActions` | Enquiry + offer dialogs. **UI only** — see §4. |

Everything else on both pages is a Server Component, so the listing text, prices and seller data are
present in the initial HTML.

---

## 4. Enquiry / offer integration point (UI only)

`lib/contact.ts` is the single seam the future backend will plug into. The dialogs build the exact
request body and validate it with the **same Zod schemas the server will use**, then show a
"ready to send" confirmation — nothing is sent.

```ts
// lib/contact.ts
export const CONTACT_ENDPOINTS = { enquiries: "/api/enquiries", offers: "/api/offers" } as const;

buildEnquiryDraft(listing, { message, proposedPrice })  // → { productId, message, proposedPrice? }
buildOfferDraft(listing,   { amount,  message })        // → { productId, amount, message? }
contactSchemas = { enquiry: createEnquirySchema, offer: createOfferSchema };
```

When Step 6 lands, the only change is inside the dialogs:

```ts
await fetchJson(CONTACT_ENDPOINTS.enquiries, {
  method: "POST",
  body: JSON.stringify(draft),
});
```

Rules already enforced in the UI:

- **Own listing** → the CTAs are replaced by an explanatory banner (viewer id comes from the real
  session cookie).
- **Not available** (`reserved`/`sold`) → both CTAs are disabled, with a short explanation.
- **BR-7** → **Make an offer** only appears for `listingType === "sale"`; free/exchange listings show
  the enquiry CTA alone.
- **Client validation** → an enquiry needs a message (5–1000 chars); an offer needs a numeric amount
  > 0. Invalid input shows an inline `role="alert"` message and the dialog stays open.

---

## 5. State coverage

| State | Where it comes from | Surface |
| ----- | ------------------- | ------- |
| **Loading** | `<Suspense>` around the secondary reads | `ListingDetailSkeleton` / `SellerListingsSkeleton` |
| **Product not found** | `getProductById` → `NOT_FOUND`/`INVALID_ID` → `notFound()` | real `404` → `app/marketplace/[id]/not-found.tsx` |
| **Seller not found** | `getUserById` → `NOT_FOUND`/`INVALID_ID` → `notFound()` | real `404` → `app/seller/[id]/not-found.tsx` |
| **Inactive product** | soft-deleted → excluded from `getProductById` | real `404` (indistinguishable from "removed", by design) |
| **Sold product** | `status === "sold"` | `200` + "This item has been sold" notice; CTAs disabled |
| **Reserved product** | `status === "reserved"` | `200` + "This item is reserved" notice; CTAs disabled |
| **API / DB error** | any non-not-found failure | `error.tsx` boundary with **Try again** + back to marketplace |

---

## 6. Testing cases

### Automated — 55/55 pass

`node campuscycle-step5-pages.mjs` (server on `:3001`). Seeds a seller (`contactPreference: "email"`)
and five listings in different states, then renders the real pages and asserts on the HTML:

| # | Area | Representative assertions |
| - | ---- | ------------------------- |
| 0 | Seed | seller created; `contactPreference` persisted; buyer created |
| 1 | Seed catalogue | 5 listings created; reserved/sold/deleted transitions applied |
| 2 | **Detail — available** | `200`; title, price (`₹650`), category, condition, "For Sale", Status row, "Listed on", description, seller name, `/seller/:id` link, contact preference, enquiry + offer + favourite CTAs, similar listings |
| 3 | **Detail — free (BR-7)** | `200`; price renders "Free"; enquiry CTA present; **offer CTA hidden** |
| 4 | **Detail — reserved** | `200`; "This item is reserved"; "enquiries and offers are closed" |
| 5 | **Detail — sold** | `200` (reachable by link); "This item has been sold" |
| 6 | **Detail — own listing** | `200`; "This is your listing"; enquiry CTA hidden |
| 7 | **Detail — not found** | deleted → `404`; unknown id → `404`; malformed id → `404` |
| 8 | **Seller profile** | `200`; name, bio, "Prefers → Email", "Available listings (2)", "Sold (1)", sold listing shown, reserved + deleted hidden (BR-6), no self "View profile" button |
| 9 | **Seller — not found** | unknown id → `404`; malformed id → `404` |
| 10 | **contactPreference API** | omitted → `201` + default `"message"`; `"either"` → `201`; `"phone"` → `400 VALIDATION_ERROR` (details name the field) |

### Regression — still green

- Step 3 API suite — **54/54** (`campuscycle-step3-e2e.mjs`).
- Step 3 page suite — **33/33** (`campuscycle-step3-pages.mjs`).
- Step 4 discovery suite — **56/56** (`campuscycle-step4-discovery.mjs`).

### Manual smoke checks (page render)

| URL | Expected |
| --- | -------- |
| `/marketplace/<available id>` | `200`; gallery, details, seller card, CTAs, similar listings |
| `/marketplace/<free id>` | `200`; "Free"; no **Make an offer** button |
| `/marketplace/<reserved id>` | `200`; "This item is reserved"; CTAs disabled |
| `/marketplace/<sold id>` | `200`; "This item has been sold" |
| `/marketplace/000000000000000000000000` | `404` — "Listing not found" |
| `/marketplace/not-an-id` | `404` — not a `500` |
| `/seller/<seller id>` | `200`; name, contact preference, available + sold sections |
| `/seller/000000000000000000000000` | `404` — "Student not found" |

### Quality gates

`npm run typecheck`, `npm run lint` and `npm run build` all pass.

---

## 7. STEP 5 completion checklist

**Product detail page — `/marketplace/[id]`**

- [x] **Product image gallery** — `ListingGallery` (category tile now; `next/image` path ready for uploads).
- [x] **Product title** — page heading + breadcrumb.
- [x] **Price** — `PriceTag`, honouring `free`/`exchange` (never "₹0").
- [x] **Listing type** — `TypeBadge` + "Listing type" detail row.
- [x] **Condition** — `ConditionBadge` + "Condition" detail row.
- [x] **Description** — full, whitespace-preserving.
- [x] **Category** — "Category" detail row.
- [x] **Status** — `StatusBadge` + "Status" detail row (+ sold/reserved notice).
- [x] **Posted date** — "Listed on" detail row.
- [x] **Seller information** — `SellerCard` (name, handle, campus, department, joined, stats, preference).
- [x] **Seller profile link** — "View profile" → `/seller/[id]`.
- [x] **Contact / enquiry CTA** — "Send an enquiry" dialog (UI only).
- [x] **Make offer CTA** — "Make an offer" dialog (UI only, `sale` only — BR-7).
- [x] **Favorite CTA** — `FavoriteButton`.
- [x] **Similar listings** — same category, available, excluding the current item.

**Seller profile — `/seller/[id]`**

- [x] **Seller name** — heading + card.
- [x] **Contact preference** — "Prefers" row (label only, never the email).
- [x] **Active listings** — "Available listings (N)" grid.
- [x] **Sold listings** — "Sold (N)" history grid.
- [x] **Listing count** — counts in the section headings and the card stats.
- [x] **Listing history** — the sold grid (reserved/inactive stay private, BR-6).

**Data + states**

- [x] **Real MongoDB data** — both pages call the service layer via Server Components.
- [x] **Product not found** — real `404` + `not-found.tsx`.
- [x] **Seller not found** — real `404` + `not-found.tsx`.
- [x] **Inactive product** — soft-deleted → excluded → `404`.
- [x] **Sold product** — reachable by link with an explicit sold notice.
- [x] **Loading state** — Suspense skeletons for the secondary reads.
- [x] **API / database errors** — route `error.tsx` boundaries with retry.
- [x] **No enquiry/offer backend** — UI + integration points only; nothing is sent.
- [x] **Quality gates** — `typecheck`, `lint`, `build` all pass.
- [x] **Verification** — 55/55 Step 5 assertions + 54/54, 33/33 and 56/56 regressions.

**Step 5 is complete. Not starting Step 6.**
