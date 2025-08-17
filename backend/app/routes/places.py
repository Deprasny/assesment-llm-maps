from typing import List
from fastapi import APIRouter, HTTPException

from app.core.cache import InMemoryTTLCache
from app.core.config import get_settings
from app.schemas.intent import PromptIn, SearchResponse, Intent, Place, Directions, SearchResultsOnly
from app.services import llm as llm_service
from app.services import google_maps as gmaps
from app.utils.geo import calculate_distance_meters


router = APIRouter()
_cache = InMemoryTTLCache(ttl_seconds=get_settings().CACHE_TTL_SECONDS)


def _normalize_place(result: dict) -> Place:
    geometry = result.get("geometry", {}).get("location", {})
    return Place(
        name=result.get("name", "Unknown"),
        address=result.get("formatted_address") or result.get("vicinity"),
        lat=float(geometry.get("lat", 0.0)),
        lng=float(geometry.get("lng", 0.0)),
        rating=result.get("rating"),
        place_id=result.get("place_id"),
        open_now=(result.get("opening_hours", {}) or {}).get("open_now"),
    )


def _derive_keyword(intent: Intent) -> str:
    if intent.place_type:
        return intent.place_type
    q = (intent.query or "").lower()
    keyword_map = {
        "cafe": ["cafe", "kopi", "coffee", "kedai"],
        "restaurant": ["resto", "makan", "kuliner", "restaurant", "warung"],
        "tourist_attraction": ["wisata", "tourist", "taman", "monumen", "museum"],
        "hotel": ["hotel", "penginapan"],
        "atm": ["atm"],
        "bank": ["bank"],
    }
    for kw, tokens in keyword_map.items():
        if any(t in q for t in tokens):
            return kw
    # default to a broad category
    return "restaurant"


@router.post("/places/search", response_model=SearchResultsOnly)
async def search_places(body: PromptIn) -> SearchResultsOnly:
    raw_intent = await llm_service.extract_intent(body.prompt)
    try:
        intent = Intent(**{
            "query": raw_intent.get("query", body.prompt),
            "place_type": raw_intent.get("place_type"),
            "location_text": raw_intent.get("location_text"),
            "radius_m": raw_intent.get("radius_m", 3000),
            "open_now": raw_intent.get("open_now", False),
            "route_from": raw_intent.get("route_from"),
            "needs_clarification": raw_intent.get("needs_clarification", False),
            "missing_fields": raw_intent.get("missing_fields"),
        })
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Invalid intent: {e}")

    cache_key = f"places:{intent.query}:{intent.location_text}:{intent.radius_m}:{intent.open_now}"
    cached = _cache.get(cache_key)
    if cached:
        results = cached
    else:
        # Use Find Place for better precision around named POIs (e.g., schools, malls)
        if intent.location_text:
            loc = await gmaps.find_place_latlng(intent.location_text)
            if not loc:
                loc = await gmaps.geocode(intent.location_text)
        else:
            loc = None
        results: list[Place] = []
        search_keyword = _derive_keyword(intent)
        if loc:
            # First try Nearby Search which honors radius strictly. Use concise keyword.
            nearby_raw = await gmaps.places_nearby(loc, intent.radius_m, keyword=search_keyword, open_now=intent.open_now)
            results = [_normalize_place(r) for r in nearby_raw]

        # Fallback to Text Search if Nearby is sparse
        if not results:
            text_query = search_keyword
            results_raw = await gmaps.places_text_search(text_query, loc, intent.radius_m, intent.open_now)
            results = [_normalize_place(r) for r in results_raw]

        # Apply strict post-filter by radius if we have an origin location
        if loc:
            origin_lat, origin_lng = loc
            results = [
                p for p in results
                if calculate_distance_meters(origin_lat, origin_lng, p.lat, p.lng) <= max(intent.radius_m, 200)
            ]

        results = results[:20]
        _cache.set(cache_key, results)

    # Directions feature disabled by request: keep response shape but always null
    dir_data = None

    # Return only results for minimal exposure of internals
    return SearchResultsOnly(results=results)


