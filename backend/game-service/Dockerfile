FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY game-service/package.json game-service/package-lock.json* ./

# Install service dependencies + shared required dependencies
RUN npm ci --omit=dev || npm install --omit=dev mongoose jsonwebtoken

# Copy shared modules
COPY shared ./shared

# Copy application source code (routes, server.js, etc)
COPY game-service/server.js ./
COPY game-service/routes ./routes

EXPOSE 3003

CMD ["npm", "start"]
