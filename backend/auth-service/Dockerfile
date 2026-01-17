FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY auth-service/package.json auth-service/package-lock.json* ./

# Install service dependencies + shared required dependencies
RUN npm ci --omit=dev || npm install --omit=dev mongoose jsonwebtoken

# Copy shared modules
COPY shared ./shared

# Copy application source code (routes, server.js, etc)
COPY auth-service/server.js ./
COPY auth-service/routes ./routes

EXPOSE 3001

CMD ["npm", "start"]
