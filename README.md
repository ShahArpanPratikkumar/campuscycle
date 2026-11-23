<div align="center">

# 🎓 CampusCycle

### **A Modern Peer-to-Peer Campus Marketplace for College Students**

Buy, sell, exchange, and donate textbooks, calculators, tech gear, cycles, and hostel essentials within your college campus — **zero middleman, zero shipping fees, instant on-campus handoffs.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-campuscycle--coral.vercel.app-4f46e5?style=for-the-badge&logo=vercel&logoColor=white)](https://campuscycle-coral.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ShahArpanPratikkumar/campuscycle)

<br/>

[![Next.js 16](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Mongoose](https://img.shields.io/badge/Mongoose_ORM-880000?style=flat-square&logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![Zod](https://img.shields.io/badge/Zod_Validation-3E67B1?style=flat-square&logo=zod&logoColor=white)](https://zod.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

<br/>

**[🌐 View Live Deployment](https://campuscycle-coral.vercel.app/)** • **[📖 Documentation](docs/)** • **[🔌 API Reference](docs/API.md)** • **[🏛 Architecture](docs/ARCHITECTURE.md)**

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Live Demo & Quick Tour](#-live-demo--quick-tour)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Models](#-database-models)
- [REST API Endpoints](#-rest-api-endpoints)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started Locally](#-getting-started-locally)
- [Environment Configuration](#-environment-configuration)
- [Database Seeding](#-database-seeding)
- [Production Deployment](#-production-deployment)
- [Business Rules & Validation](#-business-rules--validation)
- [Contributing & License](#-contributing--license)

---

## 💡 Overview

University students constantly buy expensive textbooks, scientific calculators, lab gear, and hostel necessities only to store them or discard them at graduation. Simultaneously, incoming juniors struggle to afford brand-new academic materials.

**CampusCycle** solves this with an authentic campus-first marketplace:
- ⚡ **Zero Transaction Fees:** Direct student-to-student transactions with zero cuts taken.
- 🚴 **On-Campus Pickup:** Meet at campus landmarks (library, hostel gate, student canteen) without waiting for parcel deliveries.
- 🤝 **Bargain & Negotiation Engine:** Built-in price offer and counter-offer negotiation cycle.
- 🔐 **Verified Campus Authentication:** Student profiles with campus identification, contact preferences, and secure JWT-based sessions.
- 📦 **Rich Category Coverage:** Textbooks, Cycles, Electronics, Hostel Essentials, Lab Gear, Calculators, Sports, Clothing, and Stationery.

---

## ✨ Key Features

### 🛒 1. Dynamic Marketplace Discovery
- **Full-Text & Regex Search:** Instant search by keywords across listing titles, descriptions, and tag attributes.
- **Multi-Facet Filtering:** Filter concurrently across 10 categories, 4 conditions (`New`, `Like New`, `Good`, `Fair`), 3 listing types (`Sale`, `Free / Giveaway`, `Exchange`), and custom minimum/maximum price bounds.
- **Dynamic Sorting & Paging:** Sort by newest, lowest price, highest price, or popularity with stable cursor pagination.
- **Deep-Linked URL State:** Filter state persists in the query string (`?q=&category=&minPrice=&sort=`) for bookmarking and shareable URLs.

### 💼 2. Buyer & Seller Interaction Engine
- **In-App Enquiries:** Prospective buyers can send structured queries with questions and custom handoff locations.
- **Price Offers & Counter-Offers:** Built-in negotiation pipeline where sellers can **Accept**, **Reject**, or submit an intermediate **Counter-Offer**.
- **Auto-Reservation:** Accepting an offer automatically marks the listing as `Reserved` and auto-rejects competing pending bids.

### 👤 3. Student Profile & Dashboard
- **Comprehensive Dashboard:** 6 real-time metrics tracking active listings, reserved products, sold inventory, pending enquiries, active offers, and saved favorites.
- **Inventory Management:** Update listing prices, edit descriptions, toggle availability (`available`, `reserved`, `sold`), or soft-delete products.
- **Seller Reputation:** Public seller profile displaying campus name, department, academic year, total listings sold, and preferred contact mode.

### 💖 4. Optimistic Saved Favorites
- Real-time save / bookmark feature backed by MongoDB and optimistic UI updates (with instant toast feedback and automatic rollback upon network failure).
- Dedicated `/favorites` page tracking item status dynamically (`Available`, `Reserved`, `Sold`).

### 🔒 5. Secure Authentication & Route Protection
- Bcrypt-hashed password storage (12 salt rounds) with zero password leakage in JSON serialization.
- Server-side HTTP-only session cookies with HS256 JWT tokens.
- Next.js 16 route protection proxy guarding private student portals (`/dashboard`, `/sell`, `/favorites`).

---

## 🚀 Live Demo & Quick Tour

| Home Landing Page | Marketplace Discovery |
| :---: | :---: |
| Hero banner with category shortcuts, recent arrivals, and free campus giveaways. | Multi-facet sidebar filters, responsive grid cards, and live sort select. |
| **Product Detail & Gallery** | **Student Dashboard** |
| High-res image gallery, seller badge, condition info, and enquiry modal. | Real-time counters, incoming negotiation offers, and listings manager. |

**Live Production URL:** [https://campuscycle-coral.vercel.app/](https://campuscycle-coral.vercel.app/)

---

## 🛠 Tech Stack

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16** (App Router) | Server Components, Streaming SSR, Route Handlers |
| **Core Library** | **React 19** | Modern hooks, `useSyncExternalStore`, transitions |
| **Language** | **TypeScript 5 (Strict)** | End-to-end type safety across DTOs, API & client components |
| **Styling** | **Tailwind CSS v4 + PostCSS** | Design tokens, custom `@theme`, responsive layout, dark/light tones |
| **Icons** | **Lucide React** | Lightweight, clean icon set |
| **Database** | **MongoDB Atlas** | Cloud database with connection pooling and high availability |
| **ORM / ODM** | **Mongoose 9** | Schema modeling, lifecycle pre-hooks, partial indexes |
| **Validation** | **Zod 4** | Universal validation across client forms and API endpoints |
| **Authentication** | **JWT (jsonwebtoken) + Bcrypt** | HTTP-only session cookies with password hashing |
| **Hosting & CI/CD** | **Vercel** | Serverless edge deployment with automatic GitHub deployments |

---

## 🏛 System Architecture

```
                          ┌────────────────────────┐
                          │   Client / Browser     │
                          └───────────┬────────────┘
                                      │
                         HTTP / JSON  │  (Session Cookie)
                                      ▼
                          ┌────────────────────────┐
                          │ Next.js 16 Proxy Layer │
                          │   (proxy.ts / JWT)     │
                          └───────────┬────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
┌───────────────────────┐                           ┌───────────────────────┐
│ Server Components     │                           │ REST API Handlers     │
│ (app/marketplace,     │                           │ (app/api/*)           │
│  app/dashboard, etc.) │                           └───────────┬───────────┘
└───────────┬───────────┘                                       │
            │                                     Zod Validation│
            │ (Internal Service Calls)                          ▼
            └─────────────────────────┬─────────────▶ ┌─────────────────────┐
                                      │               │ Services Layer      │
                                      │               │ (lib/services/*)    │
                                      │               └─────────┬───────────┘
                                      │                         │
                                      ▼                         ▼
                          ┌─────────────────────────────────────────────────┐
                          │         Mongoose ORM Models & Schemas           │
                          │   (User, Product, Enquiry, Offer, Favorite)     │
                          └────────────────────────┬────────────────────────┘
                                                   │
                                                   ▼
                          ┌─────────────────────────────────────────────────┐
                          │               MongoDB Atlas Cloud               │
                          └─────────────────────────────────────────────────┘
```

---

## 🗄 Database Models

The database schema is organized into five normalized collections:

1. **`users`**: Student profiles (Name, Handle, Email, Password Hash, Campus, Department, Year, Bio, Contact Preference, Denormalized stats).
2. **`products`**: Product listings (Title, Description, Category, Price, Condition, Type, Photos array, Location, Seller reference, Status: `available` | `reserved` | `sold` | `deleted`).
3. **`enquiries`**: Buyer-to-seller enquiries (Product ID, Buyer ID, Seller ID, Message, Status: `pending` | `accepted` | `rejected` | `cancelled`).
4. **`offers`**: Price bids & counter-negotiations (Product ID, Buyer ID, Seller ID, Offer Price, Original Price, Counter Price, Status: `pending` | `countered` | `accepted` | `rejected` | `withdrawn`).
5. **`favorites`**: Saved listings cross-reference table with compound unique index `(userId, productId)`.

---

## 🔌 REST API Endpoints

All responses follow a predictable JSON response envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Core API Matrix

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Service health & database connectivity check | ❌ |
| `POST` | `/api/auth/register` | Register a new student account | ❌ |
| `POST` | `/api/auth/login` | Authenticate and issue session cookie | ❌ |
| `POST` | `/api/auth/logout` | Revoke session and clear auth cookie | ❌ |
| `GET` | `/api/auth/me` | Fetch active user credentials | 🔒 |
| `GET` | `/api/products` | Browse catalog with query search & filters | ❌ |
| `POST` | `/api/products` | Publish a new product listing | 🔒 |
| `GET` | `/api/products/:id` | Retrieve detailed product record | ❌ |
| `PUT` | `/api/products/:id` | Update product attributes (Owner only) | 🔒 |
| `PATCH` | `/api/products/:id` | Change product status (`available`, `reserved`, `sold`) | 🔒 |
| `DELETE` | `/api/products/:id` | Soft-delete a product listing | 🔒 |
| `GET` | `/api/enquiries` | List inbound/outbound enquiries | 🔒 |
| `POST` | `/api/enquiries` | Submit an enquiry on a product | 🔒 |
| `PATCH` | `/api/enquiries/:id` | Accept, reject, or cancel an enquiry | 🔒 |
| `GET` | `/api/offers` | List incoming and submitted price offers | 🔒 |
| `POST` | `/api/offers` | Make a price offer on a product | 🔒 |
| `PATCH` | `/api/offers/:id` | Accept, reject, or counter-negotiate offer | 🔒 |
| `GET` | `/api/favorites` | Retrieve user's saved listings | 🔒 |
| `POST` | `/api/favorites` | Bookmark / save a product | 🔒 |
| `DELETE` | `/api/favorites` | Remove a product from bookmarks | 🔒 |
| `GET` | `/api/users/:id` | Fetch public seller profile | ❌ |

---

## 📁 Project Directory Structure

```text
├── app/                           # Next.js 16 App Router
│   ├── (auth)/
│   │   ├── login/                 # Login screen & validation
│   │   └── register/              # New account registration
│   ├── api/                       # REST API route handlers
│   │   ├── auth/                  # login, logout, me, register
│   │   ├── enquiries/             # Enquiry submission & actions
│   │   ├── favorites/             # Bookmarks API
│   │   ├── health/                # DB connectivity check
│   │   ├── offers/                # Offers & counter-offers
│   │   ├── products/              # Marketplace catalog CRUD
│   │   └── users/                 # Public student profiles
│   ├── dashboard/                 # Student management console
│   │   ├── enquiries/             # Inbound & outbound messages
│   │   ├── listings/              # Inventory & status management
│   │   └── offers/                # Price negotiations
│   ├── favorites/                 # Saved listings view
│   ├── marketplace/               # Browse catalog & filters
│   │   ├── [id]/                  # Product detail page & gallery
│   │   │   └── edit/              # Edit listing screen
│   ├── sell/                      # Publish listing form
│   ├── seller/[id]/               # Public seller profile
│   ├── globals.css                # Tailwind CSS v4 styling & design tokens
│   ├── layout.tsx                 # Root layout & providers
│   └── page.tsx                   # Landing homepage
├── components/
│   ├── auth/                      # Auth provider, login & register forms
│   ├── common/                    # Banners, RouteError, NotFound
│   ├── dashboard/                 # Stats cards, tab controls, request rows
│   ├── favorites/                 # Favorite item cards & actions
│   ├── layout/                    # SiteHeader, SiteFooter, NavLinks, Logo
│   ├── listings/                  # ListingCard, Gallery, Badges, SellForm
│   ├── marketplace/               # FilterPanel, SearchInput, SortSelect
│   ├── providers/                 # ToastProvider, FavoritesProvider
│   └── ui/                        # Button, Input, Modal, Sheet, Badge, Card
├── lib/
│   ├── api/                       # API error wrapper, response envelope
│   ├── auth/                      # JWT sign/verify, password hashing
│   ├── db/                        # MongoDB cached client & connection
│   │   └── models/                # User, Product, Enquiry, Offer, Favorite
│   ├── services/                  # Business logic & database operations
│   ├── validators/                # Zod schemas for all models & queries
│   └── constants.ts               # Categories, conditions, labels
├── docs/                          # Comprehensive architectural specifications
├── scripts/
│   └── seed-marketplace.mjs       # Seed script (31 realistic college items)
├── postcss.config.mjs             # PostCSS Tailwind plugin configuration
├── next.config.ts                 # Next.js configuration & image domains
└── package.json                   # Dependencies and scripts
```

---

## 💻 Getting Started Locally

### Prerequisites
- **Node.js**: v20.9.0 or higher
- **MongoDB**: Local MongoDB server or free [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI
- **npm** or **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ShahArpanPratikkumar/campuscycle.git
   cd campuscycle
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the project root:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your MongoDB URI and a random secret key:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/campuscycle
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_MAX_IMAGES=5
   JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
   ```

4. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

## ⚙️ Environment Configuration

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `MONGODB_URI` | **Yes** | MongoDB connection string (Atlas or Local) | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | **Yes** | Signing secret for authentication tokens | `h4Tg1sWuNJVkQV4QUZDiO4QPWMaMVhefhSmBYvlZCFFg3AS1` |
| `NEXT_PUBLIC_APP_URL` | No | Base application URL | `https://campuscycle-coral.vercel.app` |
| `NEXT_PUBLIC_MAX_IMAGES`| No | Maximum allowable images per listing | `5` |

---

## 🌱 Database Seeding

The project comes with a comprehensive seed script that populates:
- **6 Student Profiles**: Complete with campus names, engineering/architecture departments, year of study, bios, and Unsplash avatars.
- **31 Detailed Listings**: Spanning all 10 categories (Engineering Mathematics textbooks, TI-84 calculators, Hercules gear cycles, study lamps, drawing boards, lab coats, and hostel kettles) with authentic descriptions and Unsplash HD photography.

To execute the seed script:
```bash
npm run seed
```

---

## 🚢 Production Deployment

This project is optimized for deployment on [Vercel](https://vercel.com):

1. Push your code to your GitHub repository.
2. Sign in to **Vercel** and select **Add New Project**.
3. Import your `campuscycle` repository.
4. Add the required **Environment Variables** (`MONGODB_URI`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MAX_IMAGES`).
5. Click **Deploy**. Vercel will build the project and provide an SSL-secured production domain.

---

## 🛡 Business Rules & Validation

CampusCycle enforces strict domain invariants:
- **BR-1**: Prices must be non-negative. Free listings must have price = `0`.
- **BR-5**: Sellers cannot buy, offer, or save their own listings.
- **BR-6**: Inactive or sold listings cannot receive enquiries or offers.
- **BR-10**: A student can have only one pending enquiry per product.
- **BR-14**: Accepting an offer automatically reserves the item and auto-rejects competing bids.
- **BR-17**: Favorited listings stay saved even when sold/reserved, clearly tagged with availability status.
- **BR-25**: Counter-offers must be strictly between the buyer's offer price and the original asking price.

---

## 📄 Contributing & License

Contributions, bug reports, and feature suggestions are welcome! Feel free to open an issue or submit a pull request.

This project is licensed under the **MIT License** — feel free to use and modify it for your university or community.

<br/>

<div align="center">

**Built with ❤️ for college students everywhere.**

[![Live Demo](https://img.shields.io/badge/Open_CampusCycle-4f46e5?style=for-the-badge&logo=vercel&logoColor=white)](https://campuscycle-coral.vercel.app/)

</div>
