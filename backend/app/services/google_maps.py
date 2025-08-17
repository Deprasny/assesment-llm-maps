from typing import Any, Dict, List, Optional, Tuple
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings


def _endpoint(path: str) -> str:
    return f"https://maps.googleapis.com/maps/api/{path}"


async def geocode(address: str) -> Optional[Tuple[float, float]]:
    if not address:
        return None
    params = {"address": address, "key": get_settings().GOOGLE_MAPS_API_KEY}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(_endpoint("geocode/json"), params=params)
        r.raise_for_status()
        data = r.json()
        results = data.get("results") or []
        if not results:
            return None
        loc = results[0]["geometry"]["location"]
        return float(loc["lat"]), float(loc["lng"])


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=2))
async def places_text_search(query: str, location: Optional[Tuple[float, float]], radius_m: int, open_now: bool) -> List[Dict[str, Any]]:
    params: Dict[str, Any] = {
        "query": query,
        "key": get_settings().GOOGLE_MAPS_API_KEY,
    }
    if location:
        params["location"] = f"{location[0]},{location[1]}"
        # Text Search API secara historis mengabaikan radius untuk sebagian query.
        # Kita tetap kirimkan untuk memberi hint, lalu lakukan filter jarak manual di layer aplikasi.
        params["radius"] = max(200, min(radius_m, 50000))
    if open_now:
        params["opennow"] = "true"
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(_endpoint("place/textsearch/json"), params=params)
        r.raise_for_status()
        data = r.json()
        return data.get("results") or []


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.5, min=0.5, max=2))
async def places_nearby(location: Tuple[float, float], radius_m: int, keyword: Optional[str], open_now: bool) -> List[Dict[str, Any]]:
    params: Dict[str, Any] = {
        "location": f"{location[0]},{location[1]}",
        "radius": max(200, min(radius_m, 50000)),
        "key": get_settings().GOOGLE_MAPS_API_KEY,
    }
    if keyword:
        params["keyword"] = keyword
    if open_now:
        params["opennow"] = "true"
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(_endpoint("place/nearbysearch/json"), params=params)
        r.raise_for_status()
        data = r.json()
        return data.get("results") or []


async def find_place_latlng(query: str) -> Optional[Tuple[float, float]]:
    """Resolve a free-text place to precise lat/lng using Find Place (preferred) then fallback to Geocoding."""
    if not query:
        return None
    params = {
        "input": query,
        "inputtype": "textquery",
        "fields": "geometry",
        "key": get_settings().GOOGLE_MAPS_API_KEY,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(_endpoint("place/findplacefromtext/json"), params=params)
        r.raise_for_status()
        data = r.json()
        candidates = data.get("candidates") or []
        if candidates:
            loc = candidates[0]["geometry"]["location"]
            return float(loc["lat"]), float(loc["lng"])
    # Fallback to geocode
    return await geocode(query)


async def directions(origin: str, destination: str) -> Optional[Dict[str, Any]]:
    params = {
        "origin": origin,
        "destination": destination,
        "key": get_settings().GOOGLE_MAPS_API_KEY,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(_endpoint("directions/json"), params=params)
        r.raise_for_status()
        data = r.json()
        status = data.get("status")
        if status and status != "OK":
            # Gracefully return None when no route found instead of crashing
            return None
        routes = data.get("routes") or []
        if not routes:
            return None
        leg = routes[0]["legs"][0]
        overview = routes[0].get("overview_polyline", {}).get("points")
        return {
            "polyline": overview,
            "distance_text": leg.get("distance", {}).get("text"),
            "duration_text": leg.get("duration", {}).get("text"),
        }


