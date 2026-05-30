# BazaarMind — Production Dockerfile
# Single container serving both FastAPI and static Next.js export

FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --production=false
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=""
# Build the static export to /app/frontend/out
RUN npm run build

FROM python:3.12-slim AS production
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || \
    pip install --no-cache-dir \
    fastapi==0.115.0 \
    uvicorn[standard]==0.30.0 \
    python-dotenv==1.0.1 \
    pydantic==2.9.0 \
    pydantic-settings==2.5.0 \
    httpx==0.27.0 \
    python-multipart==0.0.12 \
    numpy==1.26.4 \
    aiofiles==24.1.0

# Copy backend
COPY backend/ ./backend/

# Copy frontend static export directly to the expected location
COPY --from=frontend-builder /app/frontend/out ./frontend/out/

# Create startup script
RUN echo '#!/bin/bash\n\
echo "🚀 Starting BazaarMind..."\n\
echo "Starting backend and static serving on port $PORT..."\n\
cd /app && python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT\n\
' > /app/start.sh && chmod +x /app/start.sh

ENV DEMO_MODE=true
ENV PORT=8080
ENV PYTHONPATH=/app

EXPOSE 8080

CMD ["/app/start.sh"]
