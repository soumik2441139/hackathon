# Base Stage
FROM node:20-alpine AS base
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
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 5000
USER node
CMD ["node", "dist/server.js"]
