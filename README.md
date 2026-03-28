# Style Discovery Hub (STYVIA)

Full-stack fashion e-commerce: **React + Vite + TypeScript** frontend, **Spring Boot 3** API, **MySQL 8**, JWT auth, admin console, donations, fit tooling, and optional ML/Redis.

Clone this repo, run **MySQL**, **backend**, and **frontend** as below to match a working dev machine.

---

## Table of contents

1. [Prerequisites](#prerequisites)  
2. [Clone the repository](#clone-the-repository)  
3. [Database setup (important)](#database-setup-important)  
4. [Run the backend](#run-the-backend)  
5. [Run the frontend](#run-the-frontend)  
6. [URLs and default login](#urls-and-default-login)  
7. [Docker Compose (all-in-one)](#docker-compose-all-in-one)  
8. [Environment variables](#environment-variables)  
9. [Optional services](#optional-services)  
10. [Project layout](#project-layout)  
11. [Troubleshooting](#troubleshooting)  
12. [Security before production](#security-before-production)  
13. [More docs](#more-docs)

---

## Prerequisites

| Tool | Version (tested / expected) |
|------|-----------------------------|
| **Node.js** | 20+ |
| **npm** | 10+ (comes with Node) |
| **Java** | **21** |
| **Maven** | 3.8+ |
| **MySQL** | **8.0+** (server running and reachable) |

Optional: **Docker** + Docker Compose for MySQL or full stack.

---

## Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

Use your real GitHub URL and folder name (for example `style-discovery-hub-main`).

---

## Database setup (important)

The app uses database **`fashion_ecommerce`** (default). Hibernate is set to **`ddl-auto: update`**, so **tables are created/updated automatically** when the backend starts—you do **not** need to run SQL DDL by hand for a normal dev setup.

What you **do** need:

1. **MySQL running** (usually `localhost:3306`).
2. A user that can create the database (or create the DB yourself).

### Default JDBC settings (`backend/src/main/resources/application.yml`)

- **URL:** `jdbc:mysql://localhost:3306/fashion_ecommerce?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`
- **Username / password:** `root` / `root` (override with env vars below).

### Override credentials (recommended)

Set before starting the backend:

```bash
# Windows PowerShell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_password"

# macOS / Linux
export DB_USERNAME=root
export DB_PASSWORD=your_password
```

### Seed data: roles + admin user

Signup and many features expect **`ROLE_CUSTOMER`** and **`ROLE_ADMIN`** to exist. On a **fresh** Hibernate-created database those rows are **not** added automatically.

**Easiest paths:**

1. **Docker MySQL from this repo (recommended for first run)**  
   - `docker compose up -d mysql`  
   - First-time container start runs `backend/src/main/resources/database/schema.sql`, which creates tables **and** seeds roles, **admin user**, and base categories.  
   - Point Spring at that instance (see [Docker Compose](#docker-compose-all-in-one)).

2. **Manual SQL after Hibernate has created tables**  
   - Start the backend once (so tables exist), stop it if you want, then run the small seed file:  
   ```bash
   mysql -u root -p fashion_ecommerce < backend/src/main/resources/database/init-data.sql
   ```  
   - This inserts roles and the default admin (see file for details). If you already have conflicting rows, adjust or run only the `INSERT` statements you need.

**Do not** run the full `schema.sql` against a database that Hibernate already manages with data you care about: the top of `schema.sql` contains **`DROP TABLE`** statements and will wipe data.

### Demo catalog products

With `app.catalog-demo-seed.enabled: true` (default), the backend inserts **~36 demo products** from `backend/src/main/resources/seed/catalog-demo-products.json` when slugs like `seed-*` are missing—similar to what you see in local mocks.

Disable in production if you only want a real catalog:

```bash
export CATALOG_DEMO_SEED_ENABLED=false
```

### SQL utilities (optional)

Under `backend/src/main/resources/database/`:

| File | Purpose |
|------|---------|
| `schema.sql` | Full schema + seed (used by Docker MySQL init; **destructive** `DROP` at top) |
| `init-data.sql` | Minimal roles + admin-style bootstrap |
| `dashboard-demo-seed.sql`, `fix-*.sql` | Optional maintenance / demo |

---

## Run the backend

```bash
cd backend
mvn spring-boot:run
```

- API base: **`http://localhost:8080`**
- REST prefix: **`/api/v1`** (e.g. `http://localhost:8080/api/v1/products`)

Requires MySQL reachable with the configured URL/user/password.

---

## Run the frontend

From the **repository root** (not `backend/`):

```bash
npm install
```

**Environment:** Vite reads `.env.development` (and `.env.development.local` if present).

```bash
# If you do not already have it, copy the example:
cp .env.example .env.development
```

Default in `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Start dev server:

```bash
npm run dev
```

- App: **`http://localhost:5173`** (Vite default; see `vite.config.ts` if changed).

### Other frontend scripts

```bash
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint
npm run test       # Vitest
```

---

## URLs and default login

| Area | URL |
|------|-----|
| Storefront (dev) | http://localhost:5173 |
| Admin (dev) | http://localhost:5173/admin |
| API | http://localhost:8080/api/v1 |

**Default admin (when DB is seeded with `schema.sql` or compatible seed):**

- **Email:** `admin@stylediscovery.com`  
- **Password:** `admin123`  

If login fails, your database may have no admin row yet—see [Seed data](#seed-data-roles--admin-user).

---

## Docker Compose (all-in-one)

From the repo root:

```bash
docker compose up -d
```

This starts **MySQL** (with `schema.sql` on first volume init), **backend**, and **frontend** (nginx on port **80**). Credentials for MySQL in Compose differ from local defaults—see `docker-compose.yml` (`fashionuser` / `fashionpass`).

**Health:** Backend healthcheck expects actuator—if your image does not expose it, adjust `docker-compose.yml`.

---

## Environment variables

### Backend (common)

| Variable | Purpose |
|----------|---------|
| `DB_USERNAME` | MySQL user (default `root`) |
| `DB_PASSWORD` | MySQL password (default `root`) |
| `JWT_SECRET` | JWT signing secret (**change in production**) |
| `FILE_UPLOAD_DIR` | Uploaded files directory |
| `FILE_BASE_URL` | Public base URL for file API |
| `CATALOG_DEMO_SEED_ENABLED` | `true` / `false` — demo product seed |
| `REDIS_HOST`, `REDIS_PORT` | Redis if enabled |
| `APP_REDIS_ENABLED` | `true` / `false` (default false) |
| `ML_SERVICE_ENABLED`, `ML_SERVICE_URL` | Fit / ML integration (default `http://localhost:8090`) |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_GEOCODING_API_KEY` | Maps / places (prefer env over committing keys) |
| `GEMINI_API_KEY`, `OPENAI_API_KEY` | Assistant features |

Spring Boot also accepts `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` (used in Docker Compose).

### Frontend

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | API prefix (must end with `/api/v1` as configured) |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional; maps on storefront |

---

## Optional services

| Service | Port | Notes |
|---------|------|--------|
| **Redis** | 6379 | Off by default (`app.redis.enabled=false`). Enable only if you turn it on in config. |
| **ML service** | 8090 | Fit / ML features; backend degrades if unreachable depending on feature. |
| **Google Maps / Places** | — | Keys in backend `application.yml` or env; frontend may use `VITE_GOOGLE_MAPS_API_KEY`. |

---

## Project layout

```
├── backend/                 # Spring Boot API (Java 21, Maven)
│   └── src/main/resources/
│       ├── application.yml  # Main config (DB, JWT, feature flags)
│       ├── database/        # SQL seeds and utilities
│       └── seed/            # catalog-demo-products.json
├── src/                     # React SPA (Vite)
├── public/images/           # Local listing images (committed)
├── ml-service/              # Optional Python ML (if present in your branch)
├── docker-compose.yml
├── Dockerfile               # Frontend production image
├── .env.example             # Copy → .env.development
├── SETUP.md                 # Teammate notes (images, DB, common issues)
└── README.md                # This file
```

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Frontend cannot reach API | `VITE_API_BASE_URL`, backend running on 8080, browser network tab |
| `Public Key Retrieval` / MySQL auth | JDBC URL already includes `allowPublicKeyRetrieval=true` in `application.yml` |
| Empty product grids | MySQL data: run backend with demo seed enabled; see **SETUP.md** |
| Signup fails “ROLE_CUSTOMER not found” | Seed roles (`init-data.sql` or Docker `schema.sql` path) |
| Admin login fails | Admin row not seeded; run appropriate SQL or Docker MySQL init |
| CORS | Backend CORS must allow your Vite origin (e.g. `http://localhost:5173`) |

More detail: **[SETUP.md](./SETUP.md)**.

---

## Security before production

- Set strong **`JWT_SECRET`** and **never** commit real production secrets.  
- **Rotate** any API keys that appear in `application.yml` in your repo; use environment variables or a secrets manager.  
- Set **`CATALOG_DEMO_SEED_ENABLED=false`** if you do not want demo products.  
- Use **`ddl-auto: validate`** (or migrations) in production instead of `update` when you have a controlled migration process.

---

## More docs

- **[SETUP.md](./SETUP.md)** — clone parity, images, DB, git hygiene.  
- **[backend/README.md](./backend/README.md)** — API-focused backend notes.  

---

## License

Use and modify according to your project’s license (educational / portfolio unless otherwise stated).
