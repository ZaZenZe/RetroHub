FROM node:20-alpine

WORKDIR /app
ENV NODE_PATH=/app/node_modules

# Copy package files
COPY ai-service/package.json ai-service/package-lock.json* ./

# Install service dependencies + shared required dependencies
RUN npm ci --omit=dev || npm install --omit=dev mongoose jsonwebtoken @google/genai

# Copy shared modules so imports work (e.g., '../../shared/...')
COPY shared /shared

# Copy application source code (routes, server.js, utils, etc)
COPY ai-service/server.js ./
COPY ai-service/routes ./routes
COPY ai-service/utils ./utils
COPY ai-service/.env* ./

EXPOSE 3005

CMD ["npm", "start"]
