# Backend Dockerfile - Production Ready
# Multi-stage build for smaller image size

# ===========================================
# Stage 1: Builder
# ===========================================
FROM python:3.11-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    gfortran \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip
RUN pip install --upgrade pip wheel setuptools

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ===========================================
# Stage 2: Runtime
# ===========================================
FROM python:3.11-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Magic number detection
    libmagic1 \
    # PDF processing
    poppler-utils \
    # OCR support
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-vie \
    tesseract-ocr-jpn \
    tesseract-ocr-chi-sim \
    tesseract-ocr-kor \
    tesseract-ocr-fra \
    tesseract-ocr-deu \
    tesseract-ocr-spa \
    # Audio/Video processing
    ffmpeg \
    # Pandoc for document conversion
    pandoc \
    # OpenGL for some ML models
    libgl1 \
    libglib2.0-0 \
    # PDF rendering
    ghostscript \
    # Additional libs
    libgomp1 \
    libxml2 \
    libxslt1.1 \
    # Cleanup
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy application code
COPY app/ ./app/

# Create directories for uploads and outputs
RUN mkdir -p /tmp/tomd_uploads /tmp/tomd_outputs

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash tomd \
    && chown -R tomd:tomd /app /tmp/tomd_uploads /tmp/tomd_outputs

USER tomd

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UPLOAD_DIR=/tmp/tomd_uploads \
    OUTPUT_DIR=/tmp/tomd_outputs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Expose port
EXPOSE 8000

# Run the application with production settings
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
