Backend FastAPI for Local LLM + Google Maps

Overview

This service accepts a natural-language prompt, extracts a structured intent using a local LLM (Ollama, LLaMA 3.1 8B), then queries Google Maps (Geocoding, Places, Directions) and returns results with optional directions.

Key points

- Clean architecture: `core/`, `schemas/`, `services/`, `routes/`.
- Security: API key loaded from environment; do not expose server key to frontend.
- Reliability: input validation (Pydantic), timeouts, basic rate limiting, and simple in-memory caching.
- DX: Auto docs at `/docs`.

Quick start

1) Create `.env` with values (see below).

2) Create and activate a virtual environment, then install dependencies:

```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3) Run the API:

```
uvicorn app.main:app --reload --port 8000
```

4) Try the API in Swagger UI at `http://localhost:8000/docs`.

Environment variables

- `GOOGLE_MAPS_API_KEY` (required)
- `OLLAMA_HOST` (default: `http://localhost:11434`)
- `LLM_MODEL` (default: `llama3.1:8b`)
- `ALLOWED_ORIGINS` (comma-separated; default: `http://localhost:5173`)
- `RATE_LIMIT_PER_MINUTE` (default: `60`)
- `CACHE_TTL_SECONDS` (default: `300`)

Endpoints

- `GET /api/health` → Health check
- `POST /api/places/search` → Body `{ "prompt": "..." }` → returns `{ intent, results, directions? }`

Notes

- This project intentionally keeps an in-memory cache and limiter suitable for local demo/testing.
- For production, consider Redis for cache/rate-limit and observability stack.


