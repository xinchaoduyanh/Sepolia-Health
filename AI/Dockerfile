# Production image for Sepolia AI FastAPI service.
# Backend and AI are separate components; do not bake secrets into layers.
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    AI_ENV=production \
    AI_RAG_REQUIRE_INDEX=true \
    PORT=8088

WORKDIR /app

# System deps for asyncpg / chromadb wheels when needed.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Non-root user before copying app so runtime cannot write outside /app data volume.
RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin aiuser

COPY --chown=aiuser:aiuser app ./app
COPY --chown=aiuser:aiuser prompts ./prompts
COPY --chown=aiuser:aiuser knowledge ./knowledge
COPY --chown=aiuser:aiuser pyproject.toml ./

# Chroma/index and secrets are mounted at runtime, never baked in.
RUN mkdir -p /app/data/chroma /app/logs \
    && chown -R aiuser:aiuser /app/data /app/logs

USER aiuser

EXPOSE 8088

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

# DigitalOcean / K8s inject PORT; fall back to 8088.
# Mount chroma data volume at /app/data/chroma with prebuilt index_manifest.json.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8088} --workers 1"]
