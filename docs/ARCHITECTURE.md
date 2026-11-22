# CampusCycle — Architecture & Implementation Blueprint

> **Step 0 deliverable.** No application code in this document.
> Stack: Next.js (App Router) + API Route Handlers + MongoDB + Mongoose. No authentication.

---

## 1. Final Project Name Suggestions

| # | Name | Angle |
|---|------|-------|
| 1 | **CampusCycle** | Circular reuse on campus |
| 2 | CampusKart | Friendly, e-commerce feel |
| 3 | StudentBazaar | Classic marketplace metaphor |
| 4 | ReCampus | Sustainability-first |
| 5 | SwapSpot | Emphasises exchange listings |
| 6 | HostelHub | Hostel-centric discovery |
| 7 | ScholarSwap | Academic tone |
| 8 | CampusCrate | Sounds like a listings box |
| 9 | PickupPoint | Campus handover emphasis |
| 10 | DeskToDesk | Dorm-to-dorm trade |

## 2. Recommended Project Name

**CampusCycle** — *"Give it a second life on campus."*

Why this one:
- Immediately signals **second-hand / reuse**, which is the project's core idea.
- Not a generic "marketplace" name; memorable for an interview demo.
- Works for all three listing types (For Sale, Free, Exchange) — "cycle" implies reuse, not just sale.
- Short enough for a logo, repo name (`campuscycle`), and Vercel subdomain (`campuscycle.vercel.app`).

---

## 3. Problem Statement

Students accumulate useful items — textbooks, calculators, lab equipment, laptops, cycles, furniture, stationery — that lose value the moment a semester ends. Meanwhile, other students on the same campus urgently need exactly those items but pay full retail prices because there is **no trusted, campus-scoped, structured channel** to discover and negotiate second-hand goods.

Existing channels are broken:
- **WhatsApp/Telegram groups** — messages scroll away in hours, no search, no filters, no price history.
- **Notice boards** — static, non-searchable, no status tracking.
- **General classifieds (OLX-style)** — not campus-scoped, full of non-students, unsafe for students.

**CampusCycle** solves this with a searchable, filterable campus marketplace where students list items, discover them by category/price/condition, negotiate through **structured enquiries and offers** (not lost chat threads), save favourites, and manage the full lifecycle of their listings (Available → Reserved → Sold).

---

## 4. Target Users

| Persona | Description | Primary goals |
|---------|-------------|---------------|
| **Student Seller** | Has surplus items after a semester | List quickly, get genuine enquiries, track status, mark sold |
| **Student Buyer** | Needs items at a lower price | Search/filter fast, compare, ask questions, make an offer |
| **Student Swapper** | Wants to exchange rather than sell | Publish Exchange listings, match with other swappers |
| **Student Giver** | Wants to donate/clear space | Publish Free listings, hand over with zero friction |

**Non-users (explicitly out of scope):** admins, moderators, external vendors, non-students. The system is campus-scoped by design.

### 4.1 Identity without authentication — key design decision

Auth is **not allowed**, but the app still needs *ownership* (who listed it, who enquired) and *seller profiles*. Approach:

1. On first visit the client generates a lightweight identity: `displayName`, `email`, `campus`, and a server-issued unique `handle`.
2. This is stored in `localStorage` and sent as a header `x-student-id` (the Mongo `_id`) on every write request.
3. The server validates the id exists in the `students` collection before mutating anything.
4. Ownership is enforced **server-side** by comparing `listing.seller` / `enquiry.buyer` with the supplied `x-student-id`.

> This is deliberately *not* security (any id can be spoofed) — it is **data integrity + ownership UX**. This limitation will be documented honestly in the README as a known constraint imposed by the "no authentication" requirement.

---

## 5. Core User Journeys

**J1 — List an item (Seller)**
`Home → "Sell an item" → fill form (title, description, price, category, condition, type, images, location) → live validation → POST /api/listings → redirect to listing detail → item visible in Dashboard.`

**J2 — Discover an item (Buyer)**
`Home → Browse → type "calculator" → filter Category=Electronics, Condition=Good, Price ₹100–₹800 → sort by Price: Low → open listing detail → see similar listings.`

**J3 — Enquire & negotiate (Buyer → Seller)**
`Listing detail → "Send enquiry" → write message (+ optional offer price) → POST /api/enquiries → appears in "My Sent Enquiries". Seller sees it in Dashboard → Received Enquiries → Accept/Reject → status updates for both parties.`

**J4 — Make a formal offer (Buyer)**
`Listing detail → "Make an offer" → enter price + note → POST /api/offers → seller Dashboard → Offers to review → Accept / Decline / Counter → on Accept: listing becomes Reserved, sibling pending + countered offers auto-rejected. A counter hands the decision back to the buyer.`

**J5 — Save a favourite (Buyer)**
`Listing detail → heart icon → POST /api/favorites → Favourites page lists saved items → remove via DELETE → if listing was sold/deleted, card shows "No longer available" and is greyed out.`

**J6 — Manage listings (Seller)**
`Dashboard → Active/Reserved/Sold tabs → edit listing, change status, mark Sold, or Delete (soft) → counts update.`

**J7 — Mark sold (Seller)**
`Dashboard → listing → "Mark as Sold" → confirm → status = sold, soldAt set, removed from public browse, favourite cards show "Sold".`

**J8 — Free / Exchange flow**
`Create listing with type=Free (price forced to 0) or type=Exchange (price hidden, "Looking for" field required) → appears in browse with distinct badges → enquiry/offer rules adapt (offers disabled for Free/Exchange).`

---

## 6. Complete Feature Breakdown

### 6.1 Product Listings
- Create / Read / Update / Delete (soft delete)
- Fields: name, description, price, category, condition, images, listing type, status
- Image handling: URL array; v1 accepts external URLs + client-side preview (no file storage in v1)
- Ownership enforcement on update/delete
- View counter increment on detail view (debounced, server-side)
- Status transitions validated server-side

### 6.2 Marketplace Discovery
- Full-text search across title, description, tags
- Category filter (multi-select)
- Price range filter (min/max, with "Free only" toggle)
- Condition filter (multi-select)
- Listing type filter (sale / free / exchange)
- Sort: Newest, Price Low→High, Price High→Low, Most viewed
- Pagination (page + limit, server-side)
- Listing detail page with gallery, seller card, similar listings
- "Similar listings" = same category, available, excluding current, ranked by condition match then recency

### 6.3 Seller Profiles
- Public profile at `/seller/[id]`: display name, campus, bio, joined date, contact preference, active listings, sold history
- Listing grid filtered to `available`, plus a `sold` history grid (reserved/inactive stay private, BR-6)
- Contact preference (`message` | `email` | `either`) is a *preference label only*
- Contact = enquiry only (no direct contact details exposed)

### 6.4 Enquiries
- Buyer submits enquiry with required message + optional offered price
- Seller accept / reject with optional response note
- Status lifecycle: `pending → accepted | rejected | cancelled` (every terminal state is final)
- Buyer can cancel a pending enquiry
- Full history: buyer sees "Sent", seller sees "Received"
- Duplicate-active-enquiry guard per (listing, buyer)

### 6.5 Offers
- Buyer submits a formal offer (offer price + note) on a `sale` listing only
- Seller accept / reject / **counter** with an optional response note
- Status lifecycle: `pending → accepted | rejected | withdrawn | countered`; a `countered` offer is answered by the buyer (`accepted | rejected | withdrawn`)
- A counter must sit strictly between the buyer's offer and the asking price (BR-25)
- Accepting one offer → listing `reserved`, other pending **and countered** offers on the same listing auto-rejected
- Buyer can withdraw a live (`pending` or `countered`) offer
- Full history for both sides

### 6.6 Favourites
- Save / remove a listing
- Favourites page with availability handling:
  - available → normal card
  - reserved → "Reserved" badge
  - sold → "Sold" badge, greyed, no CTA
  - deleted → "No longer available", offer to remove from favourites
- Unique constraint prevents duplicates

### 6.7 Student Dashboard
- Counters: Active, Reserved, Sold, Received Enquiries (pending), Pending Offers, Favourites
- Tabs: My Listings (by status), Received Enquiries, Received Offers, My Sent Enquiries, My Offers
- Quick actions: Edit, Mark Reserved, Mark Sold, Relist, Delete
- One aggregated stats endpoint (`GET /api/dashboard/stats`)

> **As built (Step 7).** §6.6 and §6.7 both shipped. Favourites are API-backed (`/api/favorites`) and
> the page is server-rendered from `listFavorites(actor)`, so reserved/sold/removed favourites show
> their current state instead of vanishing (BR-17); the header heart updates optimistically through
> `FavoritesProvider`. The dashboard overview derives its six counters — **active listings**,
> **reserved**, **sold**, **pending enquiries**, **pending offers**, **saved items** — directly from
> the product/enquiry/offer/favourite services rather than a separate `GET /api/dashboard/stats`
> endpoint (one less surface to keep in sync; the services are the single source of truth). The
> dashboard nav is responsive: a scrolling tab strip on mobile and a sticky icon sidebar at `lg`.

### 6.8 Listing Status Management
- Statuses: `available`, `reserved`, `sold`, `deleted`
- Transition rules enforced server-side (see §14)
- Status changes recorded with timestamps (`reservedAt`, `soldAt`, `deletedAt`)

---

## 7. Complete Page / Route List

### Public pages (App Router — `app/`)
| Route | Type | Purpose |
|-------|------|---------|
| `/` | Server | Landing: hero, search bar, category tiles, newest listings, stats |
| `/browse` | Server + client filters | Marketplace grid with search/filter/sort/pagination |
| `/listings/[id]` | Server | Listing detail: gallery, seller card, enquiry/offer/favourite actions |
| `/listings/new` | Client | Create listing form |
| `/listings/[id]/edit` | Client | Edit listing form (owner only) |
| `/sellers/[studentId]` | Server | Public seller profile + their available listings |
| `/favorites` | Client | Saved listings with availability states |
| `/dashboard` | Client | Stats overview |
| `/dashboard/listings` | Client | Manage listings (tabs by status) |
| `/dashboard/enquiries` | Client | Received enquiries + accept/reject |
| `/dashboard/offers` | Client | Received offers + accept/reject |
| `/dashboard/sent` | Client | My sent enquiries + my offers |
| `/about` | Server | Project/about page (nice for submission) |
| `/setup` | Client | First-run identity creation (name, email, campus) |

### Framework files
| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout, nav, footer, providers |
| `app/loading.tsx` | Global loading skeleton |
| `app/error.tsx` | Global error boundary |
| `app/not-found.tsx` | 404 page |
| `app/global-error.tsx` | Fatal error boundary |

### API routes (`app/api/`)
See §11–§12.

---

## 8. Database Entities

| Entity | Purpose | Cardinality |
|--------|---------|-------------|
| **Student** | Profile + identity anchor | 1 student → many listings/enquiries/offers/favourites |
| **Listing** | An item being sold/given/exchanged | belongs to 1 seller |
| **Enquiry** | Structured question/negotiation about a listing | 1 listing → many enquiries; 1 buyer → many enquiries |
| **Offer** | Formal price proposal | 1 listing → many offers; optional link to 1 enquiry |
| **Favorite** | Saved listing marker | unique (student, listing) pair |

**Deliberately excluded:** Cart, Orders, Payments, Chat, Reviews, Notifications, Admin. These are out of scope and would dilute the "real business logic" focus.

---

## 9. MongoDB Collection Design

### 9.1 `students`
```js
{
  _id: ObjectId,
  handle: String,          // unique, lowercase, url-safe  e.g. "aarav-sharma-7f2c"
  displayName: String,     // 2–60
  email: String,           // unique, lowercased
  campus: String,          // e.g. "VIT Vellore"
  department: String,      // optional
  year: Number,            // optional 1–5
  bio: String,             // optional, ≤300
  avatarUrl: String,       // optional
  stats: {
    activeListings: Number, // denormalised counter
    soldCount: Number
  },
  createdAt, updatedAt
}
```
**Indexes:** `{ handle: 1 }` unique, `{ email: 1 }` unique, `{ createdAt: -1 }`

### 9.2 `listings`
```js
{
  _id: ObjectId,
  seller: ObjectId,        // ref Student (required)
  title: String,           // 5–120
  description: String,     // 20–4000
  price: Number,           // >= 0 ; must be 0 when listingType = "free"
  listingType: String,     // "sale" | "free" | "exchange"
  category: String,        // enum, see §15
  condition: String,       // "new" | "like_new" | "good" | "fair" | "poor"
  images: [String],        // 0–5 URLs
  location: String,        // hostel/block/area
  exchangeFor: String,     // required when listingType = "exchange"
  tags: [String],          // ≤ 8, lowercase
  status: String,          // "available" | "reserved" | "sold" | "deleted"
  viewCount: Number,       // default 0
  reservedFor: ObjectId,   // ref Student, nullable
  reservedAt: Date,
  soldTo: ObjectId,        // ref Student, nullable
  soldAt: Date,
  deletedAt: Date,
  createdAt, updatedAt
}
```
**Indexes:**
- `{ title: "text", description: "text", tags: "text" }` (weighted text search)
- `{ status: 1, category: 1, price: 1 }` (browse + filters)
- `{ seller: 1, status: 1, createdAt: -1 }` (dashboard)
- `{ status: 1, createdAt: -1 }` (newest sort)
- `{ status: 1, category: 1, createdAt: -1 }` (similar listings)

### 9.3 `enquiries`
> **As built (Step 6):** the collection is `enquiries` with refs `product` / `seller` / `buyer`;
> `proposedPrice` ships as `offerPrice` (`> 0`, `< asking`); `status` is
> `pending | accepted | rejected | cancelled`. See `docs/API.md` §5.

```js
{
  _id: ObjectId,
  listing: ObjectId,       // ref Listing (required)
  seller: ObjectId,        // ref Student (denormalised from listing)
  buyer: ObjectId,         // ref Student (required)
  message: String,         // 5–1000
  proposedPrice: Number,   // optional, >= 0
  status: String,          // "pending" | "accepted" | "rejected" | "withdrawn" | "closed"
  sellerResponse: {
    message: String,       // optional, ≤500
    respondedAt: Date
  },
  respondedAt: Date,
  createdAt, updatedAt
}
```
**Indexes:**
- `{ listing: 1, buyer: 1 }` **partial unique** where `status: "pending"` → blocks duplicate active enquiries
- `{ seller: 1, status: 1, createdAt: -1 }` (seller inbox)
- `{ buyer: 1, createdAt: -1 }` (buyer history)

### 9.4 `offers`
> **As built (Step 6):** the collection is `offers` with refs `product` / `seller` / `buyer`;
> `amount` ships as `offerPrice` alongside a required `originalPrice` snapshot; a
> `counterPrice` is stored while `status = "countered"`; `expiresAt` was dropped. `status` is
> `pending | accepted | rejected | withdrawn | countered`. See `docs/API.md` §5.

```js
{
  _id: ObjectId,
  listing: ObjectId,       // ref Listing (required)
  seller: ObjectId,        // ref Student (denormalised)
  buyer: ObjectId,         // ref Student (required)
  enquiry: ObjectId,       // ref Enquiry, optional
  amount: Number,          // > 0, required
  message: String,         // optional, ≤500
  status: String,          // "pending" | "accepted" | "rejected" | "withdrawn" | "expired"
  responseNote: String,    // optional, ≤500
  autoRejected: Boolean,   // true when rejected by sibling-offer acceptance
  expiresAt: Date,         // optional
  respondedAt: Date,
  createdAt, updatedAt
}
```
**Indexes:**
- `{ listing: 1, status: 1 }`
- `{ listing: 1, buyer: 1 }` **partial unique** where `status: "pending"` → one active offer per buyer per listing
- `{ seller: 1, status: 1, createdAt: -1 }` (seller inbox)
- `{ buyer: 1, createdAt: -1 }` (buyer history)

### 9.5 `favorites`
```js
{
  _id: ObjectId,
  student: ObjectId,       // ref Student
  listing: ObjectId,       // ref Listing
  createdAt, updatedAt
}
```
**Indexes:**
- `{ student: 1, listing: 1 }` **unique** → duplicate-proof
- `{ student: 1, createdAt: -1 }` (favourites page)
- `{ listing: 1 }` (count how many saved an item)

> **Categories/conditions** are static enums in `lib/constants.ts` rather than a collection. Rationale: they never change at runtime, and enums give free Mongoose validation. (A seedable `categories` collection is noted as an optional stretch goal.)

---

## 10. Relationships Between Collections

```
Student ──1:N──▶ Listing        (listing.seller)
Student ──1:N──▶ Enquiry        (enquiry.buyer, enquiry.seller)
Listing ──1:N──▶ Enquiry        (enquiry.listing)
Student ──1:N──▶ Offer          (offer.buyer, offer.seller)
Listing ──1:N──▶ Offer          (offer.listing)
Enquiry ──0:N──▶ Offer          (offer.enquiry — optional back-link)
Student ──1:N──▶ Favorite
Listing ──1:N──▶ Favorite
Listing ──0:1──▶ Student        (listing.reservedFor, listing.soldTo)
```

**Modelling decisions**
- **Reference, not embed**, for cross-collection data → collections stay small and independently queryable, and indexes stay effective.
- **Denormalise `seller` onto enquiries/offers** so the seller dashboard is a single indexed query without a join on listings.
- **Soft delete** on listings (status=`deleted`) so enquiry/offer/favourite history never dangles.
- **No `$lookup` in hot paths.** Populate only what the UI renders (`seller` on listings, `listing` on enquiries/offers), and only with `select()` to limit payload size.
- **Referential integrity is enforced in the service layer**, not by the database (MongoDB has no FKs): validate that the referenced `student`/`listing` exists before insert, and guard deletes that would orphan data.

---

## 11. Required API Endpoints

### Listings
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/listings` | Search / filter / sort / paginate |
| POST | `/api/listings` | Create listing |
| GET | `/api/listings/[id]` | Single listing detail |
| PATCH | `/api/listings/[id]` | Update listing (owner) |
| DELETE | `/api/listings/[id]` | Soft delete (owner) |
| PATCH | `/api/listings/[id]/status` | Status transition (reserve/sold/relist) |
| POST | `/api/listings/[id]/view` | Increment view count |
| GET | `/api/listings/[id]/similar` | Similar listings |

### Students
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/students` | Create identity/profile |
| GET | `/api/students/me` | Current identity (via `x-student-id`) |
| GET | `/api/students/[id]` | Public seller profile |
| PATCH | `/api/students/[id]` | Update own profile |

### Enquiries
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/enquiries` | List (`?role=seller|buyer`, `?status=`) |
| POST | `/api/enquiries` | Submit enquiry |
| GET | `/api/enquiries/[id]` | Single enquiry |
| PATCH | `/api/enquiries/[id]` | Accept / reject / cancel |

### Offers
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/offers` | List (`?role=seller|buyer`, `?status=`) |
| POST | `/api/offers` | Submit offer |
| GET | `/api/offers/[id]` | Single offer |
| PATCH | `/api/offers/[id]` | Accept / reject / withdraw / counter |

### Favourites
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/favorites` | List saved listings (with availability) |
| POST | `/api/favorites` | Save listing |
| DELETE | `/api/favorites/[listingId]` | Remove by listing id |

### Meta
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/dashboard/stats` | Aggregated counters |
| GET | `/api/meta/categories` | Static categories + conditions (client dropdowns) |
| GET | `/api/health` | DB connectivity check |

---

## 12. HTTP Methods for Every API

| Endpoint | GET | POST | PATCH | DELETE |
|----------|:---:|:----:|:-----:|:------:|
| `/api/listings` | ✅ list | ✅ create | — | — |
| `/api/listings/[id]` | ✅ read | — | ✅ update | ✅ soft delete |
| `/api/listings/[id]/status` | — | — | ✅ transition | — |
| `/api/listings/[id]/view` | — | ✅ increment | — | — |
| `/api/listings/[id]/similar` | ✅ read | — | — | — |
| `/api/students` | — | ✅ create | — | — |
| `/api/students/me` | ✅ read | — | — | — |
| `/api/students/[id]` | ✅ read | — | ✅ update | — |
| `/api/enquiries` | ✅ list | ✅ create | — | — |
| `/api/enquiries/[id]` | ✅ read | — | ✅ respond | — |
| `/api/offers` | ✅ list | ✅ create | — | — |
| `/api/offers/[id]` | ✅ read | — | ✅ respond | — |
| `/api/favorites` | ✅ list | ✅ create | — | — |
| `/api/favorites/[listingId]` | — | — | — | ✅ remove |
| `/api/dashboard/stats` | ✅ read | — | — | — |
| `/api/meta/categories` | ✅ read | — | — | — |
| `/api/health` | ✅ read | — | — | — |

> **Status codes:** `200` read/update · `201` create · `400` validation · `404` not found · `409` conflict (duplicate favourite, listing not available, ownership clash) · `422` business-rule violation · `500` server.

---

## 13. Expected Request / Response Structure

### Standard envelope (every response)
```jsonc
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 12, "total": 87, "totalPages": 8 } }

// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [ { "field": "price", "message": "Price must be ≥ 0" } ] } }
```

### `POST /api/listings`
```jsonc
// request  (header: x-student-id: <ObjectId>)
{
  "title": "Casio FX-991ES Scientific Calculator",
  "description": "Used for one semester, fully working, slight scratch on the lid.",
  "price": 650,
  "listingType": "sale",
  "category": "electronics",
  "condition": "good",
  "images": ["https://..."],
  "location": "Hostel B, Room 214",
  "tags": ["calculator", "casio", "engineering"]
}
// 201 response
{ "success": true, "data": { "_id": "...", "status": "available", "seller": { "_id": "...", "displayName": "Aarav", "handle": "aarav-7f2c" }, "createdAt": "..." } }
```

### `GET /api/listings?q=calculator&category=electronics&condition=good&minPrice=100&maxPrice=800&sort=price_asc&page=1&limit=12`
```jsonc
{ "success": true, "data": [ { "_id": "...", "title": "...", "price": 650, "condition": "good", "images": ["..."], "seller": { "displayName": "Aarav" } } ],
  "meta": { "page": 1, "limit": 12, "total": 3, "totalPages": 1, "filters": { "q": "calculator", "category": ["electronics"] } } }
```

### `POST /api/enquiries`
```jsonc
{ "productId": "...", "message": "Is the lid scratch deep? Can you do 600?", "offerPrice": 600 }
// 201
{ "success": true, "data": { "id": "...", "status": "pending", "productId": "...", "buyerId": "..." } }
```

### `PATCH /api/enquiries/[id]`
```jsonc
{ "action": "accept", "response": "Sure, 600 works. Pick up from Hostel B." }
// or { "action": "reject", "response": "Already promised to someone else." }
// or { "action": "cancel" }   ← the buyer only
```

### `POST /api/offers`
```jsonc
{ "productId": "...", "offerPrice": 600, "message": "Can collect today." }
// 201 → status "pending"; originalPrice snapshots the asking price
```

### `PATCH /api/offers/[id]`
```jsonc
{ "action": "accept", "note": "Deal. Reserved for you." }
// or { "action": "counter", "counterPrice": 650 }   ← seller, strictly between offer and asking
// side effects on accept: product → reserved, sibling pending + countered offers → rejected (autoRejected: true)
```

### `GET /api/favorites`
```jsonc
{ "success": true, "data": [
  { "listingId": "...", "savedAt": "...", "availability": "sold",
    "listing": { "title": "Casio FX-991ES", "price": 650, "status": "sold", "images": ["..."] } }
] }
```

### `GET /api/dashboard/stats`
```jsonc
{ "success": true, "data": {
  "listings": { "active": 4, "reserved": 1, "sold": 7, "deleted": 0, "totalViews": 312 },
  "enquiries": { "received": 9, "pending": 3, "accepted": 2, "rejected": 4 },
  "offers": { "received": 5, "pending": 2, "accepted": 1, "rejected": 2 },
  "favorites": 12
} }
```

---

## 14. Business Rules

| ID | Rule |
|----|------|
| BR-1 | A listing must belong to an existing `student`; the `x-student-id` header must resolve to a real student on every write. |
| BR-2 | Only the owner may update, change status of, or delete a listing. Others get `403`. |
| BR-3 | Only the owner may accept/reject an enquiry or offer on their listing. |
| BR-4 | Only the addressed seller may respond; only the original buyer may withdraw. |
| BR-5 | A student cannot enquire on, offer on, or favourite their **own** listing. |
| BR-6 | Enquiries/offers are allowed **only** while `listing.status === "available"`. |
| BR-7 | Offers are allowed **only** for `listingType === "sale"` (not free/exchange). |
| BR-8 | For `listingType === "free"`, `price` must be `0`; the price field is hidden in the UI. |
| BR-9 | For `listingType === "exchange"`, `exchangeFor` is required and price is stored as `0`. |
| BR-10 | A buyer may have **at most one pending enquiry** per listing (partial unique index + service check). |
| BR-11 | A buyer may have **at most one pending offer** per listing. |
| BR-12 | A student may favourite a listing **once** (unique index); re-POST returns `409` or idempotent success. |
| BR-13 | Status transitions: `available → reserved`, `reserved → available` (relist), `reserved → sold`, `available → sold`, `available → deleted`. `sold → *` is **blocked** except explicit relist with confirmation. `deleted → *` is blocked. |
| BR-14 | Accepting an offer sets listing → `reserved`, `reservedFor` = buyer, and **auto-rejects** all other pending offers on that listing (`autoRejected: true`). |
| BR-15 | Accepting an enquiry does **not** reserve the listing (enquiry = conversation; offer = commitment). Documented in UI copy. |
| BR-16 | Deleting a listing is a **soft delete** (`status: "deleted"`); enquiries, offers, and favourites remain queryable for history. |
| BR-17 | Favourites pointing at `sold`/`deleted` listings are **never auto-removed**; the UI renders them as unavailable. |
| BR-18 | Marking a listing `sold` sets `soldAt`; `soldTo` is set when sold via an accepted offer, else `null`. |
| BR-19 | View count increments only for non-owner views and is capped to one increment per visitor per listing per session (client sends `?unique=1`). |
| BR-20 | `price` for `sale` must be `> 0`; a `sale` listing at price 0 is rejected (use `free` type instead). |
| BR-21 | An offer's `offerPrice` (and an enquiry's optional `offerPrice`) must be `> 0` and `< listing.price`. |
| BR-22 | Enquiries/offers on `reserved`/`sold` listings return `409` with a clear message. |
| BR-23 | Updating a listing's `listingType` re-validates BR-8/BR-9 (e.g. sale→free forces price 0). |
| BR-24 | Seller denormalised stats (`stats.activeListings`, `stats.soldCount`) are recalculated on every status change. |
| BR-25 | A counter offer's `counterPrice` must be strictly greater than the buyer's `offerPrice` and no greater than `originalPrice`. |

---

## 15. Validation Rules

All request bodies validated with **Zod** in `lib/validators/`; the same schemas are reused client-side for instant feedback.

### Student
- `displayName`: string, trim, 2–60
- `email`: valid email, lowercased, unique
- `campus`: string, 2–80
- `year`: int 1–5, optional
- `bio`: ≤ 300, optional

### Listing
- `title`: 5–120, trimmed, no leading/trailing spaces
- `description`: 20–4000
- `price`: number, `>= 0`, max 1,000,000, ≤ 2 decimals
- `listingType`: enum `sale | free | exchange`
- `category`: enum `books | electronics | calculators | furniture | stationery | cycles | hostel_essentials | clothing | sports | other`
- `condition`: enum `new | like_new | good | fair | poor`
- `images`: array of valid URLs, max 5
- `location`: 2–120
- `tags`: max 8, each 1–24 chars, lowercased, deduplicated
- `exchangeFor`: required & 3–200 when `listingType === "exchange"`
- **Cross-field (refine):** `free ⇒ price === 0`; `sale ⇒ price > 0`

### Enquiry
- `productId`: valid 24-char ObjectId
- `message`: 5–1000
- `offerPrice`: optional, `> 0`, `< product.price`
- `buyerId` / `sellerId`: optional; must agree with the acting student / product owner when supplied

### Offer
- `productId`: ObjectId
- `offerPrice`: number `> 0`, `< product.price`
- `message`: optional, ≤ 500
- `counterPrice` (respond only): `> offerPrice` and `<= originalPrice`
- `buyerId` / `sellerId`: optional; must agree when supplied

### Query params (browse)
- `q`: ≤ 100 chars, escaped before regex
- `page`: int ≥ 1, default 1
- `limit`: int 1–48, default 12
- `minPrice` / `maxPrice`: numbers ≥ 0, `min ≤ max`
- `sort`: enum `newest | price_asc | price_desc | popular`
- `category` / `condition` / `type`: repeatable enums

### Path params
- `[id]` must be a valid ObjectId → else `400 INVALID_ID` (not a 500 CastError)

---

## 16. Error Handling Strategy

**Layers**
1. **Zod at the boundary** — every handler parses `body`/`query` first; failure → `400 VALIDATION_ERROR` with field-level `details`.
2. **Service layer throws typed errors** — a custom `ApiError` class with `statusCode`, `code`, `message`, `details`.
3. **Route wrapper** — `withErrorHandler(handler)` catches everything, maps errors, and always returns the standard envelope. No handler ever writes its own try/catch boilerplate.
4. **Mongoose error mapping** — centrally translated:
   - `ValidationError` → `400` with per-field messages
   - `CastError` → `400 INVALID_ID`
   - duplicate key `11000` → `409 DUPLICATE` (favourites, handle, email, partial-unique enquiry/offer)
   - `DocumentNotFoundError` → `404 NOT_FOUND`
5. **Unknown errors** → logged server-side with a request id, returned as `500 INTERNAL_ERROR` with a generic message (never leak stack traces or DB details to the client).

**Error code table**

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Body/query failed schema |
| `INVALID_ID` | 400 | Malformed ObjectId |
| `NOT_FOUND` | 404 | Resource missing |
| `UNAUTHORIZED_ACTOR` | 401 | Missing/unknown `x-student-id` |
| `FORBIDDEN` | 403 | Not the owner/addressee |
| `DUPLICATE` | 409 | Unique constraint hit |
| `LISTING_UNAVAILABLE` | 409 | Listing not `available` |
| `RULE_VIOLATION` | 422 | Business rule (BR-x) broken |
| `INTERNAL_ERROR` | 500 | Unexpected |

**Client handling** — a shared `fetchJson` helper throws an `ApiClientError`; forms render `error.details` per field; pages show a toast/banner for top-level errors; `error.tsx` boundaries catch render failures.

> **As built (Step 8).** The strategy above is implemented exactly as described. Step 8 hardened the
> client half and the presentation:
>
> - **One mapping, one banner.** `lib/form-errors.ts` (`zodIssuesToFieldErrors`) turns Zod `issues`
>   into a `{ field: message }` map for every form, and `components/ui/form-alert.tsx` is the single
>   `role="alert"` banner for form-level failures (listing form, setup form, enquiry/offer/counter
>   dialogs). Server `details[]` are applied to the same field map via `ApiClientError`.
> - **Route boundaries, one view.** `components/common/route-error.tsx` and `route-not-found.tsx`
>   back every `error.tsx` / `not-found.tsx`, so the retry affordance and 404 copy are identical
>   across the root, `/marketplace`, `/marketplace/[id]` and `/seller/[id]`.
> - **Status codes stay real.** A page that can 404 resolves its resource **before** its `<Suspense>`
>   boundary (`/marketplace/[id]`, `/seller/[id]`), so `notFound()` still sets `404`. A route-level
>   `loading.tsx` at those segments would flush `200` first, so neither has one; the in-page Suspense
>   skeletons provide the loading UI instead.
> - **Safe degradation.** `lib/db/serialize.ts` narrows `unknown` and defaults collections, so a
>   sparse or legacy document can never crash a response; images fall back to the category tile
>   (`ListingImage`) and avatars to initials (`Avatar`) when a URL fails.

---

## 17. Folder Structure (Next.js App Router)

```
campuscycle/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                      # landing
│  ├─ loading.tsx
│  ├─ error.tsx
│  ├─ not-found.tsx
│  ├─ global-error.tsx
│  ├─ browse/page.tsx
│  ├─ listings/
│  │  ├─ new/page.tsx
│  │  ├─ [id]/page.tsx
│  │  └─ [id]/edit/page.tsx
│  ├─ sellers/[studentId]/page.tsx
│  ├─ favorites/page.tsx
│  ├─ dashboard/
│  │  ├─ page.tsx
│  │  ├─ listings/page.tsx
│  │  ├─ enquiries/page.tsx
│  │  ├─ offers/page.tsx
│  │  └─ sent/page.tsx
│  ├─ setup/page.tsx
│  ├─ about/page.tsx
│  └─ api/
│     ├─ health/route.ts
│     ├─ listings/route.ts
│     ├─ listings/[id]/route.ts
│     ├─ listings/[id]/status/route.ts
│     ├─ listings/[id]/view/route.ts
│     ├─ listings/[id]/similar/route.ts
│     ├─ students/route.ts
│     ├─ students/me/route.ts
│     ├─ students/[id]/route.ts
│     ├─ enquiries/route.ts
│     ├─ enquiries/[id]/route.ts
│     ├─ offers/route.ts
│     ├─ offers/[id]/route.ts
│     ├─ favorites/route.ts
│     ├─ favorites/[listingId]/route.ts
│     ├─ dashboard/stats/route.ts
│     └─ meta/categories/route.ts
├─ components/
│  ├─ ui/                           # primitives
│  ├─ layout/                       # nav, footer, container
│  ├─ listings/                     # listing-specific
│  ├─ enquiries/
│  ├─ offers/
│  ├─ dashboard/
│  └─ common/                       # shared composites
├─ lib/
│  ├─ db/
│  │  ├─ connect.ts                 # cached Mongoose connection
│  │  └─ models/                    # Student, Listing, Enquiry, Offer, Favorite
│  ├─ services/                     # business logic (listings, enquiries, offers, favorites, students, dashboard)
│  ├─ validators/                   # zod schemas
│  ├─ api/
│  │  ├─ response.ts                # ok() / fail() envelope helpers
│  │  ├─ errors.ts                  # ApiError, error codes
│  │  ├─ handler.ts                 # withErrorHandler wrapper
│  │  └─ query.ts                   # parse/validate query params
│  ├─ constants.ts                  # categories, conditions, statuses, limits
│  ├─ identity.ts                   # client-side student id helpers
│  └─ utils/                        # formatters, buildFilters, pagination, slugify
├─ hooks/                           # useIdentity, useListings, useDebounce, useFavorites
├─ types/                           # shared TS types/DTOs
├─ scripts/
│  └─ seed.ts                       # seed demo students + listings
├─ tests/
│  ├─ unit/
│  └─ integration/
├─ docs/
│  ├─ ARCHITECTURE.md               # this file
│  └─ API.md                        # endpoint reference
├─ public/
├─ .env.example
├─ .env.local                       # gitignored
├─ .gitignore
├─ next.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
├─ package.json
├─ vitest.config.ts
└─ README.md
```

---

## 18. Reusable Components List

**UI primitives (`components/ui/`)**
`Button` · `Input` · `Textarea` · `Select` · `MultiSelect` · `Checkbox` · `Badge` · `Card` · `Modal` · `Tabs` · `Skeleton` · `Spinner` · `Toast` · `Tooltip` · `Pagination` · `EmptyState` · `ConfirmDialog` · `RangeSlider` · `ImageGallery` · `Avatar`

**Layout (`components/layout/`)**
`Navbar` · `Footer` · `Container` · `PageHeader` · `DashboardShell` (sidebar + content)

**Listings (`components/listings/`)**
`ListingCard` · `ListingGrid` · `ListingForm` · `ListingFilters` · `ListingSortBar` · `ListingStatusBadge` · `ListingTypeBadge` · `ConditionBadge` · `PriceTag` · `ImageUploader` · `SimilarListings` · `SellerCard` · `ListingActions` (edit/delete/status menu)

**Enquiries (`components/enquiries/`)**
`EnquiryForm` · `EnquiryCard` · `EnquiryList` · `EnquiryResponseDialog` · `EnquiryStatusBadge` · `EnquiryTimeline`

**Offers (`components/offers/`)**
`OfferForm` · `OfferCard` · `OfferList` · `OfferResponseDialog` · `OfferStatusBadge`

**Dashboard (`components/dashboard/`)**
`StatsCards` · `StatCard` · `ListingManagerTable` · `DashboardTabs` · `QuickActionMenu`

**Common (`components/common/`)**
`FavoriteButton` · `AvailabilityNotice` · `IdentityBanner` (prompts `/setup`) · `SearchBar` · `FilterChips` · `LoadMoreButton` · `ApiErrorAlert` · `RelativeTime`

---

## 19. Utility / Helper Files

| File | Responsibility |
|------|----------------|
| `lib/db/connect.ts` | Cached global Mongoose connection (serverless-safe) |
| `lib/api/response.ts` | `ok(data, meta)` / `fail(error)` envelope builders |
| `lib/api/errors.ts` | `ApiError` class + `ERROR_CODES` map |
| `lib/api/handler.ts` | `withErrorHandler()` wrapper + Mongoose error translation |
| `lib/api/query.ts` | Parse & coerce search params into typed filters |
| `lib/validators/*.ts` | Zod schemas per resource |
| `lib/services/listings.service.ts` | CRUD, search, similar, status transitions |
| `lib/services/enquiries.service.ts` | Create, respond, withdraw, list |
| `lib/services/offers.service.ts` | Create, respond (with auto-reject), list |
| `lib/services/favorites.service.ts` | Toggle, list-with-availability |
| `lib/services/students.service.ts` | Profile create/read/update, stat recalc |
| `lib/services/dashboard.service.ts` | Aggregation pipeline for counters |
| `lib/utils/buildFilters.ts` | Mongo filter builder from query params |
| `lib/utils/pagination.ts` | skip/limit + meta builder |
| `lib/utils/format.ts` | `formatPrice`, `formatDate`, `timeAgo` |
| `lib/utils/slugify.ts` | Handle/username generation |
| `lib/utils/objectId.ts` | `isValidObjectId` guard |
| `lib/constants.ts` | Categories, conditions, statuses, sort options, limits |
| `lib/identity.ts` | Client `getStudentId/setStudentId/clearIdentity` |
| `hooks/useIdentity.ts` | React binding over `lib/identity.ts` |
| `hooks/useDebounce.ts` | Search input debounce |
| `lib/api/client.ts` | `fetchJson` fetch wrapper injecting `x-student-id` |

---

## 20. Environment Variables Required

| Variable | Scope | Purpose |
|----------|-------|---------|
| `MONGODB_URI` | server only | MongoDB Atlas connection string (**secret**) |
| `MONGODB_DB_NAME` | server only | Optional explicit DB name |
| `NEXT_PUBLIC_APP_URL` | public | Canonical URL for metadata/links |
| `NEXT_PUBLIC_MAX_IMAGES` | public | Image limit for the uploader (default 5) |
| `NODE_ENV` | server | Runtime mode |

**Rules**
- `.env.local` is **gitignored**; `.env.example` is committed with placeholder values only.
- Only `NEXT_PUBLIC_*` may be read in client components — no secrets there, ever.
- Vercel: set `MONGODB_URI` in Project → Settings → Environment Variables for Production + Preview.

---

## 21. Development Order

| Phase | Deliverable |
|-------|-------------|
| **0** | This blueprint; repo scaffolding; README skeleton |
| **1** | Project init (Next.js + TS + Tailwind), env setup, Mongo Atlas connection, `connect.ts`, `/api/health` |
| **2** | Mongoose models + indexes + constants; `seed.ts` |
| **3** | Core API plumbing: envelope, `ApiError`, `withErrorHandler`, query parser |
| **4** | Listings API: create/read/update/delete/status/similar/view + Zod validators |
| **5** | Students API + identity flow (`/setup`, `useIdentity`) |
| **6** | Browse UI: filters, sort, pagination, listing cards, detail page |
| **7** | Listing create/edit forms with client validation |
| **8** | Enquiries API + UI (form, inbox, respond) |
| **9** | Offers API + UI (form, inbox, accept → reserve + auto-reject) |
| **10** | Favourites API + UI + availability handling |
| **11** | Dashboard + stats aggregation + listing management |
| **12** | Polish: empty/loading/error states, toasts, responsive pass, a11y |
| **13** | Tests, seed data, docs (`API.md`), screenshots |
| **14** | Deploy to Vercel, verify prod, finalise submission checklist |

Build **backend → frontend** per feature so every UI screen has a real, tested API behind it.

---

## 22. Testing Strategy

**Unit (Vitest) — pure logic, fast, no DB**
- Every Zod schema: valid case, each invalid field, cross-field refines (free/exchange price rules)
- `buildFilters`, `pagination`, `formatPrice`, `slugify`, `isValidObjectId`
- Business-rule functions extracted as pure predicates (e.g. `canTransition(from, to)`, `canOffer(listing)`)

**Integration (Vitest + `mongodb-memory-server`) — API handlers**
- Call route handlers directly with `Request` objects
- Assert status codes + envelope shape
- Critical paths: create listing → browse finds it → enquiry → accept; offer accept → listing reserved + siblings auto-rejected; duplicate favourite → 409; enquiry on sold listing → 409; ownership violations → 403; invalid ObjectId → 400
- Verify unique/partial-unique indexes actually fire

**Manual / contract**
- `tests/api.http` (VS Code REST Client) or a Postman collection covering every endpoint with sample payloads
- Seed script produces 3 students, ~20 listings across all categories/statuses, some enquiries/offers/favourites

**E2E sanity (manual matrix, documented in README)**
| Scenario | Expected |
|----------|----------|
| Create free listing | price forced to 0, badge "Free" |
| Create exchange listing without `exchangeFor` | blocked with field error |
| Enquire on own listing | 403 |
| Offer on free listing | 422 rule violation |
| Accept offer | listing Reserved, siblings auto-rejected |
| Mark sold | disappears from browse, favourites show "Sold" |
| Delete listing | soft-deleted, history intact |
| Search + 3 filters + sort | correct, stable result set |

---

## 23. GitHub Repository Structure

```
Repository: campuscycle
Description: Second-hand marketplace for students — Next.js App Router + MongoDB/Mongoose
Topics: nextjs, mongodb, mongoose, app-router, marketplace, college-project, vercel
Visibility: public (required for submission)
```

**Root files**
`.gitignore` (node_modules, .next, .env*.local, coverage) · `.env.example` · `README.md` · `LICENSE` (MIT) · `package.json` · `tsconfig.json` · `next.config.mjs` · `vitest.config.ts`

**README sections**
1. Title + one-line pitch + live Vercel link
2. Screenshots / demo GIF
3. Features (mapped to the 8 core features)
4. Tech stack
5. Architecture overview + link to `docs/ARCHITECTURE.md`
6. Getting started (clone → install → `.env.local` → seed → dev)
7. Environment variables table
8. API reference summary + link to `docs/API.md`
9. Database schema summary
10. Business rules summary
11. Known limitations (no auth, external image URLs, soft delete)
12. Testing instructions
13. Deployment notes (Vercel + Atlas)
14. Author / course details

**Conventions**
- Branches: `main` (deployable) + `feat/*`, `fix/*`
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)
- PRs into `main`; Vercel preview deploy per PR
- Tag the submission: `git tag v1.0-submission`

---

## 24. Vercel Deployment Considerations

1. **Serverless + Mongoose:** every API route is a serverless function. Use a **global cached connection** (`globalThis.__mongoose`) in `lib/db/connect.ts` with `bufferCommands: false` to avoid connection storms and cold-start timeouts.
2. **Runtime:** keep all API routes on the **Node.js runtime** (Mongoose needs Node APIs). Do not opt into the Edge runtime.
3. **Atlas network access:** allow `0.0.0.0/0` in Atlas (Vercel IPs are dynamic) and create a **dedicated least-privilege DB user**. Never commit the URI.
4. **No build-time DB calls:** API routes and DB-backed pages must be dynamic. Use `export const dynamic = "force-dynamic"` (or `revalidate = 0`) on pages that read the DB so `next build` doesn't attempt a connection.
5. **Env vars:** add `MONGODB_URI` (+ optional `MONGODB_DB_NAME`, `NEXT_PUBLIC_APP_URL`) for Production and Preview in the Vercel dashboard.
6. **Function limits:** default duration is fine; cap browse `limit` (≤ 48) to keep payloads small. `maxDuration` can be raised if seeding via an API is ever added.
7. **Indexes:** create them in Atlas (they're declared in the Mongoose schemas; run a one-off `syncIndexes()` from the seed script — do **not** rely on autoIndex in production).
8. **Images:** v1 stores external URLs, so add any third-party host to `next.config.mjs` → `images.remotePatterns`. No file uploads on serverless filesystem.
9. **Cold starts:** first request after idle is slower — acceptable; the health endpoint helps warm the DB.
10. **Secrets hygiene:** `.env.local` gitignored; only placeholders in `.env.example`; rotate the Atlas password if it was ever pasted anywhere public.
11. **Deploy flow:** push `main` → auto production deploy; PRs → preview URLs for demoing to evaluators.

---

## 25. Final Submission Checklist

**Code & repo**
- [ ] Public GitHub repo with a clear README and MIT LICENSE
- [ ] `.env.example` present; **no secrets** in history (`git log -p` audited)
- [ ] `.gitignore` excludes `.env*.local`, `node_modules`, `.next`, coverage
- [ ] Conventional commit history (not one giant commit)
- [ ] `npm run build` passes locally with zero type errors
- [ ] `npm run lint` passes

**Features**
- [ ] Listings: create / view / update / delete / status
- [ ] Discovery: search, category, price range, condition, sort, detail, similar
- [ ] Seller profiles with available listings
- [ ] Enquiries: submit, optional offer price, accept/reject, status, history
- [ ] Offers: submit, accept/reject, status, history
- [ ] Favourites: save, remove, list, unavailable handling
- [ ] Dashboard: active / reserved / sold / received enquiries / pending offers / management

**Quality**
- [ ] Zod validation on every write endpoint
- [ ] Standard response envelope + error codes everywhere
- [ ] Mongoose indexes created in Atlas
- [ ] Seed script runs cleanly and produces demo data
- [ ] Unit + integration tests pass; manual matrix documented
- [ ] Empty / loading / error states on every page
- [ ] Responsive on mobile widths
- [ ] No console errors in production build

**Docs & deploy**
- [ ] `docs/ARCHITECTURE.md` and `docs/API.md` committed
- [ ] README has screenshots + live link + setup steps
- [ ] Deployed on Vercel; production URL loads and DB reads/writes work
- [ ] Vercel env vars configured; no secrets exposed client-side
- [ ] Demo walkthrough script written (2–3 minutes)

---

## ✅ DEFINITION OF DONE FOR STEP 0

Step 0 is complete when **all** of the following are true:

1. [ ] A single **project name is chosen** (recommendation: **CampusCycle**) and used consistently in this doc, the repo name, and the README title.
2. [ ] **Problem statement**, **target users**, and **core user journeys** are written and unambiguous.
3. [ ] **All 8 core features** are broken down into concrete, buildable sub-features.
4. [ ] The **complete page/route list** is finalised (public pages + API routes).
5. [ ] **5 database entities** are defined with full field lists, types, and required/optional markers.
6. [ ] **Indexes** are specified for every collection, including the **partial unique** indexes for active enquiries/offers and the **unique** index for favourites.
7. [ ] **Relationships** between all collections are documented, including the denormalisation and soft-delete decisions.
8. [ ] **Every API endpoint** is listed with its **HTTP method(s)** and purpose.
9. [ ] **Request/response structures** are defined, including the standard success/error envelope.
10. [ ] **Business rules** are enumerated and numbered (BR-1 … BR-24), covering ownership, availability, status transitions, and auto-rejection.
11. [ ] **Validation rules** are defined per field per resource, including cross-field rules.
12. [ ] **Error-handling strategy** is defined with an error-code → HTTP-status table.
13. [ ] **Folder structure** matches the Next.js App Router layout and covers `app/`, `app/api/`, `lib/`, `components/`, `hooks/`, `tests/`, `docs/`.
14. [ ] **Reusable components** and **utility/helper files** are listed with clear responsibilities.
15. [ ] **Environment variables** are documented, with the rule that only `NEXT_PUBLIC_*` reaches the client.
16. [ ] **Development order** is sequenced so backend precedes frontend per feature.
17. [ ] **Testing strategy** covers unit, integration, contract, and a manual E2E matrix.
18. [ ] **GitHub repository structure** and conventions (branches, commits, README sections) are fixed.
19. [ ] **Vercel deployment considerations** are captured, including the cached Mongoose connection and Atlas network access.
20. [ ] **Final submission checklist** is written and every item is verifiable.
21. [ ] **No authentication** was introduced, no enterprise features were added, and MongoDB/Mongoose was not replaced.
22. [ ] **No application code has been written yet** — this document is the only artifact.
