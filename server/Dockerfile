# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop dev dependencies for a lean runtime image.
RUN npm prune --production

# ── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Default listen port. Railway/Render override this by injecting $PORT at runtime;
# the app reads process.env.PORT, so the healthcheck below must use the same value.
ENV PORT=8080

# Run as a non-root user.
RUN addgroup -S nextlearn && adduser -S nextlearn -G nextlearn

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

USER nextlearn
EXPOSE 8080

# Probe the SAME port the app actually listens on ($PORT). Hitting a hardcoded
# port the app never binds would mark the container perpetually unhealthy and
# trigger restart loops.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT}/health" || exit 1

# server.js is the bootstrap (connects DB/Redis, registers jobs, starts HTTP+Socket.io).
CMD ["node", "dist/server.js"]
