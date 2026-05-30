# Multi-Courier Integration Platform

Unified logistics backend — one REST API for multiple courier partners (UrbaneBolt, Mock). Shipment APIs are public; admin user management uses JWT auth.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 9+ |
| MySQL | 8+ |

---

## Quick Start (copy & run)

### Step 1 — Clone and install

```bash
git clone <repo-url>
cd Multi-Courier-Integration-Platform
npm install
```

### Step 2 — Create MySQL database

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS multi_courier;"
```

### Step 3 — Environment file

```bash
cp .env.example .env
```

Edit `.env` if your MySQL user/password differs:

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/multi_courier"
```

### Step 4 — App config

Edit `config/config.yaml` if needed:

- `mysql.primary` — host, username, password, `db_name`
- `cache.enabled: false` — no Redis required (default)
- `couriers.urbanebolt` — UAT credentials for live courier calls

### Step 5 — Run database migration (one migration: all tables + admin user)

```bash
npm run db:migrate
```

This applies `prisma/migrations/20260601000000_init/` which creates:

- All shipment tables (`shipment_orders`, `bulk_batches`, etc.)
- `users` table
- Default admin user
- Courier partner seeds (`mock`, `urbanebolt`)

**Fresh database reset (dev only):**

```bash
npm run db:reset
```

### Step 6 — Start the server

```bash
npm run dev
```

Server: **http://localhost:3000**

### Step 7 — Verify

```bash
# Health
curl http://localhost:3000/api/v1/health

# Admin login
curl -X POST http://localhost:3000/api/admin/v1/users/login \
  -H "Content-Type: application/json" \
  -H "x-request-id: $(uuidgen)" \
  -d '{"email":"admin@example.com","password":"Admin@12345"}'

# Create mock shipment (no external API)
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "x-request-id: $(uuidgen)" \
  -d '{"order_id":"ORD-001","courier_partner":"mock","shipper":{"name":"WH","mobile":"9876543210","address":"Addr","city":"Gurgaon","state":"HR","country":"INDIA","pincode":"122001"},"consignee":{"name":"C1","mobile":"9123456780","address":"Addr","city":"Mumbai","state":"MH","country":"INDIA","pincode":"400001"},"return_address":{"name":"WH","mobile":"9876543210","address":"Addr","city":"Gurgaon","state":"HR","country":"INDIA","pincode":"122001"},"package":{"weight":1,"length":10,"breadth":10,"height":10,"pieces":1,"description":"Item"},"payment":{"mode":"COD","collectable_value":100,"declared_value":100}}'
```

---

## Default Admin Credentials

Seeded by migration:

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `Admin@12345` |

Use login to get a JWT for admin user APIs.

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install + migrate + build (first-time setup) |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Compile TypeScript + generate Prisma client |
| `npm start` | Run production build |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:reset` | Drop DB, re-run migration, re-seed admin |
| `npm run lint:check` | ESLint |
| `npm run format` | Prettier format |
| `npm run prisma:studio` | Open Prisma Studio |

---

## API Reference

### Headers

| Header | Required | Used on |
|--------|----------|---------|
| `x-request-id` | Yes | All APIs except health |
| `Authorization: Bearer <token>` | Yes | Admin user APIs (except login) |
| `Content-Type: application/json` | Yes | POST/PUT with body |

### Response envelope

```json
{
  "status": 1,
  "message": "Success message",
  "result": { },
  "time_stamp": "2026-05-29T12:00:00.000Z"
}
```

Errors use `"status": 0` with `error` and `error_detail.code`.

---

### Health

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/health` | No |

---

### Shipment / Logistics (`/api/v1`)

Public APIs — no admin token required.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/couriers` | List supported courier partners |
| POST | `/api/v1/orders` | Create shipment |
| GET | `/api/v1/orders/:order_id/track` | Track shipment |
| POST | `/api/v1/orders/:order_id/cancel` | Cancel shipment |
| POST | `/api/v1/orders/bulk` | Bulk create (returns `202` + `batch_id`) |
| GET | `/api/v1/orders/bulk/:batch_id` | Poll bulk batch status |
| POST | `/api/v1/webhooks/:courier_partner` | Receive courier webhooks |

**Testing tip:** use `"courier_partner": "mock"` for offline testing without UrbaneBolt.

**UrbaneBolt:** use `"courier_partner": "urbanebolt"` — requires valid UAT credentials in `config/config.yaml`.

---

### Admin Users (`/api/admin/v1/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/v1/users/login` | No | Login → returns JWT |
| POST | `/api/admin/v1/users/` | JWT | Create user |
| GET | `/api/admin/v1/users/` | JWT | List users (paginated) |
| GET | `/api/admin/v1/users/:id` | JWT | Get user by ID |
| PUT | `/api/admin/v1/users/:id` | JWT | Update user |
| DELETE | `/api/admin/v1/users/:id` | JWT | Soft delete user |

---

## Postman

Import **`docs/postman-collection.json`**

Folders:

- **Health**
- **Shipment** — mock + UrbaneBolt examples
- **Admin** — login, create/list users

Set collection variable `adminToken` after login.

---

## Configuration (`config/config.yaml`)

| Section | Purpose |
|---------|---------|
| `mysql.primary` / `replica` | Database (replica falls back to primary locally) |
| `redis` | Only when `cache.enabled: true` |
| `cache.enabled` | `false` = run without Redis |
| `auth.jwtSecret` | Admin JWT signing secret |
| `auth.jwtExpiresInHours` | Token TTL |
| `couriers.urbanebolt` | Base URL, credentials, customerCode, optional cookies |
| `couriers.mock` | Offline mock adapter |
| `bulk.maxOrders` | Max 100 per bulk request |
| `bulk.concurrency` | Parallel courier calls per batch |

---

## Project Structure

```
src/
├── bootstrap/              # App startup + DI (AppContext)
├── internal/
│   ├── shipment/           # Unified shipment API
│   ├── user/               # Admin users + JWT login
│   └── shared/             # Validators, adminAuth interceptor
├── external/
│   ├── courier/            # CourierAdapter interface + factory
│   ├── urbanebolt/         # UrbaneBolt UAT integration
│   └── mock-courier/       # Mock adapter for local testing
├── pkg/                    # mysql, redis, cache, http-client, jwt
├── router/
└── server/
prisma/
├── schema.prisma
└── migrations/
    └── 20260601000000_init/   # Single init migration
config/config.yaml
docs/postman-collection.json
```

---

## Adding a New Courier

No changes to shipment routes, controllers, or unified DTOs.

1. Implement `CourierAdapter` under `src/external/<name>/`
2. Add transformers (normalized ↔ partner API)
3. Add config block in `config/config.yaml` + Zod schema
4. Register in `AppContext.buildCourierAdapters()`
5. Seed partner in `App.seedCourierPartners()`

See **DESIGN.md** for architecture details.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `P1000` / DB connection failed | Check MySQL is running and `DATABASE_URL` in `.env` |
| Migration failed | Ensure database exists; try `npm run db:reset` on dev |
| UrbaneBolt 405 | Manifest URL must end with `/` (already fixed in adapter) |
| Admin 401 | Login first; pass `Authorization: Bearer <token>` |
| Port 3000 in use | Change `http.port` in `config/config.yaml` |

---

## Architecture

See **[DESIGN.md](./DESIGN.md)** for system design, patterns, database schema, and trade-offs.
