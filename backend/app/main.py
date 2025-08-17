from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.core.config import get_settings
from app.routes.health import router as health_router
from app.routes.places import router as places_router
from app.core.rate_limit import RateLimitMiddleware


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Local LLM + Google Maps API",
        version="0.1.0",
        default_response_class=ORJSONResponse,
    )

    # CORS
    allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Simple IP-based rate limiter
    app.add_middleware(
        RateLimitMiddleware,
        calls_per_minute=settings.RATE_LIMIT_PER_MINUTE,
    )

    app.include_router(health_router, prefix="/api")
    app.include_router(places_router, prefix="/api", tags=["places"])

    return app


app = create_app()


