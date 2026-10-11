# ============================================
# FlowKraft's AI Crew - Next.js 15
# ============================================
# Multi-stage build for production deployment

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# The npm cache lives in a BuildKit cache mount, so an install the layer cache cannot answer (a
# changed package.json, a pruned builder) downloads only what is new instead of the whole dependency
# tree again: it took 270 s of the 8 minutes this image needed on 2026-10-11, and 60 s with the
# cache warm. The install command is unchanged, so what comes out is the same node_modules.
# BuildKit is what builds this file everywhere it is built (Docker 23+, and every Compose v2).
# better-sqlite3, which has no Alpine prebuild, is compiled here by its own install script - once,
# for this image's own platform, which is why no stage below rebuilds it.
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# No native rebuild here. There used to be one (`npm rebuild better-sqlite3`), and it cost 127 s of
# the 8 minutes this image took on 2026-10-11 - on EVERY build, because `COPY . .` above changes
# whenever a source file does. It was needed while the build context carried the host's node_modules,
# which `COPY . .` laid on top of the Alpine ones from the deps stage: binaries of another platform,
# which then had to be compiled again. .dockerignore keeps that folder out of the context, so the
# modules in this stage are exactly the ones deps installed and compiled here. If that ever stopped
# being true, `npm run db:push` two lines down is the first thing that would fail: it opens the
# SQLite database through better-sqlite3.

# Create data directory for SQLite and initialize database schema
RUN mkdir -p ./data
RUN npm run db:push

# Build the Next.js application
RUN npm run build

# Stage 2b: Dev server
# The same builder, started as `next dev` instead of serving a production build. The sources are
# bind-mounted over /app by whoever runs this stage (the e2e loop lane of asbl/ci/dp-ci.sh and
# dp-dev-live), so a change to a page costs a recompile of that page and no image build at all:
# this stage can never serve a stale copy of the start page. The image DataPallas ships is the
# runner below, which is the one the release e2e proves.
FROM builder AS devserver
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000
# /app/data is a volume, and an empty one has no schema in it yet: drizzle's push is idempotent and
# costs under a second once the tables are there.
CMD ["sh", "-c", "npm run db:push && exec npm run dev"]

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for SQLite database
RUN mkdir -p ./data && chown nextjs:nodejs ./data

# Create public directory (may be empty)
RUN mkdir -p ./public

# Copy built application
# Copy public folder contents if they exist (using wildcard to handle empty folder)
COPY --from=builder /app/public* ./public/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy drizzle config and scripts if they exist (using wildcards for optional files)
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts* ./
COPY --from=builder --chown=nextjs:nodejs /app/scripts* ./scripts/

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
