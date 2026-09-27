import time
from collections import defaultdict

from fastapi import HTTPException, Request

_LIMIT = 30
_WINDOW_SECONDS = 60.0

_hits: dict[str, list[float]] = defaultdict(list)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def check_parse_rate_limit(request: Request) -> None:
    now = time.monotonic()
    key = _client_ip(request)
    recent = [t for t in _hits[key] if now - t < _WINDOW_SECONDS]
    if len(recent) >= _LIMIT:
        raise HTTPException(status_code=429, detail="Muitas requisições. Tente novamente em instantes.")
    recent.append(now)
    _hits[key] = recent


def reset_rate_limit() -> None:
    _hits.clear()
