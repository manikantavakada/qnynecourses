# Build context is the repo root (npm workspaces monorepo)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/video-worker/package.json apps/video-worker/package.json
COPY apps/cf-worker/package.json apps/cf-worker/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY . .
RUN npx prisma generate --schema packages/database/prisma/schema.prisma
RUN npm run build -w apps/video-worker

FROM node:20-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
CMD ["node", "apps/video-worker/dist/main.js"]
