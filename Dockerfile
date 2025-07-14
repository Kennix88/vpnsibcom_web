# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Install dependencies needed for node-gyp on alpine
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all files
COPY . .

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname to listen on all interfaces
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]