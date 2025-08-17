from typing import Optional
from pydantic import BaseModel, Field


class Intent(BaseModel):
    query: str = Field(description="Original user prompt")
    place_type: Optional[str] = Field(default=None, description="Normalized place category if known")
    location_text: Optional[str] = Field(default=None, description="Free-text location, e.g., 'Bandung' or an address")
    radius_m: int = Field(default=3000, ge=100, le=50000)
    open_now: bool = Field(default=False)
    route_from: Optional[str] = Field(default=None, description="Origin address for directions")
    needs_clarification: bool = Field(default=False)
    missing_fields: Optional[list[str]] = Field(default=None)


class PromptIn(BaseModel):
    prompt: str


class Place(BaseModel):
    name: str
    address: Optional[str] = None
    lat: float
    lng: float
    rating: Optional[float] = None
    place_id: Optional[str] = None
    open_now: Optional[bool] = None


class Directions(BaseModel):
    polyline: Optional[str] = None
    distance_text: Optional[str] = None
    duration_text: Optional[str] = None


class SearchResponse(BaseModel):
    intent: Intent
    results: list[Place]
    directions: Optional[Directions] = None


class SearchResultsOnly(BaseModel):
    results: list[Place]


