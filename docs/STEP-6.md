# CampusCycle — Step 6 Report

**The complete Enquiry + Offer system, end to end.**

Step 6 closes the loop the earlier steps deliberately left open. The listing-detail CTAs now send
real requests, and the dashboard inboxes are backed by real data. A student can:

- **Enquire** — ask the seller a question (with an optional price) from `/marketplace/[id]`.
- **Offer** — name a formal price on a `sale` listing.
- **Respond** — the seller accepts, declines, or **counters**; the buyer accepts, declines,
  cancels or withdraws; an accepted offer **reserves** the item and auto-declines the competition.

Everything runs through the same service layer the API uses, so the dashboard and the JSON API can
never disagree. Authentication, uploads and favourites wiring remain out of scope.

---

## 1. Files changed

### New

| File | Purpose |
| ---- | ------- |
| `lib/services/enquiry.service.ts` | Enquiry business logic: create with combination/product checks, list, get, and the respond state machine (`accept`/`reject`/`cancel`). |
| `lib/services/offer.service.ts` | Offer business logic: create with BR-7/BR-21 checks, list, get, the `OFFER_TRANSITIONS` state machine, the counter rule (BR-25) and accept's reserve + auto-reject sweep (BR-14). |
| `lib/validators/enquiry.ts` | `createEnquirySchema`, `respondEnquirySchema`, `enquiryQuerySchema`. |
| `lib/validators/offer.ts` | `createOfferSchema`, `respondOfferSchema` (with `counterPrice`), `offerQuerySchema`. |
| `app/api/enquiries/route.ts` | `GET` (list) + `POST` (create). |
| `app/api/enquiries/[id]/route.ts` | `GET` + `PUT`/`PATCH` (respond). |
| `app/api/offers/route.ts` | `GET` (list) + `POST` (create). |
| `app/api/offers/[id]/route.ts` | `GET` + `PUT`/`PATCH` (respond). |
| `components/dashboard/request-actions.tsx` | Client action bars: enquiry accept/decline/cancel, offer accept/decline/withdraw, and the **counter** modal. Reflects the server state machine. |
| `components/dashboard/inbox-tabs.tsx` | Received / Sent sub-tabs, driven by `?view=sent` (URL state, no client state). |

### Changed

| File | Change |
| ---- | ------ |
| `lib/types.ts` | Added `EnquiryStatus` (`pending \| accepted \| rejected \| cancelled`), `OfferStatus` (`pending \| accepted \| rejected \| withdrawn \| countered`), and the API-shaped `ApiEnquiry` / `ApiOffer`. |
| `lib/constants.ts` | Added `ENQUIRY_STATUSES` / `OFFER_STATUSES` (label + badge tone) and the `enquiryStatusMeta` / `offerStatusMeta` lookups. |
| `lib/db/enums.ts` | `ENQUIRY_STATUS_VALUES` / `OFFER_STATUS_VALUES`, derived from the type unions. |
| `lib/db/models/enquiry.model.ts` | `proposedPrice` → `offerPrice`; status enum updated to the four terminal-aware values. |
| `lib/db/models/offer.model.ts` | `amount` → `offerPrice`; added required `originalPrice` (asking-price snapshot) and optional `counterPrice`; dropped `expiresAt`; status enum updated. |
| `lib/db/serialize.ts` | `EnquiryDto` / `OfferDto` mirror the new fields (`offerPrice`, `originalPrice`, `counterPrice`, `autoRejected`, `respondedAt`). |
| `lib/session.ts` | Added `getCurrentActor()` — the Server Component equivalent of `requireActor`, so pages reuse the exact services the API uses. |
| `lib/contact.ts` | Payload builders now emit `offerPrice` (was `proposedPrice`/`amount`) and include `buyerId`/`sellerId` for combination cross-checking. |
| `components/listings/contact-dialogs.tsx` | Rewritten from "ready to send" to **real POSTs**: validate the draft with the server's own Zod schema, `fetchJson`, then show a success panel + toast or the server's error inline. |
| `components/dashboard/request-cards.tsx` | Rewritten against `ApiEnquiry` / `ApiOffer`; renders the real message, price, counter, response note and auto-decline label. |
| `app/dashboard/enquiries/page.tsx` | Rewritten: real data via `listEnquiries` + `getCurrentActor()`, Received/Sent tabs, Pending/Answered sections. |
| `app/dashboard/offers/page.tsx` | Rewritten: real data via `listOffers`, Received/Sent tabs, In-play/Decided sections. |
| `app/dashboard/page.tsx` | Real received enquiry/offer counts (role `seller`) replace the Step 1 mock panels. |
| `lib/mock-data.ts` | Removed the now-dead mock enquiries/offers and their selectors; only listings + favourites remain. |
| `docs/API.md`, `docs/ARCHITECTURE.md` | Enquiry/offer sections, collection schemas, endpoint tables, BR-21 wording, new **BR-25**, request/response examples and the E2E walkthrough updated. |

---

## 2. Data model

### `enquiries`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `product` | ObjectId → `products` | required |
| `seller` | ObjectId → `users` | denormalised from the product (single-query inbox) |
| `buyer` | ObjectId → `users` | required |
| `message` | string | 5–1000 |
| `offerPrice` | number? | `> 0` and `<` asking price (BR-21) |
| `status` | enum | `pending` \| `accepted` \| `rejected` \| `cancelled` |
| `sellerResponse.message` | string? | ≤ 500 |
| `sellerResponse.respondedAt` | Date? | |
| `respondedAt` | Date? | |
| `createdAt` / `updatedAt` | Date | |

Indexes: `unique_pending_enquiry` (unique **partial** on `{ product, buyer }` where
`status = "pending"` — BR-10), `{ seller, status, createdAt }`, `{ buyer, createdAt }`.

### `offers`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `product` | ObjectId → `products` | required |
| `seller` | ObjectId → `users` | denormalised |
| `buyer` | ObjectId → `users` | required |
| `enquiry` | ObjectId? → `enquiries` | optional back-link |
| `originalPrice` | number | snapshot of the asking price at offer time |
| `offerPrice` | number | `> 0` and `<` asking price |
| `counterPrice` | number? | the seller's counter, set while `status = "countered"` |
| `message` | string? | ≤ 500 |
| `status` | enum | `pending` \| `accepted` \| `rejected` \| `withdrawn` \| `countered` |
| `responseNote` | string? | ≤ 500 |
| `autoRejected` | boolean | `true` when rejected by BR-14 |
| `respondedAt` | Date? | |
| `createdAt` / `updatedAt` | Date | |

Indexes: `{ product, status }` (used by the auto-reject sweep), `unique_pending_offer` (unique
**partial** on `{ product, buyer }` where `status = "pending"` — BR-11), `{ seller, status, createdAt }`,
`{ buyer, createdAt }`.

> **Relationships.** An enquiry/offer references **one product**, **one seller** (denormalised from
> that product) and **one buyer**. An offer may also reference the enquiry it grew out of. The seller
> link is denormalised so the dashboard inbox is one indexed query with no join, and the buyer is
> always the acting student (a client-supplied `buyerId` is cross-checked, never trusted).

---

## 3. Business rules

| ID | Rule | Where |
| -- | ---- | ----- |
| BR-3 | Only the seller may accept/reject an enquiry or accept/reject/counter an offer. | services |
| BR-4 | Only the buyer may cancel an enquiry, withdraw an offer, or answer a counter. | services |
| BR-5 | You cannot enquire on, offer on, or favourite your own product. | `enquiry.service`, `offer.service` |
| BR-6 | Enquiries/offers are allowed **only** while `product.status === "available"`. | services |
| BR-7 | Offers are allowed **only** on `listingType === "sale"`. | `offer.service` |
| BR-10 | At most one pending enquiry per (product, buyer). | partial unique index + service check |
| BR-11 | At most one pending offer per (product, buyer). | partial unique index + service check |
| BR-14 | Accepting an offer reserves the product for that buyer and auto-rejects every other pending **and countered** offer on it. | `offer.service` |
| BR-15 | Accepting an enquiry does **not** reserve the product. | `enquiry.service` |
| BR-21 | An `offerPrice` must be `> 0` and strictly below the asking price. | services |
| BR-22 | Enquiries/offers on a `reserved`/`sold` product return **409 LISTING_UNAVAILABLE**. | services |
| BR-24 | The seller's denormalised stats are recalculated after an accepted offer reserves the product. | `product.service` |
| BR-25 | A counter must be strictly greater than the buyer's `offerPrice` and no greater than `originalPrice`. | `offer.service` |

Additional integrity rules:

- **Product must exist.** A soft-deleted or unknown product is **404 NOT_FOUND** before anything is
  written.
- **Valid buyer/seller/product combination.** `buyerId` is the actor and `sellerId` is the product
  owner; a supplied value that disagrees is **422 RULE_VIOLATION** (never silently trusted).
- **Sold/reserved products take no new enquiries or offers** (BR-6/22).
- **Only legal status transitions.** An illegal move is **422 RULE_VIOLATION**; a move by the wrong
  side is **403 FORBIDDEN**.
- **Timestamps.** `createdAt` / `updatedAt` are automatic; `respondedAt` is stamped on every
  response. `originalPrice` is snapshotted so a later listing edit cannot rewrite offer history.

---

## 4. Status lifecycles

### Enquiry

```
                 ┌───────────── seller: accept ──▶ accepted
pending ─────────┼───────────── seller: reject ──▶ rejected
                 └───────────── buyer:  cancel ──▶ cancelled
```

| From | Allowed to |
| ---- | ---------- |
| `pending` | `accepted` (seller), `rejected` (seller), `cancelled` (buyer) |
| `accepted` / `rejected` / `cancelled` | — (terminal) |

### Offer

```
                 ┌── seller: accept ─────────────────────────▶ accepted   (reserves the product, BR-14)
                 ├── seller: reject ─────────────────────────▶ rejected
pending ─────────┼── seller: counter ──▶ countered ──────────┐
                 └── buyer:  withdraw ────────────────────────┼──▶ withdrawn
                                                              │
countered ───────────────────────────────────────────────────┤
   ├── buyer: accept ────────────────────────────────────────▶ accepted  (reserves the product)
   ├── buyer: reject ────────────────────────────────────────▶ rejected
   └── buyer: withdraw ──────────────────────────────────────▶ withdrawn
```

| From | Allowed to |
| ---- | ---------- |
| `pending` | `accepted` (seller), `rejected` (seller), `countered` (seller), `withdrawn` (buyer) |
| `countered` | `accepted` (buyer), `rejected` (buyer), `withdrawn` (buyer) |
| `accepted` / `rejected` / `withdrawn` | — (terminal) |

**Accepting an offer** performs three side effects (BR-14):

1. The product moves to `reserved`, with `reservedFor = buyer` and `reservedAt` set.
2. Every other `pending` or `countered` offer on that product becomes `rejected` with
   `autoRejected: true` and an explanatory `responseNote`.
3. The seller's denormalised stats are recalculated (BR-24).

Accepting also requires the product to still be `available` — if it was reserved or sold in the
meantime, the response is **409 LISTING_UNAVAILABLE**.

---

## 5. API endpoints

Every route exports `runtime = "nodejs"` and `dynamic = "force-dynamic"`. Writes require an
`x-student-id` header.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/api/enquiries?role=seller\|buyer\|all&status=&productId=&page=&limit=` | List the actor's enquiries |
| `POST` | `/api/enquiries` | Submit an enquiry → **201 pending** |
| `GET` | `/api/enquiries/[id]` | Single enquiry (seller or buyer only) |
| `PUT`/`PATCH` | `/api/enquiries/[id]` | `{ action: "accept" \| "reject" \| "cancel", response? }` |
| `GET` | `/api/offers?role=…&status=…&productId=&page=&limit=` | List the actor's offers |
| `POST` | `/api/offers` | Submit an offer → **201 pending** |
| `GET` | `/api/offers/[id]` | Single offer (seller or buyer only) |
| `PUT`/`PATCH` | `/api/offers/[id]` | `{ action: "accept" \| "reject" \| "withdraw" \| "counter", counterPrice?, note? }` |

**Request bodies**

```jsonc
// POST /api/enquiries
{ "productId": "…", "buyerId": "…", "sellerId": "…",
  "message": "Is the lid scratch deep? Could you do 550?", "offerPrice": 550 }

// POST /api/offers
{ "productId": "…", "buyerId": "…", "sellerId": "…",
  "offerPrice": 600, "message": "Can collect today." }
```

`buyerId` / `sellerId` are optional but, when supplied, must match the actor and the product owner
otherwise **422 RULE_VIOLATION**.

**Error responses** — the standard envelope with a stable code:

| Code | HTTP | When |
| ---- | ---- | ---- |
| `VALIDATION_ERROR` | 400 | Body/query failed Zod validation (bad id, short message, `offerPrice ≤ 0`). |
| `INVALID_ID` | 400 | A path id is not a valid ObjectId. |
| `UNAUTHORIZED_ACTOR` | 401 | Missing or unknown `x-student-id`. |
| `FORBIDDEN` | 403 | Not a participant, or the wrong side of the request. |
| `NOT_FOUND` | 404 | Unknown / soft-deleted product, enquiry or offer. |
| `DUPLICATE` | 409 | A pending enquiry/offer already exists (BR-10/11). |
| `LISTING_UNAVAILABLE` | 409 | The product is not `available` (BR-6/22). |
| `RULE_VIOLATION` | 422 | A BR-x rule was broken (BR-5/7/21/25, illegal transition, bad combination). |

---

## 6. Data flow

### Listing detail — sending

```
POST /api/enquiries | /api/offers
  │
  ├─ requireActor(request)               ─▶ x-student-id → real student   ✗ 401 UNAUTHORIZED_ACTOR
  ├─ readJsonBody + Zod schema           ─▶ 400 VALIDATION_ERROR
  │
  └─ service (enquiry.service / offer.service)
        ├─ load product (not soft-deleted)          ✗ 404 NOT_FOUND
        ├─ BR-5  actor ≠ seller                     ✗ 403 FORBIDDEN
        ├─ BR-6/22 product.status === "available"   ✗ 409 LISTING_UNAVAILABLE
        ├─ BR-7  sale-only (offers)                 ✗ 422 RULE_VIOLATION
        ├─ BR-21 offerPrice < price                 ✗ 422 RULE_VIOLATION
        ├─ BR-10/11 one pending per (product, buyer) ✗ 409 DUPLICATE
        └─ insert ─▶ 201 pending
```

### Listing detail — the dialogs (client islands)

`ContactActions` builds the body with `buildEnquiryDraft` / `buildOfferDraft`, validates it with the
**same** `createEnquirySchema` / `createOfferSchema` the server uses, then `fetchJson`es it. The
server response drives the UI: a success panel + toast on `201`, or the server's own message inline
on failure. The CTAs are hidden on your own listing and disabled on a non-`available` one; **Make an
offer** only appears for `sale` listings (BR-7).

### Dashboard inboxes (Server Components)

```
GET /dashboard/enquiries?view=received|sent
  │
  ├─ connectToDatabase()
  ├─ getCurrentActor()                    ─▶ cookie → IUser   (null → redirect /setup)
  ├─ listEnquiries({ role: seller|buyer, … }, actor)   ← the same service the API uses
  └─ <EnquiryCard viewerRole=… /> per row
        └─ <EnquiryActions/> (client) ─▶ PUT /api/enquiries/[id] ─▶ router.refresh()
```

The offer page is identical against `listOffers`. The action bar only renders the moves that are
legal from the request's current status **and** for the viewer's side, mirroring the server state
machine exactly. `?view=sent` flips the query to the buyer's outbox — URL state, so the tab survives
a refresh and is shareable.

### Dashboard overview

`/dashboard` counts real received enquiries and offers (role `seller`) with `getCurrentActor()` +
`listEnquiries` / `listOffers`. "Waiting" counts pending enquiries and pending **or countered**
offers — a counter is still in play.

---

## 7. UI feedback

| Situation | Surface |
| --------- | ------- |
| Enquiry sent | Success panel + toast ("Enquiry sent"); dialog resets on close. |
| Offer sent | Success panel + toast ("Offer sent"). |
| Seller accepts/declines an enquiry | Toast on success; list refreshes. |
| Buyer cancels an enquiry | Toast; the card moves to the Answered list. |
| Offer accept/decline/withdraw | Toast; accept explains the item is now reserved. |
| Counter submitted | Modal closes + toast; invalid counter price shows **inline** in the modal. |
| Client-side validation | Inline `role="alert"` message; the dialog stays open. |
| Server rejection | The API's own message is shown verbatim (inline in a dialog, toast on an action bar). |
| No profile selected | Info banner in the dialog; the submit button is disabled. |
| Empty inbox | `EmptyState` per section ("No open enquiries", "No offers in play", …). |

---

## 8. Testing cases

### Automated — 117/117 pass

`node campuscycle-step6.mjs` (server on `:3001`). Seeds a seller, two buyers and an outsider, then
exercises every rule over the real API and renders the dashboard pages.

| # | Area | Representative assertions |
| - | ---- | ------------------------- |
| 1 | **Enquiry create** | `201`; `status: "pending"`; `productId`/`buyerId` recorded; `sellerId` derived from the product; `offerPrice` stored; `createdAt ≤ updatedAt`. |
| 2 | **Enquiry validation + auth** | no header → `401 UNAUTHORIZED_ACTOR`; malformed id → `400 VALIDATION_ERROR`; short message → `400` (details name the field); negative price → `400`; unknown product → `404 NOT_FOUND`. |
| 3 | **Enquiry business rules** | own product → `403` (BR-5); reserved/sold → `409 LISTING_UNAVAILABLE` (BR-6/22); soft-deleted → `404`; second pending → `409 DUPLICATE` (BR-10); `offerPrice ≥ asking` → `422` (BR-21); `buyerId`/`sellerId` mismatch → `422`. |
| 4 | **Enquiry transitions** | seller accept → `accepted` + `respondedAt` + reply stored; re-accept → `422`; buyer can't accept → `403`; seller can't cancel → `403`; outsider → `403`; buyer cancel → `cancelled`; seller reject → `rejected`; unknown action → `400`; unknown/malformed id → `404`/`400 INVALID_ID`. |
| 5 | **Enquiry list + get** | `role=seller` returns only received; `role=buyer` only sent; `status=pending` filters; get by id as seller/buyer `200`, as outsider `403`. |
| 6 | **Offer create + validation** | `201`; `originalPrice` snapshots asking; `autoRejected: false`; `offerPrice 0` → `400`; `==`/`>` asking → `422` (BR-21); own product → `403`; unknown → `404`; duplicate → `409` (BR-11); free/exchange → `422` (BR-7); reserved/sold → `409`; `buyerId` mismatch → `422`. |
| 7 | **Offer accept (BR-14)** | buyer can't accept → `403`; seller accept → `accepted`; product → `reserved` with `reservedForId = buyer`; sibling offer → `rejected` + `autoRejected: true`; accepting an auto-rejected offer → `422`; new offer on the reserved product → `409`. |
| 8 | **Reject / withdraw / counter (BR-25)** | seller reject → `rejected`; re-reject → `422`; seller can't withdraw → `403`; buyer withdraw → `withdrawn`; counter `≤ offer` → `422`; counter `> asking` → `422`; counter without a price → `422`; buyer can't counter → `403`; seller counter → `countered` + `counterPrice`; seller can't re-counter → `422`; buyer accepts counter → `accepted` + product reserved; buyer withdraws a counter → `withdrawn`. |
| 9 | **Accept when unavailable** | product reserved after the offer → accept → `409`. |
| 10 | **Offer list + get** | `role=seller` only received; `role=buyer` only sent; outsider get → `403`; unknown → `404`. |
| 11 | **Dashboard render** | `/dashboard/enquiries` `200` + shows the received message + Received tab; `?view=sent` `200`; `/dashboard/offers` `200` + shows the received offer; `/dashboard` `200` + shows "Received enquiries"/"Received offers". |

### Regression — still green

- Step 3 API suite — **54/54** (`campuscycle-step3-e2e.mjs`).
- Step 3 page suite — **33/33** (`campuscycle-step3-pages.mjs`).
- Step 4 discovery suite — **56/56** (`campuscycle-step4-discovery.mjs`).
- Step 5 page suite — **55/55** (`campuscycle-step5-pages.mjs`).

### Manual smoke checks

| Scenario | Expected |
| -------- | -------- |
| Enquire on someone else's available listing | `201`; toast + success panel; appears in the seller's Received tab. |
| Enquire twice on the same listing | Second → `409 DUPLICATE`. |
| Enquire on your own listing | CTAs hidden; API → `403`. |
| Offer above the asking price | `422 RULE_VIOLATION`; inline error. |
| Offer on a free/exchange listing | No **Make an offer** button; API → `422` (BR-7). |
| Seller accepts an offer | Product reserved; rival offers auto-declined. |
| Seller counters an offer | Modal → toast; buyer sees "Seller countered with ₹X". |
| Buyer accepts the counter | `accepted`; product reserved. |
| Enquire/offer on a reserved or sold listing | CTAs disabled; API → `409`. |

### Quality gates

`npm run typecheck`, `npm run lint` and `npm run build` all pass. The build lists
`/api/enquiries`, `/api/enquiries/[id]`, `/api/offers`, `/api/offers/[id]`, `/dashboard/enquiries`
and `/dashboard/offers` as dynamic routes.

---

## 9. STEP 6 completion checklist

**Enquiry**

- [x] **Enquiry form + API** — `POST /api/enquiries` (`productId`, `buyerId`, `sellerId`, `message`, optional `offerPrice`).
- [x] **Seller enquiry list** — `/dashboard/enquiries` (Received), real data.
- [x] **Accept / reject enquiry** — seller only, optional reply stored on `sellerResponse`.
- [x] **Buyer cancel** — buyer only; every terminal state is final.
- [x] **Status transitions** — `pending → accepted | rejected | cancelled`; illegal → `422`, wrong side → `403`.
- [x] **Validation** — message 5–1000; `offerPrice > 0` and `<` asking (BR-21).
- [x] **Business rules** — BR-5, BR-6/22, BR-10, BR-15; valid product; valid buyer/seller combination.
- [x] **Timestamps** — `createdAt`/`updatedAt`/`respondedAt` maintained.

**Offer**

- [x] **Offer form + API** — `POST /api/offers` (`productId`, `buyerId`, `sellerId`, `offerPrice`, optional `message`/`enquiryId`).
- [x] **Seller offer management** — `/dashboard/offers` (Received), real data.
- [x] **Accept / reject offer** — seller only (buyer on a counter).
- [x] **Counter offer** — seller counters a pending offer; strictly between the offer and the asking price (BR-25).
- [x] **Withdraw** — buyer on a `pending` or `countered` offer.
- [x] **Status transitions** — `pending → accepted | rejected | withdrawn | countered`, `countered → accepted | rejected | withdrawn`; illegal → `422`, wrong side → `403`.
- [x] **Prevent offers on unavailable products** — reserved/sold → `409` (BR-6/22).
- [x] **Validate offer price** — `> 0` and `<` asking (BR-21); counter between offer and asking (BR-25).
- [x] **Prevent invalid combinations** — own listing → `403` (BR-5); free/exchange → `422` (BR-7); mismatched `buyerId`/`sellerId` → `422`; duplicate pending → `409` (BR-11).
- [x] **Accepted offer reserves the product** — `reserved` + `reservedFor` + auto-reject siblings + stats recalculated (BR-14/24).
- [x] **Timestamps** — `createdAt`/`updatedAt`/`respondedAt`; `originalPrice` snapshot.

**Cross-cutting**

- [x] **Database relationships** — enquiry/offer → product/seller/buyer (offer → optional enquiry); denormalised seller.
- [x] **Proper API error responses** — standard envelope with stable codes (`VALIDATION_ERROR`, `INVALID_ID`, `UNAUTHORIZED_ACTOR`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE`, `LISTING_UNAVAILABLE`, `RULE_VIOLATION`).
- [x] **Success + failure UI feedback** — success panels + toasts; server messages inline/toast; empty states.
- [x] **Dashboard overview** — real received enquiry/offer counts.
- [x] **Quality gates** — `typecheck`, `lint`, `build` all pass.
- [x] **Verification** — 117/117 Step 6 assertions + 54/54, 33/33, 56/56 and 55/55 regressions.

**Step 6 is complete. Not starting Step 7.**
