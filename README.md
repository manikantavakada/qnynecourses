# Qnyne Course Platform

Multi-tenant-ready course selling platform scaffolded from `course-platform-master-prompt.md`.

## What Is Included

- `apps/api`: NestJS API with Prisma, JWT auth, role guards, course catalog/admin metadata, private upload URLs, signed playback URLs, Razorpay orders/webhooks, coupons, reviews, student courses, and admin dashboards. Also serves gated HLS video (`/stream/courses/...`) directly when no Cloudflare Worker is configured.
- `apps/web`: Next.js 15 App Router frontend with catalog, auth pages, protected student routes, admin dashboards, Razorpay checkout trigger, and HLS player watermark overlay.
- `apps/video-worker`: BullMQ worker that downloads private source MP4 files from object storage, transcodes with FFmpeg, uploads HLS outputs, and updates processing status. Also generates purchase invoices.
- `apps/cf-worker`: Optional Cloudflare Worker that validates short-lived video JWTs on every HLS manifest/segment request before reading from R2. Not required to run the app — see "Video storage" below.
- `packages/database`: Prisma schema.
- `packages/shared`: shared constants and types.

## Hosting

This app is deployed across a few free/low-cost managed services rather than one host, since it has multiple long-running pieces (web, API, background worker, Postgres, Redis):

| Piece | Host | Notes |
|---|---|---|
| `apps/web` | **Netlify** | `netlify.toml` at repo root builds `apps/web` with `@netlify/plugin-nextjs`. Connect the git repo and deploy — no extra config needed. |
| `apps/api` | **Render** (Web Service) | `render.yaml` blueprint + `apps/api/Dockerfile`. Needs an always-on plan (not the free tier) so checkout/login don't hit cold-start delays. |
| `apps/video-worker` | **Render** (Background Worker) | Same blueprint, `apps/video-worker/Dockerfile` (includes ffmpeg). Must stay running to process uploaded videos. |
| Postgres | **Neon** | Set `DATABASE_URL` to the Neon connection string on the Render services. |
| Redis (BullMQ) | **Upstash** | Set `REDIS_URL` to the Upstash Redis URL on the Render services. |
| Video storage | **Any free S3-compatible bucket** (e.g. Backblaze B2) until you're ready to buy into Cloudflare | See below. |

### Video storage

Video upload/transcode/serving talks to storage purely through the S3 API (`STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_BUCKET_NAME`), so any S3-compatible provider works — Backblaze B2's free tier is a good default until you're ready to move to Cloudflare R2.

Private, signed-token video serving works two ways:
- **Default (no Cloudflare needed):** `apps/api`'s `/stream/courses/:courseId/:videoId/*` route validates the same short-lived JWT the player was issued and streams the object straight from your S3-compatible bucket. This is what runs today.
- **Later, once you're on Cloudflare:** set `CF_WORKER_STREAM_URL` and deploy `apps/cf-worker` in front of Cloudflare R2. `playback.service.ts` automatically prefers this over the built-in stream route when it's set — no other code changes required.

## Local Setup

1. Copy `.env.example` to `.env` and fill secrets.
2. Start Postgres and Redis:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the apps:

```bash
npm run dev
```

The API runs on `http://localhost:4000`, Swagger on `http://localhost:4000/docs`, and the web app on `http://localhost:3000`.

## Build Phases Covered

1. Foundation: monorepo, Prisma schema, Docker Compose, API/web/worker shells.
2. Auth: registration, login, refresh rotation, logout, verification/reset tokens, guards, middleware.
3. Catalog: public browse/detail, admin course/module/video metadata CRUD.
4. Video: private S3-compatible upload URLs, BullMQ FFmpeg worker, signed playback, HLS player watermark, in-API stream gating (Cloudflare Worker optional).
5. Payments: Razorpay order creation, callback verification, webhook access grants, refunds.
6. Student: dashboard, my courses, progress, certificates endpoint.
7. Admin: dashboard stats, orders, users, coupons, course management routes.
8. Hardening: Swagger, throttling, helmet, structured request logging, private video architecture, webhook idempotency.
