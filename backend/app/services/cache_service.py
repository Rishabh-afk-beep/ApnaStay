import fnmatch
import json
import logging
import threading
import time
from typing import Any, Callable, Dict, Optional, Set, Tuple, TypeVar

import redis

from app.core.config import get_settings

logger = logging.getLogger(__name__)
T = TypeVar("T")


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
        self._swr_meta_lock = threading.Lock()
        self._key_locks: Dict[str, threading.Lock] = {}
        self._refreshing_keys: Set[str] = set()

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

    def _get_key_lock(self, key: str) -> threading.Lock:
        with self._swr_meta_lock:
            lock = self._key_locks.get(key)
            if lock is None:
                if len(self._key_locks) > 500:
                    self._key_locks.clear()
                lock = threading.Lock()
                self._key_locks[key] = lock
            return lock

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

    def get_swr(
        self,
        key: str,
        loader: Callable[[], T],
        fresh_ttl: int = 300,
        stale_ttl: int = 86400,
        cache_if: Optional[Callable[[T], bool]] = None,
        background_refresh: bool = True,
    ) -> T:
        """Stale-While-Revalidate cache with per-key singleflight stampede protection."""
        now = time.time()
        entry = self.get(key)
        if isinstance(entry, dict) and entry.get("__swr__") is True:
            val = entry.get("v")
            if now < float(entry.get("fresh_until", 0)):
                return val
            if background_refresh:
                self._trigger_background_refresh(key, loader, fresh_ttl, stale_ttl, cache_if)
            return val

        key_lock = self._get_key_lock(key)
        with key_lock:
            # Double-check after acquiring lock so concurrent callers coalesce
            entry = self.get(key)
            if isinstance(entry, dict) and entry.get("__swr__") is True:
                return entry.get("v")

            fresh_val = loader()
            if cache_if is None or cache_if(fresh_val):
                self.set(
                    key,
                    {
                        "__swr__": True,
                        "fresh_until": time.time() + max(1, fresh_ttl),
                        "v": fresh_val,
                    },
                    ttl=max(fresh_ttl, stale_ttl),
                )
            return fresh_val

    def _trigger_background_refresh(
        self,
        key: str,
        loader: Callable[[], T],
        fresh_ttl: int,
        stale_ttl: int,
        cache_if: Optional[Callable[[T], bool]],
    ) -> None:
        with self._swr_meta_lock:
            if key in self._refreshing_keys:
                return
            self._refreshing_keys.add(key)

        def _worker() -> None:
            try:
                fresh_val = loader()
                if cache_if is None or cache_if(fresh_val):
                    self.set(
                        key,
                        {
                            "__swr__": True,
                            "fresh_until": time.time() + max(1, fresh_ttl),
                            "v": fresh_val,
                        },
                        ttl=max(fresh_ttl, stale_ttl),
                    )
            except Exception as exc:
                logger.warning("Background SWR refresh failed for %s: %s", key, exc)
            finally:
                with self._swr_meta_lock:
                    self._refreshing_keys.discard(key)

        threading.Thread(target=_worker, name=f"swr-{key[:24]}", daemon=True).start()

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
