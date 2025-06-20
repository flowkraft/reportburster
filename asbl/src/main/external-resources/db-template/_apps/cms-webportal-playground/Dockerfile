FROM node:20-alpine AS base

# Build-time environment variables with dummy values for t3-env validation
ENV TURNSTILE_SECRET_KEY=dummy-build-value
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA6-zLTAxnNwxflJ
ENV DATABASE_URL=dummy-build-value
ENV POSTMARK_API_TOKEN=dummy-build-value
ENV STRIPE_API_KEY=dummy-build-value
ENV NEXT_PUBLIC_APP_URL=https://www.cms-webportal-playground.com

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY prisma ./prisma
COPY scripts ./scripts
COPY package.json package-lock.json* ./

RUN npm ci
RUN npx prisma generate
RUN npm run _custom:prisma:migrations-create-prod

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Clear environment variables for runtime
ENV TURNSTILE_SECRET_KEY=
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ENV DATABASE_URL=
ENV POSTMARK_API_TOKEN=
ENV STRIPE_API_KEY=
ENV NEXT_PUBLIC_APP_URL=https://www.cms-webportal-playground.com

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start reportburster.com Next.js app
CMD ["node", "server.js"]