# CampusCycle — Step 4 Report

**Complete marketplace discovery on real MongoDB data.**

Step 4 turns `/marketplace` into a full discovery surface — search, faceted filters, price range,
sorting, pagination and clear — all executed by MongoDB through the product service. No listing
data is ever downloaded to the browser and filtered client-side: the browser only receives the
current page of already-filtered results. Enquiries, offers and favourites remain out of scope.

---

## 1. Files changed

### New

| File | Purpose |
| ---- | ------- |
| `hooks/use-debounced-value.ts` | `useDebouncedValue<T>(value, delayMs)` — returns `value` once typing pauses. |
| `app/marketplace/error.tsx` | Route-level error boundary for a failed database read (retry + reset filters). |

### Changed

| File | Change |
| ---- | ------ |
| `lib/marketplace.ts` | Removed the dead in-memory `filterListings` / `sortListings` / `searchHaystack`; added `FilterIssue` + `collectFilterIssues(raw)`. Now purely URL ⇄ filter validation/normalisation. |
| `lib/services/product.service.ts` | Documented the escaped-regex `$or` search (name + description + tags). |
| `components/marketplace/search-input.tsx` | Added `liveDebounceMs` (debounced live submit) and `pending` (spinner + `aria-busy`); focus-guarded adoption of external URL changes; immediate clear/Enter submit. |
| `hooks/use-marketplace-navigation.ts` | Added `useTransition` (`isPending`) and a `{ replace }` option so live search does not flood history. |
| `components/marketplace/marketplace-toolbar.tsx` | Wires `liveDebounceMs={350}`, `pending={isPending}`; search navigates with `replace: true`. |
| `components/marketplace/filter-panel.tsx` | `PriceRange` now validates: non-numeric/negative, over the cap, and `max < min`, with an inline `role="alert"` error and `aria-invalid`. |
| `app/marketplace/page.tsx` | Collects `collectFilterIssues(params)` and renders a warning banner when a link contained unusable filters. |

> `filterListings` and `sortListings` were Step 1 scaffolding that filtered the mock array in the
> browser. They are now genuinely dead — Step 4 filters in MongoDB — so they were deleted rather
> than left to rot. `parseMarketplaceFilters`, `filtersToProductQuery`, `filtersToSearchParams`,
> `countActiveFilters` and `toggleValue` all remain and are used by the page and the filter UI.

---

## 2. API query examples

All examples are copy-pasteable against a running server (`npm run dev`, or
`npx next start -p 3001`). Public reads need **no** `x-student-id`.

### Search by name and/or description

```bash
# Substring, case-insensitive, over title + description (+ tags)
curl "http://localhost:3000/api/products?q=calculator"

# Partial word still matches ("calc" → "calculator")
curl "http://localhost:3000/api/products?q=calc"

# Regex metacharacters are escaped, never executed
curl "http://localhost:3000/api/products?q=%5B"        # q=[  → 200, empty result (not 500)
```

### Filter by category / condition / listing type

```bash
# One value
curl "http://localhost:3000/api/products?category=books"

# Repeatable OR within a facet
curl "http://localhost:3000/api/products?category=books&category=electronics"

# Comma-separated works too
curl "http://localhost:3000/api/products?condition=new,like_new"

# Listing type: sale | free | exchange
curl "http://localhost:3000/api/products?type=free"
curl "http://localhost:3000/api/products?type=exchange"
```

### Price range

```bash
curl "http://localhost:3000/api/products?minPrice=100"
curl "http://localhost:3000/api/products?maxPrice=500"
curl "http://localhost:3000/api/products?minPrice=100&maxPrice=500"
```

### Sorting

```bash
curl "http://localhost:3000/api/products?sort=newest"      # createdAt desc (default)
curl "http://localhost:3000/api/products?sort=price_asc"   # price asc, then createdAt desc
curl "http://localhost:3000/api/products?sort=price_desc"  # price desc, then createdAt desc
curl "http://localhost:3000/api/products?sort=popular"     # viewCount desc
```

### Pagination

```bash
curl "http://localhost:3000/api/products?page=2&limit=12"
```

### Everything combined (the real browse query)

```bash
curl "http://localhost:3000/api/products?q=calc&category=calculators&condition=good&type=sale&minPrice=50&maxPrice=400&sort=price_asc&page=1&limit=12"
```

### Success envelope

```json
{
  "success": true,
  "data": [ { "id": "…", "title": "…", "price": 150, "category": "calculators", "…": "…" } ],
  "meta": { "page": 1, "limit": 12, "total": 3, "totalPages": 1 }
}
```

`meta.total` is the count of **all** matches for the filters — not just the returned page — so the
UI can render an accurate "3 results" heading and the correct page count.

### Error envelope (bad query)

```bash
curl "http://localhost:3000/api/products?category=not-a-category"
curl "http://localhost:3000/api/products?minPrice=abc"
curl "http://localhost:3000/api/products?minPrice=500&maxPrice=100"
curl "http://localhost:3000/api/products?sort=cheapest"
curl "http://localhost:3000/api/products?page=0"
curl "http://localhost:3000/api/products?limit=99"
```

```json
{
  "success": false,
  "error": "One or more fields are invalid.",
  "code": "VALIDATION_ERROR",
  "details": [ { "field": "category", "message": "Invalid option…" } ]
}
```

Every one of the above returns **HTTP 400 `VALIDATION_ERROR`** with the offending field named in
`details`.

---

## 3. Frontend flow

The URL **is** the query state. Nothing is filtered in React.

```
┌─ Server Component ───────────────────────────────────────────────────────────┐
│ app/marketplace/page.tsx                                                     │
│   const params  = await searchParams;                                        │
│   const filters = parseMarketplaceFilters(params);   // validate + normalise  │
│   const issues  = collectFilterIssues(params);       // explain dropped input │
│   await connectToDatabase();                                                 │
│   const { items, meta } = await listProducts(filtersToProductQuery(filters));│
│   → renders the toolbar (client) + grid + pagination from `items`/`meta`     │
└──────────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │  router.push("/marketplace?…")   (a new URL)
                              │
┌─ Client island ──────────────────────────────────────────────────────────────┐
│ MarketplaceToolbar                                                           │
│   SearchInput  ── debounce 350ms ──▶ navigate({ q }, { replace: true })      │
│   SortSelect   ───────────────────▶ navigate({ sort })                       │
│   FilterPanel  ── checkboxes / price form ─▶ navigate({ … })                 │
│   ActiveFilters ── chip ✕ ─────────▶ navigate({ … })                         │
│   Clear all    ────────────────────▶ clearAll()                              │
│                                                                              │
│   useMarketplaceNavigation()                                                 │
│     • merges the patch, resets page → 1 (unless the patch sets `page`)       │
│     • filtersToSearchParams(...) → push or replace                           │
│     • runs inside useTransition → isPending drives the spinner               │
└──────────────────────────────────────────────────────────────────────────────┘
```

Key behaviours:

- **Debounced search.** Typing updates local state only. After 350 ms of inactivity the field
  submits once. A `useRef` holds the last-submitted value so the debounce never re-submits the
  value the URL already reflects. Enter and the clear (✕) button submit immediately.
- **`replace`, not `push`, for search.** Otherwise every paused keystroke would add a history
  entry. Sorting, filters, chips and pagination still `push`, so back/forward steps through real
  changes.
- **No history/back-button fights.** The input adopts an *external* URL change (chip removal,
  clear-all, back/forward) only while it is **not focused**, so a slow response can never
  overwrite what the student is still typing.
- **Every filter change resets to page 1** (unless `page` is itself part of the patch), which
  avoids the "page 4 of 1 result" bug.
- **Preserved in the URL.** `filtersToSearchParams` omits defaults (`sort=newest`, `page=1`,
  `limit=12`, empty values), so a clean browse is a clean `/marketplace` and a filtered browse is
  shareable/bookmarkable.

### State coverage

| State | Where it comes from |
| ----- | ------------------- |
| **Loading** | `useTransition().isPending` → spinner in the search field (`aria-busy`); `<Suspense>` fallback (`ListingGridSkeleton`) while the server streams results. |
| **Empty** | `meta.total === 0` → `<EmptyState icon={SearchX}>` "No listings match those filters" with a **Clear filters** action. |
| **Invalid link** | `collectFilterIssues` → warning `InfoBanner` ("Some filters in the link were ignored") listing each dropped value. The page still renders. |
| **Database error** | `app/marketplace/error.tsx` boundary → "We couldn't load the marketplace" with **Try again** (`retry()`) and **Reset filters**. |

---

## 4. Backend filtering logic

`GET /api/products` (`app/api/products/route.ts`) and the browse page both end at the **same**
function — `listProducts` in `lib/services/product.service.ts` — so an API caller and a page
render can never disagree.

### Query validation (Zod)

`productQuerySchema` (`lib/validators/product.ts`) is the single gate:

| Param | Rule |
| ----- | ---- |
| `q` | trimmed string, ≤ 100 chars |
| `category` / `condition` / `type` / `status` | enum values, repeatable or comma-separated |
| `minPrice` / `maxPrice` | coerced number, ≥ 0; `minPrice ≤ maxPrice` (else 400) |
| `sellerId` | 24-char ObjectId |
| `sort` | `newest` \| `price_asc` \| `price_desc` \| `popular` (default `newest`) |
| `page` | integer ≥ 1 (default 1) |
| `limit` | integer 1–48 (default 12) |

### The Mongo filter

```js
const filter = {};

// Visibility (BR-6): explicit status wins → owner sees all-but-deleted → public sees available.
if (status?.length)      filter.status = { $in: status };
else if (sellerId)       filter.status = { $ne: "deleted" };
else                     filter.status = "available";

if (sellerId)            filter.seller = sellerId;
if (category?.length)    filter.category    = { $in: category };     // OR within facet
if (condition?.length)   filter.condition   = { $in: condition };
if (type?.length)        filter.listingType = { $in: type };

if (minPrice !== undefined || maxPrice !== undefined) {
  filter.price = {};
  if (minPrice !== undefined) filter.price.$gte = minPrice;
  if (maxPrice !== undefined) filter.price.$lte = maxPrice;
}

// Name + description (+ tags). Substring regex, NOT $text, so partial words match.
if (q) {
  const pattern = new RegExp(escapeRegex(q), "i");
  filter.$or = [{ title: pattern }, { description: pattern }, { tags: pattern }];
}
```

Three points worth calling out:

1. **AND across facets, OR within a facet.** `category=books&category=electronics` becomes
   `{ category: { $in: ["books", "electronics"] } }`, while a category *and* a price filter are
   separate keys in the same object — MongoDB ANDs top-level keys. Combined filters therefore
   compose exactly as a student expects.
2. **Substring search, not `$text`.** A `$text` index exists but is unused: it matches whole words
   only, so "calc" would miss "calculator". A case-insensitive regex is what a marketplace search
   box needs. `escapeRegex` neutralises metacharacters, so `?q=[` and `?q=.*` return `200`
   (with no false "match all") instead of crashing or misbehaving.
3. **Filter before limit.** `countDocuments(filter)` runs in parallel with the paged
   `find(filter)`, so `meta.total` is the full filtered count and pagination is correct.

### Sorting and pagination

```js
function buildSort(sort) {
  switch (sort) {
    case "price_asc":  return { price: 1,  createdAt: -1 };
    case "price_desc": return { price: -1, createdAt: -1 };
    case "popular":    return { viewCount: -1, createdAt: -1 };
    default:           return { createdAt: -1 };            // newest
  }
}

const [total, products] = await Promise.all([
  Product.countDocuments(filter),
  Product.find(filter)
    .sort(buildSort(sort))
    .skip((page - 1) * limit)
    .limit(limit)
    .populate(SELLER_POPULATE)   // seller summary on each card
    .lean(),
]);
return { items: products.map(serializeProduct),
         meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
```

Every sort has `createdAt: -1` as a tie-breaker, so equally-priced items have a stable order across
pages (no item appearing twice or vanishing). `skip`/`limit` keep the payload to one page.

### Defensive parsing on the browse page

The API is strict (bad input → `400`). The **page** must never crash on a hand-edited URL, so
`parseMarketplaceFilters` silently drops unknown enums, ignores non-numeric/negative prices,
clamps `page`/`limit`, and swaps `min > max`. `collectFilterIssues` then reports what was dropped
so the UI can explain itself. Same data source, two postures — strict on the wire, forgiving in the
browser.

---

## 5. Testing cases

### Automated — 56/56 pass

`node campuscycle-step4-discovery.mjs` (server on `:3001`). Seeds a controlled seven-listing
catalogue and exercises every path end to end:

| # | Area | Representative assertions |
| - | ---- | ------------------------- |
| 0–1 | Seed | seller created; all 7 listings created |
| 2 | Anonymous read | `200` with no `x-student-id`; success envelope |
| 3 | **Search by name** | all 7 found; every hit contains the token; case-insensitive |
| 4 | **Search by description** | exactly the description match returned |
| 5 | Search covers tags | tagged listing found |
| 6 | Regex safety | `q=[` → 200; `q=.*` → 200 and literal (0 matches) |
| 7 | **Category filter** | `books` → 3; every hit is `books`; multi-value → 4 |
| 8 | **Condition filter** | `good` → 3; every hit is `good` |
| 9 | **Listing-type filter** | `free` → 1 (Charlie); `exchange` → 1 |
| 10 | **Min/max price** | `minPrice=250` → 3 all ≥ 250; `maxPrice=100` → 3 all ≤ 100; range → 3 |
| 11 | Combined filters | `books & minPrice=200` → 2, all books & ≥ 200 |
| 12 | **Sorting** | `price_asc` ascending; `price_desc` descending; `newest` by `createdAt` desc |
| 13 | **Pagination** | page size, `meta.limit/total/totalPages`, remainder page, no page overlap |
| 14 | Clear filters | all results `available` (BR-6) |
| 15 | **No results** | `200`, empty `data`, `meta.total = 0` |
| 16 | **Invalid category** | `400 VALIDATION_ERROR`, details mention `category` |
| 17 | **Invalid price** | `400` for `minPrice=abc`, `maxPrice=-5`, and `min > max` |
| 18 | Invalid sort/page/limit | `400` for `sort=cheapest`, `page=0`, `limit=99`, `limit=0` |
| 19 | Filter-before-limit | `total` counts all matches, page size still respected |

### Regression — still green

- Step 3 API suite — **54/54** (`campuscycle-step3-e2e.mjs`).
- Step 3 page suite — **33/33** (`campuscycle-step3-pages.mjs`).

### Manual smoke checks (page render)

| URL | Expected |
| --- | -------- |
| `/marketplace` | `200`, grid renders |
| `/marketplace?category=nope&minPrice=abc&sort=cheapest` | `200`, **"Some filters in the link were ignored"** banner |
| `/marketplace?q=calculator&sort=price_asc` | `200`, sorted results, sort control reflects the URL |
| `/marketplace?q=zzz-no-such-item-xyz` | `200`, **empty state** with Clear-filters action |

### Manual checks to run by hand

1. Type in the search box → no request per keystroke; results update ~350 ms after you stop.
2. Remove a filter chip while the search box is focused → your draft text is preserved.
3. Change a filter while on page 3 → you land back on page 1.
4. Enter a negative or non-numeric price → inline error, no navigation.
5. Enter a min greater than the max → "The maximum price must be at least the minimum."
6. Stop MongoDB and reload `/marketplace` → the marketplace error boundary (not a crash); restart.
7. Back/forward through several filter changes → the URL and the grid stay in sync.

### Quality gates

`npm run typecheck`, `npm run lint` and `npm run build` all pass.

---

## 6. STEP 4 completion checklist

- [x] **Search by product name** — case-insensitive substring over `title`.
- [x] **Search by description** — same query also covers `description` (and `tags`).
- [x] **Category filtering** — single, repeatable (`?category=a&category=b`) and comma-separated.
- [x] **Condition filtering** — `new` · `like_new` · `good` · `fair` · `poor`.
- [x] **Listing type filtering** — `sale` · `free` · `exchange`.
- [x] **Minimum price** — `?minPrice=`.
- [x] **Maximum price** — `?maxPrice=`.
- [x] **Sort newest** — `sort=newest` (`createdAt` desc, the default).
- [x] **Sort price low → high** — `sort=price_asc`.
- [x] **Sort price high → low** — `sort=price_desc`.
- [x] **Clear filters** — "Clear all" + per-chip ✕ + empty-state action → `/marketplace`.
- [x] **Empty result state** — dedicated `SearchX` empty state when `meta.total === 0`.
- [x] **Filters preserved in the URL** — URL is the single source of truth; defaults omitted;
      shareable and back/forward-safe.
- [x] **Debounced search** — 350 ms `useDebouncedValue`, `replace` navigation, spinner via
      `useTransition`.
- [x] **Pagination / efficient limiting** — `page`/`limit` (1–48) with `skip`/`limit`, real
      `Pagination` links, accurate `meta.total`.
- [x] **Filtering through the backend, not the browser** — both the page and the API call
      `listProducts`; the browser only receives the current page of filtered results. No
      client-side filtering remains (`filterListings`/`sortListings` deleted).
- [x] **Proper MongoDB query construction** — AND across facets, `$in` for multi-value facets,
      `$gte`/`$lte` for price, escaped-regex `$or` for search, indexed sort, `skip`/`limit`.
- [x] **Invalid price handled** — API `400`; page inline error + ignored-filters banner.
- [x] **Invalid category handled** — API `400`; page banner.
- [x] **No results handled** — empty state with a clear-filters action.
- [x] **Database errors handled** — `app/marketplace/error.tsx` boundary with retry/reset.
- [x] **Loading state handled** — transition spinner + Suspense grid skeleton.
- [x] **Quality gates** — `typecheck`, `lint`, `build` all pass.
- [x] **Verification** — 56/56 Step 4 assertions + 54/54 and 33/33 Step 3 regressions.
- [x] **Out of scope respected** — no enquiries/offers/favourites wiring; no auth; no uploads.

**Step 4 is complete. Not starting Step 5.**
