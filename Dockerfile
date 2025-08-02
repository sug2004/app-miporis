# Stage 1: Build app and install only production deps
FROM node:20-slim AS builder

WORKDIR /app

# Only install prod dependencies
COPY package.json package-lock.json* ./
RUN npm install --only=production

# Copy only needed app files
COPY . .

# Stage 2: Slim final image
FROM node:20-slim

WORKDIR /app

# Copy only the needed files from builder
COPY --from=builder /app /app
# Use npm preview (uses startServer)
CMD ["npm", "run", "preview"]
