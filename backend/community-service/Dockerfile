FROM node:20-alpine

WORKDIR /app
ENV NODE_PATH=/app/node_modules

# Copy package files
COPY community-service/package.json community-service/package-lock.json* ./

# Install service dependencies + shared required dependencies
RUN npm ci --omit=dev || npm install --omit=dev mongoose jsonwebtoken

# Copy shared modules to absolute path so route imports '../../shared/...'
COPY shared /shared

# Copy application source code (routes, server.js, etc)
COPY community-service/server.js ./
COPY community-service/routes ./routes

EXPOSE 3004

CMD ["npm", "start"]
