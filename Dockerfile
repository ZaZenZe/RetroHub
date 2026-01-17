FROM node:20-alpine

WORKDIR /app

# Copy root dependencies and gateway code
COPY package.json package-lock.json ./
COPY server.js ./
COPY frontend ./frontend

# Install dependencies
RUN npm install --omit=dev --ignore-scripts

EXPOSE 5173

CMD ["npm", "start"]
