FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY user-service/package.json user-service/package-lock.json* ./

# Install service dependencies + shared required dependencies
RUN npm ci --omit=dev || npm install --omit=dev mongoose jsonwebtoken

# Copy shared modules
COPY shared ./shared

# Copy application source code (routes, server.js, etc)
COPY user-service/server.js ./
COPY user-service/routes ./routes

EXPOSE 3002

CMD ["npm", "start"]
