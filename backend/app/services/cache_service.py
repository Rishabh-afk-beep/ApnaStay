import fnmatch
import json
import logging
import threading
import time
from typing import Any, Dict, Optional, Tuple

import redis

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class CacheService:
    """Cache service using Redis when REDIS_URL is configured, or a thread-safe in-memory TTL cache otherwise."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_cache()
        return cls._instance

    def _init_cache(self) -> None:
        settings = get_settings()
        self.redis_client: Optional[redis.Redis] = None
        self.redis_enabled = False
        self._memory_lock = threading.Lock()
        self._memory_cache: Dict[str, Tuple[float, str]] = {}

        if settings.redis_url:
            try:
                self.redis_client = redis.Redis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_timeout=2.0,
                    socket_connect_timeout=2.0,
                )
                self.redis_client.ping()
                self.redis_enabled = True
                logger.info("Successfully connected to Redis.")
            except Exception as e:
                logger.warning("Failed to connect to Redis, using in-memory TTL cache: %s", e)
                self.redis_client = None
                self.redis_enabled = False

    def get(self, key: str) -> Optional[Any]:
        if self.redis_enabled and self.redis_client:
            try:
                val = self.redis_client.get(key)
                return json.loads(val) if val else None
            except Exception as e:
                logger.warning("Redis GET error for %s: %s", key, e)
                return None

        now = time.monotonic()
        with self._memory_lock:
            entry = self._memory_cache.get(key)
            if not entry:
                return None
            expires_at, serialized = entry
            if now >= expires_at:
                self._memory_cache.pop(key, None)
                return None
            return json.loads(serialized)

    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        try:
            serialized_val = json.dumps(value, default=str)
        except Exception as e:
            logger.warning("Cache serialization error for %s: %s", key, e)
            return False

        if self.redis_enabled and self.redis_client:
            try:
                return bool(self.redis_client.setex(key, ttl, serialized_val))
            except Exception as e:
                logger.warning("Redis SET error for %s: %s", key, e)
                return False

        expires_at = time.monotonic() + max(1, ttl)
        with self._memory_lock:
            # Bound memory growth on free-tier servers
            if len(self._memory_cache) > 500:
                self._prune_expired_locked(time.monotonic())
                if len(self._memory_cache) > 500:
                    oldest_key = next(iter(self._memory_cache))
                    self._memory_cache.pop(oldest_key, None)
            self._memory_cache[key] = (expires_at, serialized_val)
        return True

    def delete(self, key: str) -> bool:
        if self.redis_enabled and self.redis_client:
            try:
                return bool(self.redis_client.delete(key))
            except Exception as e:
                logger.warning("Redis DELETE error for %s: %s", key, e)
                return False

        with self._memory_lock:
            return self._memory_cache.pop(key, None) is not None

    def invalidate_pattern(self, pattern: str) -> int:
        if self.redis_enabled and self.redis_client:
            try:
                count = 0
                for key in self.redis_client.scan_iter(match=pattern, count=100):
                    self.redis_client.delete(key)
                    count += 1
                return count
            except Exception as e:
                logger.warning("Redis invalidate_pattern error for %s: %s", pattern, e)
                return 0

        with self._memory_lock:
            matched = [k for k in self._memory_cache if fnmatch.fnmatchcase(k, pattern)]
            for k in matched:
                self._memory_cache.pop(k, None)
            return len(matched)

    def clear_all(self) -> None:
        with self._memory_lock:
            self._memory_cache.clear()
        if self.redis_enabled and self.redis_client:
            try:
                self.redis_client.flushdb()
            except Exception as e:
                logger.warning("Redis flushdb error: %s", e)

    def _prune_expired_locked(self, now: float) -> None:
        expired = [k for k, (exp, _) in self._memory_cache.items() if now >= exp]
        for k in expired:
            self._memory_cache.pop(k, None)
