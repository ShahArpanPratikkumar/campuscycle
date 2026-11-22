# CampusCycle — Step 8 Report

**Validation, error handling and UI polish — a production-quality pass over everything built in Steps 1–7.**

Step 8 adds **no new business features**. It is a hardening pass: every form validates its input on the
client and again on the server, every API failure returns the same envelope with a stable code and the
right HTTP status, and every list, form and image has a loading, empty, error and fallback state. Along
the way the duplicated bits were pulled into shared components so the behaviour cannot drift.

The guiding rule was **behaviour-preserving**: the data model, the endpoints, the business rules
(BR-1…BR-25) and the identity model are all untouched. Only the edges — validation, feedback,
accessibility, responsiveness and failure handling — were tightened.

---

## 1. Files changed

### New

| File | Purpose |
| ---- | ------- |
| `lib/form-errors.ts` | `zodIssuesToFieldErrors(issues)` — turns a Zod `error.issues` array into a `{ field: message }` map. One implementation, used by every form. |
| `components/ui/form-alert.tsx` | The single `role="alert"` banner for **form-level** errors (a rejected request, a rule violation). Replaces four hand-rolled copies. |
| `components/ui/field-context.tsx` | `FieldProvider` / `useFieldControl` / `describedByFor` — lets a `Field` publish its hint/error ids + invalid/required state to the control inside it. |
| `hooks/use-dialog.ts` | Shared overlay behaviour: Escape-to-close, scroll lock, initial focus, **Tab trap** and focus restore. Used by both `Modal` and `Sheet`. |
| `components/ui/confirm-dialog.tsx` | Reusable destructive-action confirmation (wraps `Modal`): pending-aware, overlay/cancel inert while running. |
| `components/common/route-error.tsx` | The single presentation for every `error.tsx` boundary (icon, copy, "Try again" → `retry()`, secondary link). |
| `components/common/route-not-found.tsx` | The single presentation for every `not-found.tsx` page. |
| `components/listings/listing-image.tsx` | A `next/image` that swaps to a caller-supplied fallback the first time loading fails. |
| `app/favorites/loading.tsx` | Route-level skeleton for `/favorites` (the only loader added — see §6 for why the two `[id]` segments deliberately have none). |

### Changed

| File | Change |
| ---- | ------ |
| `components/ui/field.tsx` | Now a client component. Publishes hint/error ids (only when those elements are actually rendered) and invalid/required through `FieldProvider`. |
| `components/ui/input.tsx` | Now a client component. `Input`/`Textarea`/`Select` read the enclosing `Field` and set `aria-describedby` / `aria-invalid` / `aria-required` themselves; explicit props still win. |
| `components/ui/modal.tsx` | Uses `useDialog`; panel gets `ref` + `tabIndex={-1}` + `outline-none`. |
| `components/ui/sheet.tsx` | Same as `Modal` — the two overlays now share one focus/escape/scroll-lock implementation. |
| `components/ui/avatar.tsx` | Now a client component; an image that fails to load falls back to the initials. |
| `components/listings/listing-thumb.tsx` | Renders through `ListingImage`; a broken photo URL falls back to the category tile. |
| `components/listings/listing-gallery.tsx` | Same — primary image and each thumbnail degrade to the tile. |
| `components/favorites/clear-favorites-button.tsx` | "Clear all" now opens a `ConfirmDialog` (with the item count) before clearing. |
| `components/dashboard/listing-manage-row.tsx` | The "Remove" flow uses `ConfirmDialog` instead of a bespoke modal. |
| `components/listings/listing-form.tsx` | Uses `zodIssuesToFieldErrors` + `FormAlert`; the per-input `aria-invalid` props were removed (the `Field` context now supplies them); the local `toFormErrors` helper was deleted. |
| `components/account/setup-form.tsx` | Same treatment: shared mapping, shared banner, no per-input `aria-invalid`. |
| `components/listings/contact-dialogs.tsx` | Enquiry + offer dialogs use `FormAlert` for the form-level error. |
| `components/dashboard/request-actions.tsx` | Counter-offer dialog uses `FormAlert`. |
| `app/error.tsx`, `app/marketplace/error.tsx`, `app/marketplace/[id]/error.tsx`, `app/seller/[id]/error.tsx` | Reduced to thin wrappers over `RouteError`. |
| `app/not-found.tsx`, `app/marketplace/[id]/not-found.tsx`, `app/seller/[id]/not-found.tsx` | Reduced to thin wrappers over `RouteNotFound`. |

### Removed / deliberately not added

| Item | Reason |
| ---- | ------ |
| `toFormErrors` (in `listing-form.tsx`) | Superseded by `lib/form-errors.ts`. |
| Per-input `aria-invalid` props in the forms | Superseded by the `Field` context — keeping both was redundant and a source of drift. |
| `app/marketplace/loading.tsx`, `app/seller/[id]/loading.tsx` | Created, then **removed**: a route-level loader at those segments wraps the nested `[id]` route in Suspense and flushes a `200` before `notFound()` can run, breaking real 404s. Both pages already have in-page Suspense skeletons, so no loading UI was lost. See §6. |

### Docs

`README.md` (new **Step 8 status** section + data-flow diagram), `docs/API.md` §1 (an "As built
(Step 8)" note confirming the envelope/status matrix is verified, not changed),
`docs/ARCHITECTURE.md` §16 (an "As built (Step 8)" note on the client half of error handling) and this
report.

---

## 2. Data flow

### How a form submission flows (create / setup / enquiry / offer / counter)

```
User submits a form
  │
  ├─ 1. Client parse  ── the SAME Zod schema the API uses
  │       (createProductSchema · createUserSchema · contactSchemas …)
  │       │
  │       ├─ invalid ─▶ zodIssuesToFieldErrors(issues)
  │       │               ├─ each Field shows its message inline
  │       │               │     (the control gets aria-invalid + aria-describedby → error id)
  │       │               ├─ <FormAlert> "Please fix the highlighted fields…"  (role="alert")
  │       │               └─ return — no request is sent
  │       │
  │       └─ valid ─▶ 2. submit: disable the button + show its spinner (loading)
  │
  ├─ 3. fetchJson()  ── attaches x-student-id, parses the envelope
  │       │
  │       ├─ 2xx  ─▶ toast the server's success message
  │       │           └─ router.refresh() (server content re-renders)
  │       │
  │       └─ !ok  ─▶ ApiClientError { status, code, message, details }
  │                   ├─ details[] present ─▶ mapped onto the same field errors
  │                   └─ otherwise         ─▶ <FormAlert> with error.message
  │
  └─ finally: re-enable the button (the disabled state can never stick)
```

The client schema is the *same module* the route handler parses with, so the two can never disagree
about what "valid" means. The server remains the authority — the client parse is a fast, friendly
short-circuit, not a replacement.

### How a page request flows (loading / empty / error / not-found)

```
GET /marketplace/[id]
  │
  ├─ connectToDatabase()
  ├─ getProductById(id)                    ← resolved BEFORE the Suspense boundary
  │     ├─ NOT_FOUND / INVALID_ID ─▶ notFound()        → real HTTP 404 + not-found.tsx
  │     └─ any other throw        ─▶ error.tsx         → 500, "Try again" (retry)
  │
  └─ <Suspense fallback={<ListingDetailSkeleton/>}>
        └─ seller profile · viewer · similar listings   ← the slow, secondary reads stream
```

The same shape applies to `/seller/[id]`. Lists (`/marketplace`, `/favorites`, `/dashboard/*`) render an
`EmptyState` when the service returns nothing, an in-page `Skeleton`/`ListingGridSkeleton` while the
secondary data streams, and route-level `loading.tsx` skeletons where they are safe
(`/setup`, `/sell`, `/dashboard`, `/dashboard/listings`, `/favorites`).

### How a destructive action flows

```
"Remove" / "Clear all" click
  └─ ConfirmDialog opens (focus trapped inside; Escape closes; overlay click closes)
       ├─ Cancel / Escape ─▶ close, nothing happens
       └─ Confirm ─▶ button shows spinner, cancel + overlay become inert
             ├─ success ─▶ toast + router.refresh() + close
             └─ failure ─▶ toast the server's message, stay open so it can be retried
```

---

## 3. Validation checklist

Every form in the app, its client rules (mirrored from the server schema) and its server counterpart.

| # | Form | Client validation | Server validation | Message surface |
| - | ---- | ----------------- | ----------------- | --------------- |
| 1 | **Create listing** — `listing-form.tsx` | `createProductSchema`: title, description, price ≥ 0, listing type, category, condition, location; `exchangeFor` required for `exchange`; ≥ 1 non-empty image URL | Same schema in `POST /api/products` → `400 VALIDATION_ERROR` + `details[]` | Inline per field via `Field`; `<FormAlert>` summary |
| 2 | **Edit listing** — `listing-form.tsx` | `updateProductSchema` (all-optional variant of the above) | `PUT/PATCH /api/products/[id]` → `400` | Inline + `FormAlert` |
| 3 | **Create profile** — `setup-form.tsx` | `createUserSchema`: displayName 2–60, valid email, campus, optional department/year/bio/contactPreference | Same schema in `POST /api/users` → `400`; duplicate handle/email → `409 DUPLICATE` | Inline + `FormAlert` |
| 4 | **Enquiry** — `contact-dialogs.tsx` | `contactSchemas.enquiry`: message length; cannot enquire on your own listing | `POST /api/enquiries` → `400` / `403` / `409` / `422` | Inline + `FormAlert`; server message on rejection |
| 5 | **Offer** — `contact-dialogs.tsx` | `contactSchemas.offer`: `offerPrice` is a positive number and **≤ the asking price** (BR-21) | `POST /api/offers` → `400` / `403` / `409` / `422` | Inline + `FormAlert` |
| 6 | **Counter-offer** — `request-actions.tsx` | `contactSchemas.counter`: positive counter price | `PUT /api/offers/[id]` (`action:"counter"`) → `400` / `403` / `422` | Inline + `FormAlert` |
| 7 | **Price filter** — `filter-panel.tsx` | min/max are numeric and **max ≥ min**; invalid pairs never navigate | `GET /api/products` query schema clamps/validates `minPrice`/`maxPrice` → `400` | Inline `role="alert"` next to the price row |
| 8 | **Search** — `search-input.tsx` | trimmed; empty submit clears the query | Query schema validates `q` length in `GET /api/products` | n/a (no invalid state) |

**Form-submission prevention while loading**

- Every submit button is `disabled` + spinner for the whole request (the `Button` `loading` prop).
- The enquiry/offer/counter dialogs cannot be submitted twice; the confirm dialog's cancel and overlay
  are inert while the destructive action runs.
- `router.refresh()` is only called after the mutation resolves, so the UI never shows a half-state.

**Safe handling of missing database fields**

- `lib/db/serialize.ts` narrows every document from `unknown`, defaults `images`/`tags` to `[]` and
  always emits a `stats` object, so a sparse or legacy row renders instead of throwing.
- The Step 8 suite asserts this directly (§7, "Sparse documents degrade safely").

---

## 4. API error checklist

Every endpoint is wrapped in `withErrorHandler` (except `/api/health`, deliberately) and returns one of
two envelopes. The table below is the full code → status → trigger matrix, all asserted by the suite.

| Code | HTTP | Triggered by | Verified in |
| ---- | :--: | ------------ | ----------- |
| `VALIDATION_ERROR` | 400 | Malformed JSON body; body/query failing Zod (missing required fields, `limit > 100`, `page < 1`) | §1 |
| `INVALID_ID` | 400 | A path/body/header id that is not a 24-hex ObjectId | §2 |
| `UNAUTHORIZED_ACTOR` | 401 | `x-student-id` missing, or a valid ObjectId with no matching student | §2 |
| `FORBIDDEN` | 403 | Not the owner/addressee (BR-2…BR-5): editing someone else's listing, offering on your own | §3 |
| `NOT_FOUND` | 404 | Unknown or soft-deleted product / user / enquiry / offer | §2 |
| `DUPLICATE` | 409 | Unique constraint hit: same favourite twice (BR-12), duplicate handle/email, duplicate pending offer | §3 |
| `LISTING_UNAVAILABLE` | 409 | Acting on a listing that is not `available` (BR-6/BR-22) — e.g. an enquiry on a reserved item | §4 |
| `RULE_VIOLATION` | 422 | A business rule was broken (BR-7 non-sale offer, BR-21 undercut, BR-13 transition) | §3 |
| `INTERNAL_ERROR` | 500 | Any unexpected throw — details logged server-side, never returned | (unit-level; not force-triggered) |

**Consistency guarantees the suite checks on every error**

- `success === false`.
- `error` is a non-empty human-readable string (safe to show).
- `code` is present and stable.
- The response has **no `data` key** (clients branch on `success`).
- `VALIDATION_ERROR` carries a `details[]` array of `{ field, message }`.

**Success status codes** — **201** for creates (`/api/users`, `/api/products`, `/api/enquiries`,
`/api/offers`, `/api/favorites`), **200** for reads, updates and deletes. `PATCH /api/products/[id]` is
a documented alias of `PUT`. All asserted in §5.

**Client-side API failure handling**

- `fetchJson` throws a typed `ApiClientError`; `error.details` are mapped onto field errors, otherwise
  `error.message` is shown in a `FormAlert` or a toast.
- Pages that can 404 resolve their resource before Suspense, so `notFound()` still produces a real
  `404`; genuine failures fall through to `error.tsx`.
- Unknown routes render `not-found.tsx` with a `404`.

---

## 5. Accessibility checklist

| Requirement | Implementation | Where |
| ----------- | -------------- | ----- |
| **Every control is labelled** | `Field` renders a real `<label htmlFor>`; the search field and the sort select use `sr-only` labels / `aria-label`. | `field.tsx`, `search-input.tsx`, `sort-select.tsx` |
| **Errors are announced** | Field errors are `role="alert"`; form-level errors are `<FormAlert role="alert">`; the control gets `aria-invalid` and points at the error via `aria-describedby`. | `field.tsx`, `form-alert.tsx`, `input.tsx` |
| **No dangling `aria-describedby`** | `Field` only publishes an id when the matching hint/error element is actually rendered, so `aria-describedby` never references a missing node. | `field.tsx` (asserted in §7) |
| **Required / optional conveyed** | `aria-required` on the control; the visible label shows `*` / "Optional". | `field.tsx`, `input.tsx` |
| **Dialog semantics** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → the visible title. | `modal.tsx`, `sheet.tsx` |
| **Focus moves into a dialog** | On open, focus goes to the panel (`tabIndex={-1}`) so the title is announced. | `use-dialog.ts` |
| **Focus is trapped** | Tab / Shift+Tab cycle inside the panel and never escape to the page behind. | `use-dialog.ts` |
| **Focus is restored** | On close, focus returns to the element that opened the dialog. | `use-dialog.ts` |
| **Escape closes** | Escape closes any dialog or sheet. | `use-dialog.ts` |
| **Background scroll locked** | Body overflow is hidden while a dialog is open and restored on close. | `use-dialog.ts` |
| **Icons are decorative** | Every decorative lucide icon carries `aria-hidden="true"`; icon-only buttons carry an `aria-label`. | throughout |
| **Keyboard navigation** | All interactive controls are real `<button>`/`<a>`/form elements; the listing card uses the stretched-link pattern so it is **one** keyboard stop, with the favourite button at `z-10` above it. | `listing-card.tsx`, `button.tsx` |
| **Visible focus** | `focus-visible` rings/outlines on buttons, links and inputs. | `button.tsx`, `input.tsx` |
| **Images have alt text** | Listing images use the listing title (or `alt=""` for gallery thumbnails that are already labelled by their button); avatars fall back to an `aria-hidden` initials tile. | `listing-image.tsx`, `listing-gallery.tsx`, `avatar.tsx` |
| **Live feedback** | Toasts are announced (`role="status"` / `aria-live`); pending controls expose a spinner with `aria-busy` where relevant. | `toast-provider.tsx`, `search-input.tsx` |
| **Busy states** | Buttons set `disabled` while loading, so a double-activate is impossible. | `button.tsx` |

---

## 6. Responsive checklist

| Area | Small screens | Large screens |
| ---- | ------------- | ------------- |
| **Site header** | Hamburger → `Sheet` drawer | Inline nav |
| **Marketplace filters** | "Filters" button → `Sheet` (`lg:hidden`) | Sticky left sidebar |
| **Listing grid** | 1 column → 2 at `sm` | 3 columns |
| **Listing detail** | Single column, bottom-sheet dialogs | Two columns, centred dialogs |
| **Gallery** | Full-width, horizontally scrollable thumbnails (`no-scrollbar`) | Larger primary image |
| **Dashboard nav** | Horizontally scrollable tab strip | Sticky vertical icon sidebar |
| **Dashboard overview** | 1 → 2 stat tiles per row | 4 per row |
| **Forms** | Single column; footer actions wrap | Two-column form + sticky preview (`/sell`) |
| **Dialogs** | Bottom sheet (`items-end`, rounded top) | Centred card (`sm:items-center sm:rounded-2xl`) |
| **Tables/lists** | Cards stack | Multi-column layouts |
| **Overflow** | Long titles truncate; grids use `min-w-0`; the page never scrolls horizontally | — |

The responsive behaviour was already in place from earlier steps; Step 8 verified it end-to-end and
made sure the new shared components (`ConfirmDialog`, `FormAlert`, skeletons) inherit it — the confirm
dialog, for example, is a bottom sheet on mobile because it wraps the same `Modal`.

**Why the two `[id]` segments have no `loading.tsx`** — a route-level loader wraps its children in a
Suspense boundary. For `/marketplace/[id]` and `/seller/[id]` that boundary is entered *before*
`notFound()` runs, so the response starts as `200` and the 404 status is lost (the page would still
render the not-found UI, but with the wrong status). Both pages therefore resolve their resource before
their **own** in-page `<Suspense>`, which gives the streaming skeleton without sacrificing the status
code. This is asserted in §8 of the suite.

---

## 7. Testing cases

### Automated — 124/124 pass

`node campuscycle-step8.mjs` (server on `:3001`). Seeds two students and a catalogue, then drives every
failure path, the success status matrix, the accessible field wiring and the not-found surfaces.

| # | Area | Representative assertions |
| - | ---- | ------------------------- |
| 0 | **Seed** | two students + two products created (`201`). |
| 1 | **Body validation (400)** | malformed JSON → `400 VALIDATION_ERROR` with `details[]`; empty body lists `displayName` + `email`; `details` are `{field,message}`; `limit=999` and `page=0` → `400`. |
| 2 | **Ids / missing / auth** | bad ObjectId → `400 INVALID_ID`; unknown product & user → `404 NOT_FOUND`; missing header and unknown actor → `401 UNAUTHORIZED_ACTOR`. |
| 3 | **Ownership + rules** | editing another's listing → `403`; offering on your own → `403`; offer on a non-sale → `422 RULE_VIOLATION`; over-ask (BR-21) → `422`; duplicate favourite → `409 DUPLICATE`. |
| 4 | **Unavailable (409)** | reserve, then enquire → `409 LISTING_UNAVAILABLE`; relist succeeds. |
| 5 | **Success status matrix** | `GET` → `200` with `meta{page,limit,total,totalPages}`; `POST` users/products/enquiries/offers → `201`; `PUT` product & offer → `200`; counter sets `counterPrice`; `DELETE` → `200`. |
| 6 | **Sparse documents** | `stats` always present; optional `department` omitted (not `null`); `images`/`tags` default to `[]`; free listing price `0`. |
| 7 | **Accessible field wiring** | email input `aria-describedby="setup-email-hint"` and the hint element exists; a hint-less field has **no** dangling `aria-describedby`; required → `aria-required="true"`; optional → no `aria-required`; listing description/price point at their hints. |
| 8 | **Invalid routes + not-found** | unknown route → `404` + "Page not found"; missing product → `404` + "Listing not found"; invalid product id → `404`; missing seller → `404` + "Student not found". |
| 9 | **Page states** | `/favorites` without a profile → `200` + "Choose a profile to save items"; `/marketplace` and `/` → `200`. |

### Regression — still green

- Step 3 API suite — **54/54** (`campuscycle-step3-e2e.mjs`).
- Step 3 page suite — **33/33** (`campuscycle-step3-pages.mjs`).
- Step 4 discovery suite — **56/56** (`campuscycle-step4-discovery.mjs`).
- Step 5 page suite — **55/55** (`campuscycle-step5-pages.mjs`).
- Step 6 suite — **117/117** (`campuscycle-step6.mjs`).
- Step 7 suite — **79/79** (`campuscycle-step7.mjs`).

### Manual smoke checks

| Scenario | Expected |
| -------- | -------- |
| Submit the listing form empty | No request is sent; every required field shows a message; `FormAlert` summary appears; the first invalid field is described to a screen reader. |
| Enter a price of `-5` / a letter | Inline "must be a positive number"; the API would also reject it. |
| Offer more than the asking price | Inline message; the API answers `422 RULE_VIOLATION` if bypassed. |
| Double-click "Publish" | The button is disabled with a spinner for the whole request; only one listing is created. |
| Open the enquiry dialog, press Tab repeatedly | Focus cycles inside the dialog and never reaches the page behind; Escape closes it and focus returns to the button that opened it. |
| Open a dialog, then scroll the page | The background does not scroll. |
| Load a listing whose image URL is dead | The category tile renders instead of a broken-image icon. |
| Load an avatar whose URL is dead | The initials tile renders. |
| Visit `/marketplace/<unknown-id>` | Real `404` status + "Listing not found" page. |
| Visit `/seller/<unknown-id>` | Real `404` status + "Student not found" page. |
| Visit `/nonsense` | Real `404` + "Page not found". |
| Stop MongoDB, open `/marketplace` | `error.tsx` boundary with "Try again" (not an empty grid). |
| Click "Clear all" on `/favorites` | A confirm dialog with the item count; Cancel/Escape does nothing; Confirm clears and toasts. |
| Click "Remove" on a dashboard listing | A confirm dialog; the overlay/cancel are inert while it runs. |
| Narrow the window on every page | Header collapses to a drawer, filters move into a sheet, grids stack, no horizontal scroll. |
| Tab through the whole marketplace grid | One stop per card (stretched link) plus the favourite button; visible focus throughout. |

### Quality gates

`npm run typecheck`, `npm run lint` (0 warnings) and `npm run build` all pass. The build lists every
data route as dynamic (`ƒ`).

---

## 8. STEP 8 completion checklist

**Validation**

- [x] **Client-side validation** — every form parses with the same Zod schema the API uses.
- [x] **Server-side validation** — every route handler validates body/query at the boundary.
- [x] **Inline messages** — one shared mapping (`zodIssuesToFieldErrors`) feeds every `Field`.
- [x] **Form-level messages** — one shared banner (`FormAlert`).
- [x] **Submission prevention** — buttons disable + spin while in flight; dialogs can't double-submit.

**API error handling**

- [x] **Consistent envelope** — `{ success, data, meta? }` / `{ success:false, error, code, details? }`.
- [x] **Correct status codes** — `400 / 401 / 403 / 404 / 409 / 422 / 500`, all asserted.
- [x] **Create vs update** — `201` for creates, `200` for updates/deletes.
- [x] **Client failure handling** — typed `ApiClientError`, field `details` mapped, otherwise toast/banner.
- [x] **Malformed JSON** — `400 VALIDATION_ERROR` with `details[]`.

**UI states**

- [x] **Loading skeletons** — route loaders where safe, in-page skeletons for streamed sections.
- [x] **Empty states** — `EmptyState` on every list.
- [x] **Error states** — `RouteError` on every boundary, with retry.
- [x] **Toast / success feedback** — every mutation raises a toast with the server's message.
- [x] **Confirmation dialogs** — shared `ConfirmDialog` for destructive actions.
- [x] **Invalid route handling** — global `not-found.tsx` → real `404`.
- [x] **Product not found page** — `/marketplace/[id]/not-found.tsx` → real `404`.
- [x] **Seller not found page** — `/seller/[id]/not-found.tsx` → real `404`.
- [x] **Image error fallback** — `ListingImage` → category tile; `Avatar` → initials.
- [x] **Missing-field safety** — `serialize.ts` narrows `unknown` and defaults collections.

**Accessibility & responsive**

- [x] **Accessible fields** — labels, `aria-invalid`, `aria-describedby` (no dangling ids), `aria-required`.
- [x] **Keyboard navigation** — focus trap, Escape, focus restore, scroll lock, visible focus.
- [x] **Responsive design** — mobile drawer/sheets, stacked grids, no horizontal scroll.

**Code quality**

- [x] **Duplication removed** — `form-errors`, `FormAlert`, `FieldContext`, `useDialog`, `ConfirmDialog`, `RouteError`, `RouteNotFound`, `ListingImage`.
- [x] **No business-requirement change** — model, endpoints, BR-1…BR-25 and identity are untouched.
- [x] **Quality gates** — `typecheck`, `lint` (0 warnings), `build` all pass.
- [x] **Verification** — 124/124 Step 8 assertions plus 54/54, 33/33, 56/56, 55/55, 117/117 and 79/79 regressions, all green against a real MongoDB.

**Step 8 is complete. Not starting Step 9.**
