# syntax=docker/dockerfile:1

# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# Aktywuj pnpm przez wbudowany corepack (Node 24)
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
# Jesli nie ma pnpm-lock.yaml, pnpm zaimportuje z package-lock.json
RUN [ -f pnpm-lock.yaml ] || pnpm import
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN [ -f pnpm-lock.yaml ] || pnpm import
RUN pnpm install --frozen-lockfile --prod --ignore-scripts && pnpm store prune

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/http.mjs"]
