# Frontend-only Dockerfile for OfferPlus
# This is now primarily used for building the frontend application

FROM node:20-slim as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration if it exists
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || echo "No custom nginx config found"

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
