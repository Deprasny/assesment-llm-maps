import httpx
from typing import Any, Dict
from app.core.config import get_settings


INTENT_EXTRACTION_PROMPT = (
    "You are an assistant that extracts a structured intent for places search.\n"
    "Return strictly valid JSON matching this schema keys: \n"
    "{query, place_type, location_text, radius_m, open_now, route_from, needs_clarification, missing_fields}.\n"
    "Rules: \n"
    "- If location is missing, set needs_clarification=true and missing_fields=['location_text'].\n"
    "- If radius not given, default radius_m=3000.\n"
    "- open_now true only if user clearly asks open now.\n"
    "- place_type is a short category like 'restaurant', 'cafe', 'tourist_attraction' when derivable; else null.\n"
    "Respond JSON only, no prose."
)


async def extract_intent(prompt: str) -> Dict[str, Any]:
    settings = get_settings()
    url = f"{settings.OLLAMA_HOST}/api/generate"
    payload = {
        "model": settings.LLM_MODEL,
        "prompt": f"{INTENT_EXTRACTION_PROMPT}\nUser: {prompt}",
        "format": "json",
        "stream": False,
    }
    timeout = httpx.Timeout(30.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        r = await client.post(url, json=payload)
        r.raise_for_status()
        data = r.json()
        # Ollama returns { response: "json string" }
        text = data.get("response") or "{}"
        # Avoid crashing on invalid json
        import json

        try:
            return json.loads(text)
        except Exception:
            # Minimal fallback
            return {"query": prompt, "radius_m": 3000, "open_now": False}


