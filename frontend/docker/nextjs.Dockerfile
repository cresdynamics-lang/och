# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/nextjs_app/package.json frontend/nextjs_app/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/nextjs_app .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY frontend/nextjs_app/package.json frontend/nextjs_app/package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Start Next.js
CMD ["npm", "start"]
