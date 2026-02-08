# Build stage
FROM --platform=linux/amd64 node:20 AS build

WORKDIR /app

# Install mediasoup build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Runtime stage
FROM --platform=linux/amd64 node:20-slim

WORKDIR /app

# Install runtime dependencies for mediasoup
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy built files
COPY --from=build /app/dist ./dist

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

EXPOSE 3000
EXPOSE 10000-10100/udp

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]
