# Stage 1: Build frontend
FROM node:20-slim as frontend-builder

# Set working directory
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Python application with frontend assets
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV NODE_ENV production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the requirements file
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy the rest of the application code
COPY . .

# Create directory for static files
RUN mkdir -p /app/staticfiles

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose the port the app runs on
EXPOSE 8000

# Add startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "offer_plus.wsgi:application"]
