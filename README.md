# Qnyne Course Platform

Multi-tenant-ready course selling platform scaffolded from `course-platform-master-prompt.md`.

## What Is Included

- `apps/api`: NestJS API with Prisma, JWT auth, role guards, course catalog/admin metadata, private upload URLs, signed playback URLs, Razorpay orders/webhooks, coupons, reviews, student courses, and admin dashboards.
- `apps/web`: Next.js 15 App Router frontend with catalog, auth pages, protected student routes, admin dashboards, Razorpay checkout trigger, and HLS player watermark overlay.
- `apps/video-worker`: BullMQ worker that downloads private source MP4 files from R2, transcodes with FFmpeg, uploads HLS outputs, and updates processing status.
- `apps/cf-worker`: Cloudflare Worker that validates short-lived video JWTs on every HLS manifest and segment request before reading from private R2.
- `packages/database`: Prisma schema.
- `packages/shared`: shared constants and types.

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
4. Video: private R2 upload URLs, BullMQ FFmpeg worker, signed playback, HLS player watermark, Cloudflare Worker validation.
5. Payments: Razorpay order creation, callback verification, webhook access grants, refunds.
6. Student: dashboard, my courses, progress, certificates endpoint.
7. Admin: dashboard stats, orders, users, coupons, course management routes.
8. Hardening: Swagger, throttling, helmet, structured request logging, private video architecture, webhook idempotency.
