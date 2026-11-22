# CampusCycle — Step 7 Report

**API-backed favourites and the complete student dashboard.**

Step 7 closes the last gap the earlier steps left open: favourites. The heart on every card and on
the listing-detail page now writes to MongoDB through `/api/favorites`, and `/favorites` is a
server-rendered view of that data. At the same time the dashboard grows from a placeholder into the
real thing — an overview with six live counters, a full **My Listings** section, and received/sent
**Enquiries** and **Offers** — behind a navigation that works on a phone and on a desktop.

The favourites **backend** was already built in Step 2; Step 7 wires the UI to it and removes the
last piece of mock data. Authentication, uploads and notifications remain out of scope.

---

## 1. Files changed

### New

| File | Purpose |
| ---- | ------- |
| `components/favorites/favorite-card.tsx` | One saved product on `/favorites`. Availability-aware: available → `ListingCard`; reserved/sold → card + explanatory strip; removed → greyed placeholder (never a dead link). |
| `components/favorites/remove-favorite-button.tsx` | Client island: removes one favourite through the provider, then `router.refresh()`es the server list. |
| `components/favorites/clear-favorites-button.tsx` | Client island: clears every rendered favourite (the ids are passed from the server, so it works before the provider hydrates). |

### Changed

| File | Change |
| ---- | ------ |
| `lib/favorites-store.ts` | Rewritten from a `localStorage`/`useSyncExternalStore` store into a thin client over the API: `fetchFavorites` (`GET`), `saveFavorite` (`POST`), `unsaveFavorite` (`DELETE`). |
| `components/providers/favorites-provider.tsx` | Rewritten as an API-backed provider: hydrates the id set from `GET /api/favorites` for the acting student, applies every save/remove **optimistically** with rollback + toast, and exposes `ready` / `isPending`. |
| `components/listings/favorite-button.tsx` | Disables itself while its save/remove is in flight (`isPending`); copy updated for the real backend. |
| `app/favorites/page.tsx` | Rewritten from a client page on mock data into a **server component** reading `listFavorites(actor)`, with a no-profile prompt, empty state, `FavoriteCard` grid and a Clear-all action. |
| `app/dashboard/page.tsx` | Rewritten with the six required counters (active / reserved / sold listings, pending enquiries, pending offers, saved items) derived from the real services, plus quick actions. |
| `lib/navigation.ts` | `DASHBOARD_NAV` items gained an `icon` (and clearer descriptions) for the sidebar. |
| `components/dashboard/dashboard-nav.tsx` | Rewritten: horizontally scrollable tab strip on small screens; sticky vertical icon sidebar at `lg`. |
| `app/dashboard/layout.tsx` | Now a `lg:grid-cols-[260px_minmax(0,1fr)]` sidebar layout. |
| `lib/types.ts` | Legacy `FavoriteItem` replaced with the client-safe `ApiFavorite` (mirrors `FavoriteDto`). `DashboardStats` reused by the overview. |
| `lib/constants.ts` | Removed the now-unused `DEMO_STUDENT_ID`. |
| `app/layout.tsx` | Comment updated: `FavoritesProvider` is now API-backed. |

### Deleted

| File | Reason |
| ---- | ------ |
| `lib/mock-data.ts` | Nothing imports it after this step — products, users, enquiries, offers and favourites all read MongoDB. |

### Docs

`README.md` (intro, tech stack, routes, project structure, important files, new **Step 7 status**
section and data-flow diagram), `docs/API.md` §4.6 (an "as built (Step 7)" note),
`docs/ARCHITECTURE.md` §6.6/§6.7 (as-built notes) and this report.

---

## 2. Data model

No schema change. Favourites already had their collection and unique index from Step 2:

### `favorites`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `_id` | ObjectId | |
| `user` | ObjectId → `users` | the student who saved it |
| `product` | ObjectId → `products` | the saved listing |
| `createdAt` / `updatedAt` | Date | `createdAt` is exposed as `savedAt` |

Index: `{ user, product }` **unique** (BR-12 — one save per student per product).

The serialized shape (`FavoriteDto` → `ApiFavorite`) is:

```ts
{
  id, userId, productId, savedAt,
  availability?: "available" | "reserved" | "sold" | "unavailable",
  product?: ApiProduct,   // populated, with its seller summary
}
```

`availability` is **derived** from the product's current status (`availabilityOf`), never stored.

---

## 3. Business rules

| Rule | Where | Behaviour |
| ---- | ----- | --------- |
| **BR-5** | `favorite.service.ts` | You cannot save your own product → **403 FORBIDDEN**. |
| **BR-12** | `favorite.service.ts` + unique index | A product can be saved once per student → **409 DUPLICATE** (the index is the real guard against a double-click race). |
| **BR-17** | `serialize.ts` (`availabilityOf`) | A favourite is **never** auto-removed. A product that is reserved, sold or deleted keeps its favourite row; the serializer derives `reserved` / `sold` / `unavailable` so the UI can render it. |

---

## 4. Favourite availability states

The product's **current** status drives the card on `/favorites`:

| `availability` | Source status | Card |
| -------------- | ------------- | ---- |
| `available` | `available` | Normal `ListingCard` + an **Available** badge + Remove. |
| `reserved` | `reserved` | Card + **Reserved** badge + "held for another buyer" strip + Remove. |
| `sold` | `sold` | Card + **Sold** badge + "this one has been sold" strip + Remove. |
| `unavailable` | `deleted` (or missing) | Greyed placeholder (no link that would 404) + **No longer available** badge + Remove. |

Every state keeps a Remove action, because the favourite still exists.

---

## 5. API endpoints

Unchanged from Step 2 — listed here because Step 7 is the first UI consumer. Every method requires
`x-student-id`; favourites are always scoped to the acting student, never to a body id.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/favorites` | List the actor's saved products, newest first, each with `availability`. |
| `POST` | `/api/favorites` | `{ productId }` → **201** saved favourite. |
| `DELETE` | `/api/favorites?productId=…` | Unsave (also accepts `{ productId }` in the body) → **200** `{ productId, removed: true }`. |

**Error responses** — the standard envelope with a stable code:

| Code | HTTP | When |
| ---- | ---- | ---- |
| `VALIDATION_ERROR` | 400 | Missing / malformed `productId` (Zod). |
| `INVALID_ID` | 400 | A path id is not a valid ObjectId (service-level). |
| `UNAUTHORIZED_ACTOR` | 401 | Missing or unknown `x-student-id`. |
| `FORBIDDEN` | 403 | Saving your own product (BR-5). |
| `NOT_FOUND` | 404 | Unknown/soft-deleted product, or the favourite is not in the list. |
| `DUPLICATE` | 409 | Already saved (BR-12). |

---

## 6. Data flow

### Saving a favourite (client)

```
Heart click  (listing card / detail page)
  │
  └─ FavoritesProvider.toggleFavorite(productId)
        ├─ no profile?  ─▶ toast "Choose a profile first", stop
        ├─ optimistic:  flip the id in the local set, mark the button busy
        └─ POST/DELETE /api/favorites
              ├─ success ─▶ toast ("Saved" / "Removed from saved")
              ├─ DUPLICATE ─▶ keep it saved (it was already there)
              ├─ NOT_FOUND ─▶ keep it removed (it was already gone)
              └─ other    ─▶ roll the set back + toast the server's message
```

The provider keys its cached ids to the acting student (`state.for`), so switching profile cannot
leak one student's favourites into another's. `GET /api/favorites` is re-fetched whenever the
student changes.

### The favourites page (Server Component)

```
GET /favorites
  │
  ├─ connectToDatabase()
  ├─ getCurrentActor()          ✗ no cookie ─▶ "Choose a profile to save items"
  └─ listFavorites(actor)
        └─ Favorite.find({ user }).populate(product.seller)
              └─ serializeFavorite ─▶ availability = f(product.status)   (BR-17)
                    ▼
   <FavoriteCard/> per item  (available · reserved · sold · unavailable)
        └─ Remove / Clear all  (client) ─▶ provider ─▶ API ─▶ router.refresh()
```

Because the page is server-rendered from the service, it is **authoritative**: a favourite whose
listing was since reserved, sold or removed still renders correctly on the next load.

### Dashboard overview (Server Component)

```
GET /dashboard
  │
  ├─ getCurrentActor()          ✗ no cookie ─▶ redirect /setup   (real 307)
  └─ Promise.all([
       listProducts({ sellerId, status: [available, reserved, sold, deleted] }),
       listEnquiries({ role: "seller" }, actor),
       listOffers({ role: "seller" }, actor),
       listFavorites(actor),
     ])
        ▼
   Active · Reserved · Sold · Pending enquiries · Pending offers · Saved items
```

Every counter is derived from the **same services the API uses**, so the dashboard and the JSON API
can never disagree. "Pending" means still needing a decision — a **countered** offer counts as live,
because the buyer still has to answer it.

### Dashboard navigation

`DASHBOARD_NAV` is the single source of truth. `DashboardNav` renders it as a horizontally
scrollable tab strip on small screens and, at `lg`, a sticky vertical sidebar with each section's
icon and description. Active state is an exact `usePathname` match.

---

## 7. UI feedback

| Situation | Surface |
| --------- | ------- |
| Saved / unsaved | Toast ("Saved" / "Removed from saved"); the heart reacts instantly (optimistic). |
| Save/remove fails | Toast with the server's own message; the optimistic change rolls back. |
| Saving with no profile | Toast "Choose a profile first". |
| Double-click | The button is disabled while its request is in flight. |
| Empty favourites | `EmptyState` ("No saved items yet") with a link to the marketplace. |
| Removed listing | Greyed placeholder + "No longer available"; the card is not a link. |
| Clear all | Clears each rendered favourite; a toast reports any that failed. |
| Dashboard counters | Real numbers with hints (total views, received totals). |
| No profile on `/dashboard` | Real `307` redirect to `/setup?next=/dashboard`. |

---

## 8. Testing cases

### Automated — 79/79 pass

`node campuscycle-step7.mjs` (server on `:3001`). Seeds three students and a catalogue, then
exercises the favourites API and renders the favourites + dashboard pages.

| # | Area | Representative assertions |
| - | ---- | ------------------------- |
| 1 | **Auth** | `GET`/`POST`/`DELETE` without `x-student-id` → `401 UNAUTHORIZED_ACTOR`; unknown actor → `401`. |
| 2 | **Save** | `POST` → `201` with `id`/`userId`/`productId`/`savedAt`/`availability`/populated `product.seller`; list contains it and is actor-scoped; duplicate → `409 DUPLICATE`; own product → `403 FORBIDDEN`; unknown → `404`; malformed → `400 VALIDATION_ERROR`; missing body → `400`; soft-deleted product → `404`. |
| 3 | **Availability (BR-17)** | available stays `available`; reserved → `reserved`; sold → `sold`; soft-deleted → `unavailable`; the favourite row is **never** auto-removed; a soft-deleted product is still populated. |
| 4 | **Remove** | `DELETE` by query → `200 { removed: true }`; the product leaves the list; removing again → `404 NOT_FOUND`; `DELETE` by JSON body → `200`; malformed → `400`; missing id → `400`; one student's save is invisible to another. |
| 5 | **Favourites page** | no profile → `200` + "Choose a profile to save items"; empty → "No saved items yet"; with data → Available / Reserved / Sold / "No longer available" all render, Clear-all and Remove present. |
| 6 | **Dashboard overview** | all six counters present; **exact** values for a fresh seller (2 active, 1 reserved, 1 sold, 0/0/0); dashboard nav + quick actions present. |
| 7 | **Dashboard sections + guard** | `/dashboard/listings` `200` + shows a listing; `/dashboard/enquiries` `200` + Received/Sent tabs; `/dashboard/offers` `200`; `/dashboard` and a section without a profile both redirect (`3xx`). |

### Regression — still green

- Step 3 API suite — **54/54** (`campuscycle-step3-e2e.mjs`).
- Step 3 page suite — **33/33** (`campuscycle-step3-pages.mjs`).
- Step 4 discovery suite — **56/56** (`campuscycle-step4-discovery.mjs`).
- Step 5 page suite — **55/55** (`campuscycle-step5-pages.mjs`).
- Step 6 suite — **117/117** (`campuscycle-step6.mjs`). Two overview assertions were updated from
  "Received enquiries/offers" to "Pending enquiries/offers" to match the Step 7 overview redesign.

### Manual smoke checks

| Scenario | Expected |
| -------- | -------- |
| Save an available listing (someone else's) | Heart fills instantly; toast; appears on `/favorites`. |
| Save the same listing again | Heart already filled; API would answer `409`; UI stays saved. |
| Save your own listing | Heart is visible on your own detail page but the API answers `403`; the toast explains it. |
| Reload `/favorites` | The saved item is still there (it is in MongoDB now, not the browser). |
| Seller reserves / sells a saved listing | On reload the card shows Reserved / Sold, still removable. |
| Seller removes a saved listing | Card is greyed with "No longer available" and no link. |
| Remove one / Clear all | Card disappears; toast; the list refreshes. |
| No profile, open `/favorites` | "Choose a profile to save items" prompt. |
| Open `/dashboard` with a fresh profile | Six counters read 0; quick actions show. |
| Open `/dashboard` without a profile | Redirected to `/setup`. |
| Narrow the window on `/dashboard` | Nav becomes a scrolling tab strip; at `lg` it is a sticky sidebar. |

### Quality gates

`npm run typecheck`, `npm run lint` and `npm run build` all pass. The build lists `/favorites`,
`/dashboard`, `/dashboard/listings`, `/dashboard/enquiries` and `/dashboard/offers` as dynamic
(`ƒ`) routes.

---

## 9. STEP 7 completion checklist

**Favourites**

- [x] **Add a favourite** — heart on every card and on the detail page; `POST /api/favorites`.
- [x] **Remove a favourite** — heart toggle, per-card Remove, and Clear all; `DELETE /api/favorites`.
- [x] **Favourite button on the product card** — `FavoriteButton` (optimistic, pending-aware).
- [x] **Favourite button on the product detail page** — `FavoriteButton variant="button"`.
- [x] **Favourites page** — `/favorites`, server-rendered from `listFavorites(actor)`.
- [x] **Deleted listings handled** — greyed "No longer available" placeholder, no dead link (BR-17).
- [x] **Sold / inactive listings handled** — Sold / Reserved badges + explanatory strips, still removable.
- [x] **No duplicates / own product** — `409 DUPLICATE` (BR-12) and `403` (BR-5).
- [x] **Persistence** — favourites live in MongoDB, scoped to the acting student.

**Dashboard**

- [x] **Overview counters** — active listings, reserved, sold, pending enquiries, pending offers, favourite count.
- [x] **My Listings** — view, edit, delete and change status (`/dashboard/listings`).
- [x] **My Enquiries (sent)** — status + product info (`/dashboard/enquiries?view=sent`).
- [x] **Received Enquiries** — buyer, product, message, offer price, status; accept/reject.
- [x] **My Offers** — product, offered amount, status, date (`/dashboard/offers?view=sent`).
- [x] **Received Offers** — buyer, offer amount, status; accept/reject/counter.
- [x] **Responsive navigation** — scrolling tab strip on mobile, sticky sidebar at `lg`.
- [x] **Real data** — every section reads through the shared service layer.

**Cross-cutting**

- [x] **No authentication** — identity stays a self-declared cookie/header, for data integrity only.
- [x] **Success + failure feedback** — optimistic updates with rollback, server messages via toasts, empty states.
- [x] **Dead code removed** — `lib/mock-data.ts` and `DEMO_STUDENT_ID` deleted.
- [x] **Quality gates** — `typecheck`, `lint`, `build` all pass.
- [x] **Verification** — 79/79 Step 7 assertions + 54/54, 33/33, 56/56, 55/55 and 117/117 regressions.

**Step 7 is complete. Not starting Step 8.**
