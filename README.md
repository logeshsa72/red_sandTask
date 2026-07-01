# 🏠 NestFind — Real Estate Listing Platform

Full-stack real-estate platform (99acres / NoBroker style) built with Next.js, Express, PostgreSQL and Prisma.

## Project Structure
```
realestate/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── password.controller.js      # forgot/reset password
│   │   │   ├── property.controller.js      # CRUD + search/filter + similar
│   │   │   └── inquiry.controller.js       # lead/inquiry module
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js          # JWT protect + role guard
│   │   │   ├── validate.middleware.js      # auth validation rules
│   │   │   ├── property.validate.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── property.routes.js
│   │   │   └── inquiry.routes.js
│   │   ├── lib/prisma.js
│   │   ├── utils/AppError.js
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.jsx
│   │   │   │   ├── register/page.jsx
│   │   │   │   ├── forgot-password/page.jsx
│   │   │   │   ├── reset-password/page.jsx
│   │   │   │   └── layout.jsx
│   │   │   ├── dashboard/page.jsx          # Buy / Sell choice cards
│   │   │   ├── properties/
│   │   │   │   ├── page.jsx                # Buy → all listings, search/filter
│   │   │   │   ├── create/page.jsx         # Sell → add listing wizard
│   │   │   │   └── [id]/
│   │   │   │       ├── page.jsx            # detail + similar + inquiry
│   │   │   │       └── edit/page.jsx       # owner-only edit
│   │   │   ├── page.jsx                    # root → redirects by auth state
│   │   │   ├── layout.jsx
│   │   │   └── globals.css
│   │   ├── context/AuthContext.jsx
│   │   ├── lib/api/{auth,properties,inquiries}.js
│   │   └── middleware.js                   # route protection
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── next.config.js
│   └── package.json
└── prisma/
    ├── schema.prisma
    └── seed.js                             # generates 50,000+ test properties
```

## Setup Instructions

### 1. Database
```bash
createdb realestate_db
cp backend/.env.example backend/.env   # fill in DATABASE_URL, JWT secrets
```

### 2. Backend
```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed     # optional: loads 50,000+ test properties + demo user
npm run dev          # http://localhost:5000
```
Swagger docs: **http://localhost:5000/api-docs**

Demo login after seeding: `demo@nestfind.com` / `Demo@1234`

### 3. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev          # http://localhost:3000
```

## User Flow
1. Register / Login → JWT access token (in memory) + httpOnly refresh cookie
2. Land on **Dashboard** → two cards: **Buy/Rent** and **Sell/Rent Out**
3. **Buy** card → `/properties` → search, filter (city, budget, type, bedrooms), sort, paginate → click a card for full detail + similar properties + "Contact Owner" inquiry form
4. **Sell** card → `/properties/create` → 4-step guided form → publishes listing immediately
5. Owners can **edit** / **delete** only their own listings (ownership enforced server-side, not just hidden in UI)

## Auth Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get tokens |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Yes | Logout and clear session |
| GET | `/api/auth/me` | Yes | Get current user profile |
| POST | `/api/auth/forgot-password` | No | Request reset link (generic response, no enumeration) |
| POST | `/api/auth/reset-password` | No | Reset password with emailed token |

**Token strategy**: 15-min access JWT (memory/localStorage) + 7-day refresh JWT (httpOnly, Secure, SameSite cookie, bcrypt-hashed in DB). Silent refresh on app mount. Password reset tokens are random 32-byte values, SHA-256 hashed at rest, 15-minute expiry, single-use.

## Property Listing Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/properties` | No | List + search + filter + sort + paginate |
| GET | `/api/properties/:id` | No | Property detail (increments views) |
| GET | `/api/properties/:id/similar` | No | Similar properties |
| GET | `/api/properties/my-listings` | Yes | Current user's own listings |
| POST | `/api/properties` | Yes | Create listing |
| PUT | `/api/properties/:id` | Yes, owner | Update listing |
| DELETE | `/api/properties/:id` | Yes, owner | Delete listing |

**Ownership handling**: every mutating route loads the record, compares `ownerId` against `req.user.id` (from the verified JWT) server-side, and throws 403 if mismatched — never trusts the client. Admin role bypasses this check.

**Image handling**: schema stores an array of image URLs (`images: String[]`). Upload to any object store (S3/Cloudinary) externally and pass the resulting URLs — keeps the API stateless and avoids storing binaries in Postgres.

## Search, Filtering & Scalability (50,000+ records)

- Composite index `@@index([city, propertyType, bedrooms])` plus single-column indexes on `city`, `price`, `propertyType`, `bedrooms`, `ownerId`, `isActive` — covers the most common filter combinations without full scans.
- Pagination via `skip`/`take` with a server-enforced `limit` ceiling of 50, and `count()` + `findMany()` run in parallel via `Promise.all`.
- List endpoint uses a `select` that excludes heavy fields (description, address, amenities) to keep payloads small.
- Sort field is whitelisted (`createdAt`, `price`, `views`, `area`) to prevent arbitrary-column sort abuse.
- `prisma/seed.js` bulk-inserts 50,000 properties via `createMany` in 1,000-row batches to validate this at scale.

## Similar Properties

Strategy: same `city` + `propertyType` (hits the composite index), ordered by `views` desc, capped at 4. If fewer than 4 matches, falls back to a +/-20% price-range query excluding already-selected IDs. Both branches stay index-backed instead of scanning the full table.

## Lead / Inquiry Module

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/inquiries` | Yes | Contact a property owner |
| GET | `/api/inquiries/sent` | Yes | Inquiries I've sent |
| GET | `/api/inquiries/received` | Yes | Inquiries on my listings |
| PATCH | `/api/inquiries/:id/status` | Yes, owner | Update inquiry status |

**Duplicate prevention**: DB-level `@@unique([buyerId, propertyId])` constraint — guaranteed by Postgres even under concurrent requests, not just app-level checks. Race conditions are caught via the Prisma `P2002` error code and translated to a 409.

**Spam protection**: `express-rate-limit` caps inquiry creation to 5 per 10 minutes per authenticated user (keyed by `req.user.id`, falling back to IP). Self-inquiry on one's own listing is blocked. Message length is validated (10-500 chars).

## SEO

Property detail pages should be rendered with Next.js Server Components / `generateMetadata` (App Router) for SSR so crawlers see full content; current build uses client components for interactivity — wrap with a server component shell + `generateMetadata` pulling title/description/og:image from the property record for production SEO. ISR (`revalidate`) is recommended for the listing index given the dataset changes frequently.

## Security Features
- Rate limiting on auth (10/15min) and inquiries (5/10min)
- Helmet HTTP headers, CORS locked to frontend origin
- express-validator on every mutating route (auth + property + inquiry)
- bcrypt password hashing (12 rounds) and hashed refresh/reset tokens
- httpOnly + Secure + SameSite cookies for refresh tokens
- Next.js middleware protects `/dashboard`, `/properties/create`, `/properties/*/edit`
- Server-side ownership checks on every property/inquiry mutation
- Swagger/OpenAPI docs at `/api-docs`

## API Documentation
Full interactive Swagger UI: **`/api-docs`** — covers Auth, Properties, and Inquiries tags.
