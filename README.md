# AI Maps Assistant (Local LLM + Google Maps)

A clean, interview‑ready implementation of a local LLM assistant that turns natural language prompts into Google Maps searches and renders the results on an interactive map.

## Highlights
- Local LLM (Ollama, LLaMA 3.1 8B by default) to extract intent from free‑form prompts
- Backend API (FastAPI) that calls Google Maps APIs with strong security defaults
- Frontend (Vite + React + TS) showing markers, details on click, and a polished UX
- Production‑minded code: rate limiting, timeouts, retries, caching, strict schemas

## Demo flow
1. User types a prompt (e.g., “find coffee shops open now in Bandung within 1 km, starting from SMAN 24 Bandung”).
2. Backend calls LLM to extract intent (place type/keywords, location text, radius, open_now).
3. Backend resolves the origin precisely (Find Place API → fallback to Geocoding).
4. Backend calls Google Places Nearby (strict radius) → fallback to Text Search.
5. Results are filtered by radius using a Haversine check and returned to the client.
6. Frontend renders markers and an info window with name, address, rating, open status.

## Tech stack
- Backend: Python, FastAPI, httpx, Pydantic, tenacity
- Frontend: React + TypeScript + Vite
- LLM runtime: Ollama (default model: `llama3.1:8b`)
- Maps: Google Places (Nearby/Text Search), Geocoding, Find Place From Text

## Repository structure
```
backend/
  app/
    core/        # config, rate limit middleware, in-memory TTL cache
    routes/      # FastAPI routes
    schemas/     # Pydantic models
    services/    # LLM + Google Maps integrations
    utils/       # geo utilities (Haversine)
  requirements.txt
  README.md
frontend/
  src/
    components/  # MapView, SearchPanel, ResultsList
    hooks/       # useGoogleMaps loader + marker/infowindow helpers
    services/    # API client
    utils/       # polyline decoder (kept for reference)
  package.json
README.md        # this file
```

## Prerequisites
- macOS/Linux with Python 3.9+
- Node.js 18+ (dev uses Node 22)
- Google Cloud project with Maps APIs enabled and two API keys:
  - Server key (backend): restrict by API (Places, Geocoding, Find Place)
  - Browser key (frontend): restrict by HTTP referrers (`http://localhost:5173`)
- Ollama installed locally

Install Ollama and pull the model:
```
brew install ollama
ollama pull llama3.1:8b
brew services start ollama   # or: ollama serve
```

## Backend setup (FastAPI)
```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env` in `backend/`:
```
GOOGLE_MAPS_API_KEY=YOUR_SERVER_KEY
OLLAMA_HOST=http://localhost:11434
LLM_MODEL=llama3.1:8b
ALLOWED_ORIGINS=http://localhost:5173
RATE_LIMIT_PER_MINUTE=60
CACHE_TTL_SECONDS=300
```
Run API:
```
uvicorn app.main:app --reload --port 8000
```
Swagger: `http://localhost:8000/docs`

## Frontend setup (Vite + React)
```
cd frontend
npm install
```
Create `frontend/.env.local`:
```
VITE_GOOGLE_MAPS_BROWSER_KEY=YOUR_BROWSER_KEY
VITE_API_BASE=http://localhost:8000
```
Run dev server:
```
npm run dev
```
Open `http://localhost:5173`.

## API contract
- Endpoint: `POST /api/places/search`
- Request:
```
{ "prompt": "find coffee shops open now in Bandung within 1 km, starting from SMAN 24 Bandung" }
```
- Response (minimal):
```
{
  "results": [
    {
      "name": "Terra Coffee & Space",
      "address": "Jl. Belitung No.2b, Merdeka, Kota Bandung",
      "lat": -6.9128325,
      "lng": 107.61344,
      "rating": 4.8,
      "place_id": "ChIJ...",
      "open_now": true
    }
  ]
}
```
Notes:
- Backend returns only what the frontend needs.
- When `open_now` is unknown, the field may be omitted.

## Security & best practices
- Do not expose server API key to the client. Frontend uses a browser key limited by referrers.
- Rate limit per IP (configurable via `RATE_LIMIT_PER_MINUTE`).
- HTTP client timeouts and retries (exponential backoff) for Google APIs.
- In‑memory TTL cache to reduce repeated requests.
- Strict Pydantic schemas; invalid LLM output is sanitized with safe fallbacks.

## How intent extraction works
- The prompt is sent to Ollama with a strict “JSON‑only” instruction.
- The LLM extracts: query text, optional `place_type`, `location_text`, `radius_m`, `open_now`.
- The backend maps the intent to a concise keyword via a small bilingual dictionary (e.g., “kopi/cafe” → `cafe`).

## Radius and location accuracy
- For named places (e.g., schools, malls), the backend first uses Find Place From Text to get precise coordinates, then falls back to Geocoding.
- Calls Places Nearby Search (honors radius) using the concise keyword; falls back to Text Search if needed.
- Results are finally filtered with a Haversine check to strictly keep items within the requested radius.

## Troubleshooting
- Empty results: verify origin text or increase radius; ensure APIs/quotas/keys are correct.
- LLM slow: use a smaller model (e.g., `qwen2.5:7b-instruct`) or lower context.
- CORS: include `http://localhost:5173` in `ALLOWED_ORIGINS`.

## Scripts
- Backend: `uvicorn app.main:app --reload --port 8000`
- Frontend: `npm run dev`

## License
MIT
