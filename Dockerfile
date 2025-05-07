FROM node:18-alpine

WORKDIR /app

# Install required packages
RUN apk --no-cache add curl

# Copy package.json files first for better caching
COPY client/package*.json ./client/
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd client && npm install
RUN cd backend && npm install

# Copy source files
COPY client/ ./client/
COPY backend/ ./backend/

# Set backend environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV MONGODB_URI=your_mongodb_connection_string

# Create a production .env file for the frontend
RUN echo "VITE_API_URL=/api" > ./client/.env.production
RUN echo "VITE_API_URL_SONG=/api/song" >> ./client/.env.production

# Build frontend
RUN cd client && npm run build

# Create public directory and copy frontend build
RUN mkdir -p backend/public
RUN cp -r client/dist/* backend/public/

# Expose the port your app runs on
EXPOSE 8000

# Add healthcheck
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api || exit 1

# Start with verbose output
CMD echo "Starting application..." && \
    echo "Node version: $(node -v)" && \
    echo "Starting server on port $PORT" && \
    cd backend && node index.js