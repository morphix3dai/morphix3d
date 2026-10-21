# Morphix 3D Backend — Production Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma schema generation
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and Prisma configuration
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma Client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# ── Production Runner Image ───────────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL runtime for Prisma queries
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=4000

# Copy compiled JavaScript, node_modules (including Prisma CLI & client), and Prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Push DB schema to Supabase, then start Express server
CMD ["sh", "-c", "npx prisma db push --skip-generate || echo DB_PUSH_FAILED; node dist/server.js"]
