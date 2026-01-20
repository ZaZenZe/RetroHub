# Multi-stage build for React frontend + Node.js gateway

# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build React app for production
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine

WORKDIR /app

# Copy root dependencies and gateway code
COPY package.json package-lock.json* ./
COPY server.js ./

# Install production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy built React app from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy original frontend assets (for fallback if dist doesn't exist)
COPY frontend/assets ./frontend/assets
COPY frontend/style.css frontend/admin.css ./frontend/

EXPOSE 5173

CMD ["npm", "start"]
