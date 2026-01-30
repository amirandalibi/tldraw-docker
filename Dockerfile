# Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY src ./src
COPY index.html vite.config.js ./
RUN npm run build

# Production image
FROM node:22-alpine
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy server code
COPY server.js ./

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Create data directory
RUN mkdir -p /data

EXPOSE 80

CMD ["node", "server.js"]
