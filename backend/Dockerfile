# Morphix 3D Backend — Production Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install ALL deps (including devDeps for TypeScript build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Expose port
EXPOSE 4000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
