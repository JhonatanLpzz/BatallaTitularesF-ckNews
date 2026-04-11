# Railway Dockerfile for Bun + Batalla de Titulares
FROM oven/bun:1-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create storage directories (Railway volume will mount to /storage)
RUN mkdir -p /storage/data /storage/data/backups

# Build frontend
RUN bun run build

# Expose port (Railway sets PORT automatically)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start server
CMD ["bun", "start"]
