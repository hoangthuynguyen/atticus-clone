# =============================================================================
# Atticus API - Multi-stage Dockerfile
# Optimized for Render.com free tier (512MB RAM)
# Uses WeasyPrint instead of Puppeteer (10x lighter)
# =============================================================================

# Stage 1: Build Node.js dependencies
FROM node:20-alpine AS node-builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production --ignore-scripts && npm cache clean --force

# Stage 2: Production runtime (Python + Node.js)
FROM python:3.11-slim AS production

# Install WeasyPrint system dependencies (much lighter than Chrome/Puppeteer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libcairo2 \
    libcairo-gobject2 \
    libgirepository1.0-dev \
    gir1.2-pango-1.0 \
    fonts-liberation \
    fonts-dejavu-core \
    fonts-noto-core \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install WeasyPrint
RUN pip install --no-cache-dir weasyprint==62.3

# Install Node.js 20 in the Python image
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Node.js dependencies from builder
COPY --from=node-builder /app/node_modules ./node_modules

# Copy application code
COPY src/ ./src/
COPY python/ ./python/
COPY package.json ./

# Make Python scripts executable
RUN chmod +x python/pdf_render.py

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Limit Node.js heap to 256MB (leave ~256MB for WeasyPrint/Python)
CMD ["node", "--max-old-space-size=256", "src/server.js"]
