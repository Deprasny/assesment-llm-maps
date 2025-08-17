from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GOOGLE_MAPS_API_KEY: str = ""
    OLLAMA_HOST: str = "http://localhost:11434"
    LLM_MODEL: str = "llama3.1:8b"
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    RATE_LIMIT_PER_MINUTE: int = 60
    CACHE_TTL_SECONDS: int = 300

    class Config:
        env_file = ".env"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


