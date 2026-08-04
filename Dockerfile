# syntax=docker/dockerfile:1

# ── Base ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ── Dependencies (pnpm is this repo's package manager) ──────────────────
FROM base AS deps
RUN npm install -g pnpm@9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Build ───────────────────────────────────────────────────────────────
# NEXT_PUBLIC_* variables are inlined into the bundle at build time, so
# they must be provided as build args (--build-arg or compose `args`).
FROM base AS builder
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_BASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── Runner (slim, runs the standalone server) ───────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
