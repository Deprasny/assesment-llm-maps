import time
from typing import Any, Dict, Tuple


class InMemoryTTLCache:
    def __init__(self, ttl_seconds: int = 300) -> None:
        self.ttl_seconds = ttl_seconds
        self._store: Dict[str, Tuple[float, Any]] = {}

    def _now(self) -> float:
        return time.monotonic()

    def get(self, key: str) -> Any:
        item = self._store.get(key)
        if not item:
            return None
        ts, value = item
        if self._now() - ts > self.ttl_seconds:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (self._now(), value)


