FROM node:18-alpine

WORKDIR /app

# Copy package.json files first for better caching
COPY client/package*.json ./client/
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd client && npm install
RUN cd backend && npm install

# Copy source files
COPY client/ ./client/
COPY backend/ ./backend/

# Build frontend
RUN cd client && npm run build

# Create public directory and copy frontend build
RUN mkdir -p backend/public
RUN cp -r client/dist/* backend/public/

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8000

# Expose the port your app runs on
EXPOSE 8000

# Updated startup command with better logging
CMD echo "Starting application..." && \
    echo "Node version: $(node -v)" && \
    echo "Starting server on port $PORT" && \
    node backend/index.js