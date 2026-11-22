# CampusCycle — API Reference (Step 2)

The backend foundation for CampusCycle: a MongoDB/Mongoose data layer, five
collections, and a set of Next.js App Router **route handlers** under `/api`.

There is **no authentication** in this project. Instead, writes identify the
acting student with an `x-student-id` header. See [Identity](#identity-the-x-student-id-header).

- Runtime: Node.js (every route exports `runtime = "nodejs"`)
- Data store: MongoDB via Mongoose
- Validation: Zod, at the request boundary
- Base URL (dev): `http://localhost:3000`

---

## 1. Response envelope

Every endpoint returns one of two shapes. There are no bare arrays or raw
objects — a client can always branch on `success`.

**Success**

```jsonc
{
  "success": true,
  "data": { /* resource or array of resources */ },
  "meta": { "page": 1, "limit": 12, "total": 87, "totalPages": 8 } // list endpoints only
}
```

**Error**

```jsonc
{
  "success": false,
  "error": "One or more fields are invalid.",   // human-readable, safe to show
  "code": "VALIDATION_ERROR",                    // stable, machine-readable
  "details": [ { "field": "price", "message": "Price cannot be negative." } ] // optional
}
```

`error` is the message the UI renders. `code` is what the client switches on.

### Error codes

| `code`                | HTTP | When |
| --------------------- | :--: | ---- |
| `VALIDATION_ERROR`    | 400  | Body or query string failed schema validation (includes `details[]`). |
| `INVALID_ID`          | 400  | A path/body/header identifier is not a 24-hex-character ObjectId. |
| `UNAUTHORIZED_ACTOR`  | 401  | `x-student-id` header is missing, malformed, or matches no student. |
| `FORBIDDEN`           | 403  | The actor is not the owner/addressee (BR-2, BR-3, BR-4, BR-5). |
| `NOT_FOUND`           | 404  | The resource does not exist (or was soft-deleted). |
| `DUPLICATE`           | 409  | A unique constraint was hit (BR-10, BR-11, BR-12, handle, email). |
| `LISTING_UNAVAILABLE` | 409  | The product is not `available` (BR-6, BR-22). |
| `RULE_VIOLATION`      | 422  | A business rule was broken (BR-7, BR-13, BR-20, BR-21, …). |
| `INTERNAL_ERROR`      | 500  | Unexpected failure. Details are logged server-side, never returned. |

> **As built (Step 8).** The envelope and status codes above are unchanged — Step 8 **verified** them
> end-to-end rather than altering them. Every route handler runs inside `withErrorHandler`
> (`app/api/health` is the one deliberate exception), so a thrown `ApiError` becomes
> `{ success:false, error, code, details? }` with the matching status, and an unexpected throw becomes
> `500 INTERNAL_ERROR` with the detail logged server-side and never returned. Success statuses are
> consistent: **201** for a create (`POST /api/users`, `/api/products`, `/api/enquiries`,
> `/api/offers`, `/api/favorites`) and **200** for a read, update or delete (`PUT`/`PATCH`/`DELETE`).
> Malformed JSON produces `400 VALIDATION_ERROR` with a `details[]` entry, exactly like a schema
> failure. The Step 8 suite asserts the full matrix (see `docs/STEP-8.md` §7).

---

## 2. Identity: the `x-student-id` header

There is no login. A student profile is created once via `POST /api/users`, and
the returned `id` is then sent on every write:

```
x-student-id: 6afdbbcd0d50effa2b1b6d70
```

The header is resolved to a real `User` document before the handler runs
(`lib/api/actor.ts`). This provides **data integrity, not security** — any id can
be spoofed — so that ownership checks have something to compare against.

| Situation | Result |
| --------- | ------ |
| Header absent | `401 UNAUTHORIZED_ACTOR` |
| Header not a valid ObjectId | `400 INVALID_ID` |
| Header is a valid ObjectId but no such student | `401 UNAUTHORIZED_ACTOR` |

Read endpoints that are scoped to the actor (`/api/enquiries`, `/api/offers`,
`/api/favorites`) also require the header, because "whose inbox" is part of the
request. Public reads (`GET /api/products`, `GET /api/products/[id]`) do not.

---

## 3. Pagination

List endpoints accept `?page=` (default `1`) and `?limit=` (default `12`,
max `48`) and return a `meta` block:

```json
{ "page": 1, "limit": 12, "total": 87, "totalPages": 8 }
```

`total` is the count **before** pagination; `totalPages` is `ceil(total / limit)`.

---

## 4. Endpoints

### 4.1 Health

#### `GET /api/health`

Liveness + database connectivity probe. Not wrapped in the standard error
handler: a failed connection returns `503` with `data.status = "down"` rather
than a `500`.

```bash
curl http://localhost:3000/api/health
```

```jsonc
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "connected": true,
    "timestamp": "2026-11-18T14:52:00.000Z"
  }
}
```

---

### 4.2 Users (students)

The Step 0 blueprint calls this entity `Student`; the model is named `User` as
requested. Fields are identical. There is no password field.

#### `POST /api/users` — create a profile

| Field | Type | Required | Notes |
| ----- | ---- | :------: | ----- |
| `handle` | string | no | Lowercase letters/digits/hyphens. Auto-generated from `displayName` when omitted. Must be unique. |
| `displayName` | string | **yes** | 2–60 chars. |
| `email` | string | **yes** | Valid email, lowercased. Must be unique. |
| `campus` | string | **yes** | 2–80 chars. |
| `department` | string | no | ≤ 80 chars. |
| `year` | number | no | Integer 1–5. |
| `bio` | string | no | ≤ 300 chars. |
| `avatarUrl` | string | no | Valid URL. |
| `contactPreference` | enum | no | `message` \| `email` \| `either`. Defaults to `message`. A preference only — no contact details are exposed. |

Returns **201** with the created user.

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Aarav Sharma",
    "email": "aarav@campus.edu",
    "campus": "Main Campus",
    "department": "Computer Science",
    "year": 3
  }'
```

```jsonc
{
  "success": true,
  "data": {
    "id": "6afdbbcd0d50effa2b1b6d70",
    "handle": "aarav-sharma",
    "displayName": "Aarav Sharma",
    "campus": "Main Campus",
    "email": "aarav@campus.edu",
    "department": "Computer Science",
    "year": 3,
    "contactPreference": "message",
    "stats": { "activeListings": 0, "soldCount": 0 },
    "joinedAt": "2026-11-18T14:52:00.000Z",
    "createdAt": "2026-11-18T14:52:00.000Z",
    "updatedAt": "2026-11-18T14:52:00.000Z"
  }
}
```

#### `GET /api/users` — list / search

Query params: `q` (matches `displayName`, `handle`, `campus`), `page`, `limit`.

```bash
curl "http://localhost:3000/api/users?q=aarav&page=1&limit=10"
```

Returns `{ success, data: User[], meta }`.

**Note:** `GET /api/users/[id]` and profile updates are **not** part of the
required Step 2 route list and are deferred to a later step.

---

### 4.3 Products

The Step 0 blueprint calls this entity `Listing`; the model is named `Product`
as requested. Domain field names (`listingType`, `status`, `seller`) are
unchanged.

#### `GET /api/products` — browse, search, filter, sort, paginate

| Param | Type | Notes |
| ----- | ---- | ----- |
| `q` | string | ≤ 100 chars. Literal substring match over title, description, tags. |
| `category` | enum, repeatable | `books`, `electronics`, `calculators`, `furniture`, `stationery`, `cycles`, `hostel`, `clothing`, `sports`, `other` |
| `condition` | enum, repeatable | `new`, `like_new`, `good`, `fair`, `poor` |
| `type` | enum, repeatable | `sale`, `free`, `exchange` |
| `status` | enum, repeatable | `available`, `reserved`, `sold`, `deleted` |
| `minPrice` / `maxPrice` | number | `minPrice ≤ maxPrice`. |
| `sellerId` | ObjectId | List one seller's products. |
| `sort` | enum | `newest` (default), `price_asc`, `price_desc`, `popular` |
| `page` / `limit` | number | See [Pagination](#3-pagination). |

Repeatable params accept either `?category=books&category=sports` or
`?category=books,sports`.

**Visibility rule:** without a `status` filter, browse returns only
`available` products; when `sellerId` is supplied it returns everything **except**
`deleted` (a seller sees their own reserved/sold items).

```bash
curl "http://localhost:3000/api/products?q=casio&category=calculators&condition=good&minPrice=100&maxPrice=800&sort=price_asc&page=1&limit=12"
```

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "6afdbbd1...",
      "sellerId": "6afdbbcd...",
      "title": "Casio FX-991ES Scientific Calculator",
      "description": "Used for one semester, fully working…",
      "price": 650,
      "listingType": "sale",
      "category": "calculators",
      "condition": "good",
      "images": [],
      "location": "Hostel B, Room 214",
      "tags": ["calculator", "casio"],
      "status": "available",
      "viewCount": 0,
      "createdAt": "2026-11-18T14:52:10.000Z",
      "updatedAt": "2026-11-18T14:52:10.000Z",
      "seller": { "id": "6afdbbcd...", "handle": "aarav-sharma", "displayName": "Aarav Sharma", "campus": "Main Campus" }
    }
  ],
  "meta": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
}
```

#### `POST /api/products` — create a listing

Requires `x-student-id`.

| Field | Type | Required | Notes |
| ----- | ---- | :------: | ----- |
| `title` | string | **yes** | 5–120 chars. |
| `description` | string | **yes** | 20–4000 chars. |
| `price` | number | **yes** | ≥ 0, ≤ 1,000,000, ≤ 2 decimals. Forced to `0` for `free`/`exchange` (BR-8/9). |
| `listingType` | enum | **yes** | `sale` \| `free` \| `exchange`. |
| `category` | enum | **yes** | One of the 10 categories. |
| `condition` | enum | **yes** | One of the 5 conditions. |
| `images` | string[] | no | Valid URLs, max 5. Default `[]`. |
| `location` | string | **yes** | 2–120 chars. |
| `exchangeFor` | string | conditional | **Required** when `listingType === "exchange"` (BR-9). |
| `tags` | string[] | no | Max 8; lowercased, trimmed, de-duplicated. |

**Cross-field rules:** `sale` requires `price > 0` (BR-20); `exchange` requires
`exchangeFor` (BR-9); `free`/`exchange` are stored at `price: 0`.

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "x-student-id: $SELLER_ID" \
  -d '{
    "title": "Casio FX-991ES Scientific Calculator",
    "description": "Used for one semester, fully working, slight scratch on the lid.",
    "price": 650,
    "listingType": "sale",
    "category": "calculators",
    "condition": "good",
    "location": "Hostel B, Room 214",
    "tags": ["Calculator", "casio", "calculator"]
  }'
```

Returns **201**. `tags` come back normalised to `["calculator", "casio"]` and
`status` is `"available"`.

#### `GET /api/products/[id]` — single product

```bash
curl http://localhost:3000/api/products/$PRODUCT_ID
```

- Valid id, exists → **200** with the product (including populated `seller`).
- Malformed id → **400 INVALID_ID**.
- Unknown id, or soft-deleted → **404 NOT_FOUND**.

#### `PUT /api/products/[id]` — update (owner only)

Requires `x-student-id`. `PATCH` is exported as an alias of `PUT`.

Accepts any subset of the create fields, plus `status` for a BR-13 transition.
`exchangeFor: null` clears the field.

The service merges the patch onto the stored document and re-validates the
**whole** result against the create rules (BR-23) — so switching
`sale → free` without lowering the price is caught.

```bash
curl -X PUT http://localhost:3000/api/products/$PRODUCT_ID \
  -H "Content-Type: application/json" \
  -H "x-student-id: $SELLER_ID" \
  -d '{ "price": 600, "status": "reserved" }'
```

Status transitions (BR-13):

| From | Allowed to |
| ---- | ---------- |
| `available` | `reserved`, `sold`, `deleted` |
| `reserved` | `available`, `sold`, `deleted` |
| `sold` | `available` (explicit relist) |
| `deleted` | — (terminal) |

Illegal transitions return **422 RULE_VIOLATION**. Relisting to `available`
clears the reservation/sale bookkeeping.

#### `DELETE /api/products/[id]` — soft delete (owner only)

Requires `x-student-id`. Sets `status: "deleted"` (BR-16) rather than removing
the document, so enquiries/offers/favourites keep their history.

```bash
curl -X DELETE http://localhost:3000/api/products/$PRODUCT_ID \
  -H "x-student-id: $SELLER_ID"
```

Returns **200** with `status: "deleted"`. A subsequent `GET` returns **404**.

---

### 4.4 Enquiries

An enquiry is a **conversation**. Accepting one does **not** reserve the product
(BR-15) — only an accepted offer does.

#### `GET /api/enquiries` — list the actor's enquiries

Requires `x-student-id`.

| Param | Values | Notes |
| ----- | ------ | ----- |
| `role` | `seller` \| `buyer` \| `all` | Default `all` (both sides of the conversation). |
| `status` | `pending`, `accepted`, `rejected`, `cancelled` (repeatable) | |
| `productId` | ObjectId | |
| `page` / `limit` | number | |

```bash
curl "http://localhost:3000/api/enquiries?role=seller&status=pending" \
  -H "x-student-id: $SELLER_ID"
```

Items include a populated `product` (with its `seller`) and `buyer`.

#### `POST /api/enquiries` — submit an enquiry

Requires `x-student-id`.

| Field | Type | Required | Notes |
| ----- | ---- | :------: | ----- |
| `productId` | ObjectId | **yes** | |
| `buyerId` | ObjectId | no | If supplied it must equal the acting student (else **422**). |
| `sellerId` | ObjectId | no | If supplied it must be the product's owner (else **422**). |
| `message` | string | **yes** | 5–1000 chars. |
| `offerPrice` | number | no | `> 0` and **strictly below** the asking price (BR-21). |

Rules enforced: you cannot enquire on your own product (**403**, BR-5); the
product must be `available` (**409 LISTING_UNAVAILABLE**, BR-6/22); at most one
pending enquiry per (product, buyer) (**409 DUPLICATE**, BR-10). The buyer/seller
combination is always derived server-side — a mismatched `buyerId`/`sellerId` is
rejected rather than trusted (**422 RULE_VIOLATION**).

```bash
curl -X POST http://localhost:3000/api/enquiries \
  -H "Content-Type: application/json" \
  -H "x-student-id: $BUYER_ID" \
  -d '{ "productId": "'"$PRODUCT_ID"'", "message": "Is the lid scratch deep? Could you do 550?", "offerPrice": 550 }'
```

Returns **201** with `status: "pending"`.

#### `GET /api/enquiries/[id]` — single enquiry

Requires `x-student-id` and the actor must be the seller or the buyer
(**403** otherwise).

#### `PUT /api/enquiries/[id]` — respond

Requires `x-student-id`. `PATCH` is an alias of `PUT`.

| Field | Type | Notes |
| ----- | ---- | ----- |
| `action` | enum | `accept`, `reject`, `cancel`. |
| `response` | string | Optional ≤ 500-char reply, stored on `sellerResponse`. |

Who may do what: `accept`/`reject` are the **seller**; `cancel` is the
**buyer**. Every terminal state is final — a resolved enquiry cannot be
responded to again (**422**), and the wrong side gets **403**.

Status transitions:

| From | Allowed to |
| ---- | ---------- |
| `pending` | `accepted`, `rejected`, `cancelled` |
| `accepted` / `rejected` / `cancelled` | — (terminal) |

```bash
curl -X PUT http://localhost:3000/api/enquiries/$ENQUIRY_ID \
  -H "Content-Type: application/json" \
  -H "x-student-id: $SELLER_ID" \
  -d '{ "action": "accept", "response": "Sure, 550 works. Pick up from Hostel B." }'
```

**Side effect:** none on the product (BR-15).

---

### 4.5 Offers

An offer is a **commitment**. Offers are only valid on `sale` products (BR-7).

#### `GET /api/offers` — list the actor's offers

Requires `x-student-id`. Same `role` / `status` / `productId` / `page` / `limit`
params as enquiries. Items include populated `product` and `buyer`.

#### `POST /api/offers` — submit an offer

Requires `x-student-id`.

| Field | Type | Required | Notes |
| ----- | ---- | :------: | ----- |
| `productId` | ObjectId | **yes** | |
| `buyerId` | ObjectId | no | If supplied it must equal the acting student (else **422**). |
| `sellerId` | ObjectId | no | If supplied it must be the product's owner (else **422**). |
| `offerPrice` | number | **yes** | `> 0` and **strictly below** the asking price (BR-21). |
| `message` | string | no | ≤ 500 chars. |
| `enquiryId` | ObjectId | no | Link to the enquiry this grew out of; must belong to the actor and product. |

Rules enforced: not your own product (**403**, BR-5); product must be
`available` (**409**, BR-6/22); `sale` type only (**422 RULE_VIOLATION**, BR-7);
`offerPrice < price` (**422**, BR-21); at most one pending offer per (product,
buyer) (**409 DUPLICATE**, BR-11). The service **snapshots** the asking price into
`originalPrice` at creation, so a later listing edit cannot rewrite history.

```bash
curl -X POST http://localhost:3000/api/offers \
  -H "Content-Type: application/json" \
  -H "x-student-id: $BUYER_ID" \
  -d '{ "productId": "'"$PRODUCT_ID"'", "offerPrice": 500, "message": "Can collect today." }'
```

#### `GET /api/offers/[id]` — single offer

Requires `x-student-id`; actor must be the seller or buyer (**403** otherwise).

#### `PUT /api/offers/[id]` — respond

Requires `x-student-id`. `PATCH` is an alias of `PUT`.

| Field | Type | Notes |
| ----- | ---- | ----- |
| `action` | enum | `accept`, `reject`, `withdraw`, `counter`. |
| `counterPrice` | number | **Required for `counter`**: strictly between `offerPrice` and `originalPrice` (BR-25). |
| `note` | string | Optional ≤ 500-char note, stored on `responseNote`. |

The offer is a two-step negotiation on a single row. `pending` is the buyer's
opening move: the seller may `accept`, `reject` or `counter` it, and the buyer may
`withdraw` it. A `counter` flips the row to `countered` and stores `counterPrice`;
the buyer then `accept`s, `reject`s or `withdraw`s. Any move that is not legal
from the current status is **422 RULE_VIOLATION**; the wrong side gets **403**.

Status transitions:

| From | Allowed to |
| ---- | ---------- |
| `pending` | `accepted` (seller), `rejected` (seller), `countered` (seller), `withdrawn` (buyer) |
| `countered` | `accepted` (buyer), `rejected` (buyer), `withdrawn` (buyer) |
| `accepted` / `rejected` / `withdrawn` | — (terminal) |

**Accepting an offer (BR-14)** does all of this atomically from the client's
perspective:

1. The product moves to `reserved`, with `reservedFor = buyer` and `reservedAt` set.
2. Every other **pending or countered** offer on that product becomes `rejected`
   with `autoRejected: true` and a `responseNote` explaining why.
3. The seller's denormalised stats are recalculated.

Accepting also requires the product to still be `available` — if it was reserved
or sold in the meantime the response is **409 LISTING_UNAVAILABLE**.

```bash
curl -X PUT http://localhost:3000/api/offers/$OFFER_ID \
  -H "Content-Type: application/json" \
  -H "x-student-id: $SELLER_ID" \
  -d '{ "action": "accept", "note": "Deal. Reserved for you." }'
```

```bash
# The seller names a price in between
curl -X PUT http://localhost:3000/api/offers/$OFFER_ID \
  -H "Content-Type: application/json" \
  -H "x-student-id: $SELLER_ID" \
  -d '{ "action": "counter", "counterPrice": 650 }'
```

---

### 4.6 Favorites

Requires `x-student-id` on every method. Favourites are always scoped to the
acting student, never to an id taken from the body.

#### `GET /api/favorites` — list saved products

Each item carries a derived `availability` label (BR-17) so the UI can grey out
items that were sold or removed **without** the favourite being deleted.

| `availability` | Derived from product status |
| -------------- | --------------------------- |
| `available` | `available` |
| `reserved` | `reserved` |
| `sold` | `sold` |
| `unavailable` | `deleted` (or missing) |

```bash
curl http://localhost:3000/api/favorites -H "x-student-id: $BUYER_ID"
```

```jsonc
{
  "success": true,
  "data": [
    {
      "id": "6afdbd01...",
      "userId": "6afdbbce...",
      "productId": "6afdbbd5...",
      "savedAt": "2026-11-18T14:53:20.000Z",
      "availability": "reserved",
      "product": { "id": "6afdbbd5...", "title": "…", "status": "reserved", "seller": { … } }
    }
  ]
}
```

#### `POST /api/favorites` — save a product

Body: `{ "productId": "<ObjectId>" }`. Returns **201**.

- Saving your own product → **403** (BR-5).
- Already saved → **409 DUPLICATE** (BR-12). The compound unique index
  `{ user, product }` is the real guarantee against a double-click race.

#### `DELETE /api/favorites` — unsave a product

The product id may be supplied either as a query param or in the body:

```bash
# query string
curl -X DELETE "http://localhost:3000/api/favorites?productId=$PRODUCT_ID" \
  -H "x-student-id: $BUYER_ID"

# JSON body
curl -X DELETE http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -H "x-student-id: $BUYER_ID" \
  -d '{ "productId": "'"$PRODUCT_ID"'" }'
```

Returns **200** `{ "productId": "...", "removed": true }`, or **404** if the
product is not in the saved list.

> **As built (Step 7).** The favourites backend shipped unchanged; Step 7 wired the UI to it. `GET`
> now drives both the header heart (through `FavoritesProvider`, which hydrates the id set and
> updates optimistically) and the server-rendered `/favorites` page. The page uses each item's
> derived `availability` to render reserved/sold/removed favourites correctly without ever deleting
> the favourite (BR-17). The dashboard overview also calls `listFavorites` for its **Saved items**
> counter.

---

## 5. Database schema

Five collections. All use `{ timestamps: true, versionKey: false }`; references
are ObjectIds (no embedding), and deletes are soft.

### `users`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `_id` | ObjectId | |
| `handle` | string | **unique**, lowercase, 3–40 |
| `displayName` | string | 2–60 |
| `email` | string | **unique**, lowercase |
| `campus` | string | 2–80 |
| `department` | string? | ≤ 80 |
| `year` | number? | 1–5 |
| `bio` | string? | ≤ 300 |
| `avatarUrl` | string? | |
| `contactPreference` | enum? | `message` \| `email` \| `either` (default `message`) |
| `stats.activeListings` | number | denormalised (BR-24) |
| `stats.soldCount` | number | denormalised (BR-24) |
| `createdAt` / `updatedAt` | Date | |

Indexes: `handle` (unique), `email` (unique), `{ createdAt: -1 }`.

### `products`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `_id` | ObjectId | |
| `seller` | ObjectId → `users` | required |
| `title` | string | 5–120 |
| `description` | string | 20–4000 |
| `price` | number | 0–1,000,000; `0` for free/exchange |
| `listingType` | enum | `sale` \| `free` \| `exchange` |
| `category` | enum | 10 categories |
| `condition` | enum | `new` \| `like_new` \| `good` \| `fair` \| `poor` |
| `images` | string[] | max 5 |
| `location` | string | 2–120 |
| `exchangeFor` | string? | required when `exchange` |
| `tags` | string[] | max 8, normalised |
| `status` | enum | `available` \| `reserved` \| `sold` \| `deleted` |
| `viewCount` | number | default 0 |
| `reservedFor` | ObjectId? → `users` | set on reserve |
| `reservedAt` | Date? | |
| `soldTo` | ObjectId? → `users` | |
| `soldAt` | Date? | |
| `deletedAt` | Date? | |
| `createdAt` / `updatedAt` | Date | |

Indexes: `product_text_search` (weighted text over title/description/tags),
`{ status, category, price }`, `{ seller, status, createdAt }`,
`{ status, createdAt }`, `{ status, category, createdAt }`, `{ seller }`.

### `enquiries`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `_id` | ObjectId | |
| `product` | ObjectId → `products` | required |
| `seller` | ObjectId → `users` | denormalised from the product |
| `buyer` | ObjectId → `users` | required |
| `message` | string | 5–1000 |
| `offerPrice` | number? | > 0 and < asking price |
| `status` | enum | `pending` \| `accepted` \| `rejected` \| `cancelled` |
| `sellerResponse.message` | string? | ≤ 500 |
| `sellerResponse.respondedAt` | Date? | |
| `respondedAt` | Date? | |
| `createdAt` / `updatedAt` | Date | |

Indexes: `unique_pending_enquiry` (unique **partial** on `{ product, buyer }`
where `status = "pending"`, BR-10), `{ seller, status, createdAt }`,
`{ buyer, createdAt }`.

### `offers`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `_id` | ObjectId | |
| `product` | ObjectId → `products` | required |
| `seller` | ObjectId → `users` | denormalised |
| `buyer` | ObjectId → `users` | required |
| `enquiry` | ObjectId? → `enquiries` | optional back-link |
| `originalPrice` | number | snapshot of the asking price at offer time (BR-21) |
| `offerPrice` | number | > 0, < asking price |
| `counterPrice` | number? | the seller's counter, set while `status = "countered"` (BR-25) |
| `message` | string? | ≤ 500 |
| `status` | enum | `pending` \| `accepted` \| `rejected` \| `withdrawn` \| `countered` |
| `responseNote` | string? | ≤ 500 |
| `autoRejected` | boolean | true when rejected by BR-14 |
| `respondedAt` | Date? | |
| `createdAt` / `updatedAt` | Date | |

Indexes: `{ product, status }`, `unique_pending_offer` (unique **partial** on
`{ product, buyer }` where `status = "pending"`, BR-11),
`{ seller, status, createdAt }`, `{ buyer, createdAt }`.

### `favorites`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `_id` | ObjectId | |
| `user` | ObjectId → `users` | required |
| `product` | ObjectId → `products` | required |
| `createdAt` / `updatedAt` | Date | `createdAt` is exposed as `savedAt` |

Indexes: `{ user, product }` (**unique**, BR-12), `{ user, createdAt }`,
`{ product }`.

### Relationships

```
users ──1:N──▶ products          (products.seller)
users ──1:N──▶ enquiries         (enquiries.buyer)
products ──1:N──▶ enquiries      (enquiries.product; enquiries.seller denormalised)
users ──1:N──▶ offers            (offers.buyer)
products ──1:N──▶ offers         (offers.product; offers.seller denormalised)
enquiries ──0:N──▶ offers        (offers.enquiry, optional)
users ──1:N──▶ favorites
products ──1:N──▶ favorites
products ──0:1──▶ users          (products.reservedFor / products.soldTo)
```

MongoDB has no foreign keys, so referential integrity is enforced in the
service layer: referenced documents are checked before insert, and ownership is
checked before every mutation.

### How indexes are created

`autoIndex` is **off** in every environment. Mongoose's implicit index build is
disabled in production anyway, which would silently leave the unique
constraints (BR-10/11/12) uncreated under `next start`. Instead, indexes are
created explicitly **once per process**, on the first successful connection, by
`ensureIndexes()` in `lib/db/connect.ts` (`Model.createIndexes()` is idempotent
and additive). `lib/db/connect.ts` side-effect-imports `@/lib/db/models` so the
full model set is registered before the first index build — even when the first
request is `GET /api/health`.

---

## 6. Environment variables

| Variable | Scope | Purpose |
| -------- | ----- | ------- |
| `MONGODB_URI` | **server only** | MongoDB connection string (**secret**). |
| `MONGODB_DB_NAME` | server only | Optional. Overrides the database name in the URI. |
| `NEXT_PUBLIC_APP_URL` | public | Canonical URL for metadata/links. |
| `NEXT_PUBLIC_MAX_IMAGES` | public | Image limit for the future uploader (default 5). |

Rules:

- `.env.local` is **gitignored**; `.env.example` is committed with placeholders only.
- Only `NEXT_PUBLIC_*` reaches the browser. `MONGODB_URI` is read solely from
  server code (`lib/db/connect.ts`), which imports `server-only`, so importing
  it from a client component is a build error — the connection string can never
  leak into a bundle.

---

## 7. Business rules implemented

| ID | Rule | Where |
| -- | ---- | ----- |
| BR-2 | Only the owner may update/delete a product. | `product.service.ts` |
| BR-5 | No enquiring/offering/favouriting your own product. | all services |
| BR-6 | Enquiries/offers only while the product is `available`. | enquiry/offer services |
| BR-7 | Offers only on `sale` products. | `offer.service.ts` |
| BR-8 | `free` products are stored at price 0. | `product.ts` validator |
| BR-9 | `exchange` requires `exchangeFor`; price 0. | `product.ts` validator |
| BR-10 | One pending enquiry per (product, buyer). | partial unique index + service |
| BR-11 | One pending offer per (product, buyer). | partial unique index + service |
| BR-12 | One favourite per (user, product). | unique index + service |
| BR-13 | Legal status transitions only. | `product.service.ts` |
| BR-14 | Accepting an offer reserves the product + auto-rejects siblings. | `offer.service.ts` |
| BR-15 | Accepting an enquiry does **not** reserve the product. | `enquiry.service.ts` |
| BR-16 | Delete is a soft delete. | `product.service.ts` |
| BR-17 | Favourites survive; availability is derived. | `favorite.service.ts` |
| BR-18 | `soldAt` stamped when sold. | `product.service.ts` |
| BR-20 | `sale` requires price > 0. | `product.ts` validator |
| BR-21 | Offers/enquiry `offerPrice` must be `> 0` and undercut the asking price. | enquiry/offer services |
| BR-22 | Enquiries/offers on non-available products → 409. | enquiry/offer services |
| BR-23 | Changing `listingType` re-validates price rules. | `product.service.ts` |
| BR-24 | Seller stats recalculated on every status change. | `product.service.ts` |
| BR-25 | A counter offer must sit strictly between the buyer's offer and the asking price. | `offer.service.ts` |

Not yet implemented (later steps): BR-1's `/api/students/me` flow, BR-19 (view
counter endpoint).

---

## 8. End-to-end walkthrough

A complete flow against a local server, using bash. Replace ids as you go.

```bash
BASE=http://localhost:3000

# 1. Health
curl -s $BASE/api/health

# 2. Create a seller and a buyer
SELLER_ID=$(curl -s -X POST $BASE/api/users -H 'Content-Type: application/json' \
  -d '{"displayName":"Seller One","email":"seller1@campus.edu","campus":"Main Campus"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.id')

BUYER_ID=$(curl -s -X POST $BASE/api/users -H 'Content-Type: application/json' \
  -d '{"displayName":"Buyer One","email":"buyer1@campus.edu","campus":"Main Campus"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.id')

# 3. Seller lists a calculator
PRODUCT_ID=$(curl -s -X POST $BASE/api/products \
  -H 'Content-Type: application/json' -H "x-student-id: $SELLER_ID" \
  -d '{"title":"Casio FX-991ES Scientific Calculator",
       "description":"Used for one semester, fully working, slight scratch on the lid.",
       "price":650,"listingType":"sale","category":"calculators","condition":"good",
       "location":"Hostel B, Room 214","tags":["calculator","casio"]}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.id')

# 4. Browse finds it
curl -s "$BASE/api/products?q=casio&category=calculators"

# 5. Buyer enquires
ENQUIRY_ID=$(curl -s -X POST $BASE/api/enquiries \
  -H 'Content-Type: application/json' -H "x-student-id: $BUYER_ID" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"message\":\"Could you do 550?\",\"offerPrice\":550}" \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.id')

# 6. Seller accepts the enquiry — product stays available (BR-15)
curl -s -X PUT $BASE/api/enquiries/$ENQUIRY_ID \
  -H 'Content-Type: application/json' -H "x-student-id: $SELLER_ID" \
  -d '{"action":"accept","response":"Sure, 550 works."}'

# 7. Buyer makes a formal offer
OFFER_ID=$(curl -s -X POST $BASE/api/offers \
  -H 'Content-Type: application/json' -H "x-student-id: $BUYER_ID" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"offerPrice\":550}" \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.id')

# 8a. Seller counters instead of accepting (BR-25)
curl -s -X PUT $BASE/api/offers/$OFFER_ID \
  -H 'Content-Type: application/json' -H "x-student-id: $SELLER_ID" \
  -d '{"action":"counter","counterPrice":600}'

# 8b. Buyer accepts the counter — product is now reserved (BR-14)
curl -s -X PUT $BASE/api/offers/$OFFER_ID \
  -H 'Content-Type: application/json' -H "x-student-id: $BUYER_ID" \
  -d '{"action":"accept","note":"Deal."}'

# 9. Confirm the reservation
curl -s $BASE/api/products/$PRODUCT_ID
```

### Windows PowerShell equivalents

```powershell
$BASE = "http://localhost:3000"

# Health
Invoke-RestMethod "$BASE/api/health"

# Create a seller
$seller = Invoke-RestMethod -Method Post "$BASE/api/users" `
  -ContentType "application/json" `
  -Body '{"displayName":"Seller One","email":"seller1@campus.edu","campus":"Main Campus"}'
$sellerId = $seller.data.id

# Create a product
$product = Invoke-RestMethod -Method Post "$BASE/api/products" `
  -ContentType "application/json" -Headers @{ "x-student-id" = $sellerId } `
  -Body '{"title":"Casio FX-991ES Scientific Calculator","description":"Used for one semester, fully working, slight scratch on the lid.","price":650,"listingType":"sale","category":"calculators","condition":"good","location":"Hostel B, Room 214"}'
$product.data.id
```

---

## 9. Deliberate deviations from `docs/ARCHITECTURE.md`

These are conscious Step 2 decisions, not oversights:

1. **`User` / `Product` instead of `Student` / `Listing`** — requested model
   names. Domain field names (`listingType`, `status`, `seller`, `buyer`,
   `product`, `user`) are unchanged so the Step 1 UI types still line up.
2. **`productId` instead of `listingId`** in request bodies — matches the
   `Product` model.
3. **`PUT` on dynamic routes** (the blueprint specifies `PATCH`). `PATCH` is
   also exported as an alias, so both work.
4. **`DELETE /api/favorites?productId=`** instead of
   `DELETE /api/favorites/[listingId]` — one collection route, id via query or
   body, and it is always scoped to the actor.
5. **`POST /api/users` + `GET /api/users`** instead of the `/api/students/*`
   family — the minimal identity bootstrap needed to exercise the API without
   auth. The `/me` endpoint is deferred.
6. **`GET /api/health`** is included (required by the user's Step 2 list) even
   though it is not in the core endpoint list.
7. **Duplicate favourite → `409 DUPLICATE`**, matching the blueprint's E2E
   matrix (BR-12 allows `409` or idempotent success; `409` was chosen).
8. **No seed script** — data is created through the API (`POST /api/users`,
   then `POST /api/products`), which also exercises the endpoints.
