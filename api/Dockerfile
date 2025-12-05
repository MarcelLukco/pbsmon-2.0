# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools and gcc for compiling pbscaller.c
RUN apk add --no-cache gcc musl-dev

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Build pbscaller executable
RUN mkdir -p bin && \
    cd src/cli && \
    gcc -g -L/usr/lib pbscaller.c -o ../../bin/pbsprocaller -lpbs && \
    chmod +x ../../bin/pbsprocaller

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy pbscaller executable from builder
COPY --from=builder /app/bin ./bin

# Create data directory for perun data
RUN mkdir -p /app/data/perun /app/data/pbs

# Expose port
EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/main"]

