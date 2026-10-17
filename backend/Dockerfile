# Morphix 3D Backend — Production Dockerfile (optimized for Railway/Render)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built output and minimal deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Prune dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 4000

# Run DB migration then start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
