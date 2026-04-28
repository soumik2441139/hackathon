# Base Stage
FROM node:20-alpine3.20 AS base
WORKDIR /app
COPY package.json package-lock.json ./
# Install TeX Live for resume compilation and exclude workspaces for backend isolation
RUN apk add --no-cache texlive-full && \
    npm install --production --no-workspaces


# Source Stage
FROM base AS builder
COPY . .
RUN npm install typescript -g
RUN tsc

# Production Stage
FROM node:20-alpine3.20 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Health check — Docker & orchestrators use this to verify readiness
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=20s \
  CMD wget --spider -q http://localhost:5000/health || exit 1

EXPOSE 5000
USER node
CMD ["node", "dist/server.js"]
