import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls_per_minute: int = 60):  # type: ignore[no-untyped-def]
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.calls: Dict[str, Deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        identifier = request.client.host if request.client else "anonymous"
        window = 60.0
        now = time.monotonic()
        q = self.calls[identifier]
        # purge old
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= self.calls_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded"},
            )
        q.append(now)
        return await call_next(request)


