# Clone & local setup (same state on every machine)

**Start here for the full checklist:** [README.md](./README.md) (prerequisites, DB, run commands, Docker, env vars).

This file adds **product images**, **teammate parity**, and **common pitfalls** after `git clone`: **backend + MySQL + frontend** must all run, and the database needs product rows.

## Product images (why grids look empty or broken)

1. **Static files** live in **`public/images/`** and are **committed to Git**. Vite serves them at **`/images/<filename>`** (root-relative URLs, not filesystem paths).

2. **Listing pages** often call **`withLocalListingImages()`** (`src/lib/localListingImages.ts`), which replaces the API’s `images[]` **only when the product `name` matches** a key in that file (e.g. `"Girls Party Dress"` → `Girls Party Dress.jpg`). Names that differ from the map keep the API URLs; if those URLs are bad, you get broken thumbnails.

3. **Empty Kids / Accessories** on the shop page almost always means the **database has no (or no in-stock) products** for that category—not missing image files. Fix: add/seed products (admin or SQL), or use the same MySQL data as the author.

## Minimal runbook

| Step | Command / action |
|------|------------------|
| 1. MySQL running | Server on `localhost:3306` |
| 2. DB credentials | Default in `backend/.../application.yml`: DB `fashion_ecommerce`, user `root` / `root`. Override with env: `DB_USERNAME`, `DB_PASSWORD` |
| 3. Backend | `cd backend` → `mvn spring-boot:run` → API on **http://localhost:8080** |
| 4. Frontend env | Copy **`.env.example`** to **`.env.development`** if needed (`VITE_API_BASE_URL=http://localhost:8080/api/v1`) |
| 5. Frontend | `npm install` → `npm run dev` → **http://localhost:5173** |

## What breaks sign-up, cart, checkout, assistant, fit

- **Sign-up / login / cart / orders**: Backend must be up and the browser must call the same origin as `VITE_API_BASE_URL` (default `localhost:8080`).
- **Fit Studio / confidence**: Optional ML service on **8090** (`ML_SERVICE_URL`). If it is down, the app logs connection errors but can still show rule-based confidence—ensure **backend** is running.
- **Style assistant**: Uses `POST /api/v1/assistant/chat` while **signed in**; failures are usually backend down or Java errors (check terminal).

## Redis

Redis is **off by default** (`app.redis.enabled=false`). No Redis install is required unless you enable it.

## Git: what should *not* be pushed

`.gitignore` already excludes `node_modules/`, `dist/`, `backend/target/`, logs, `.env*`. Before you push:

```bash
git status
```

You should **not** see `backend/target`, `dist`, or `node_modules` as tracked files. If someone accidentally committed them, remove from the index (keep local files):

```bash
git rm -r --cached backend/target dist 2>nul
```

Then commit. **Do not** commit API keys for production; rotate any keys that were shared in-repo.

## “Fresh” push for teammates

1. Commit all intended source + `public/images` + config examples.  
2. `git push` — teammates `git pull` or re-clone.  
3. They follow this file: **same code does not imply same database**; they must run MySQL and let Hibernate create/update schema, then load data as you do (admin or seed SQL under `backend/src/main/resources/database/`).
