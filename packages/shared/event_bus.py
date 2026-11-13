"""Pure Python event bus implementation for UrbanFlow AI.

Features:
- Pure Python with zero external dependencies.
- Standardized envelope for all published events:
  {
      "event": "string",
      "timestamp": "ISO-8601",
      "payload": {}
  }
- Thread-safe pub/sub operations.
"""

from datetime import datetime, timezone
import inspect
import threading
from typing import Any, Callable, Dict, List, Optional


class EventBus:
    """Thread-safe, pure Python publish-subscribe event bus."""

    def __init__(self) -> None:
        self._listeners: Dict[str, List[Callable[..., Any]]] = {}
        self._lock = threading.RLock()

    def subscribe(self, event_name: str, callback: Callable[..., Any]) -> None:
        """Register a listener callback for a specific event."""
        with self._lock:
            if event_name not in self._listeners:
                self._listeners[event_name] = []
            if callback not in self._listeners[event_name]:
                self._listeners[event_name].append(callback)

    def unsubscribe(self, event_name: str, callback: Callable[..., Any]) -> bool:
        """Remove a previously registered listener callback."""
        with self._lock:
            if event_name in self._listeners:
                try:
                    self._listeners[event_name].remove(callback)
                    return True
                except ValueError:
                    return False
            return False

    def publish(self, event_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Publish an event with payload to all registered listeners.

        All events follow the envelope format:
        {
            "event": "string",
            "timestamp": "ISO-8601",
            "payload": {}
        }
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        envelope = {
            "event": event_name,
            "timestamp": now_iso,
            "payload": payload if isinstance(payload, dict) else (payload or {}),
        }

        with self._lock:
            listeners = list(self._listeners.get(event_name, []))

        for listener in listeners:
            self._invoke_listener(listener, envelope)

        return envelope

    def _invoke_listener(self, listener: Callable[..., Any], envelope: Dict[str, Any]) -> None:
        """Invoke listener with the standardized envelope or fallback gracefully."""
        try:
            sig = inspect.signature(listener)
            param_count = len(sig.parameters)
            if param_count == 0:
                listener()
            elif param_count == 1:
                # Default to passing the standard envelope
                try:
                    listener(envelope)
                except Exception:
                    # Fallback to payload if listener was written expecting raw payload
                    listener(envelope["payload"])
            else:
                listener(envelope["event"], envelope["payload"])
        except (ValueError, TypeError):
            # If inspection fails (e.g. built-in), try envelope first
            try:
                listener(envelope)
            except TypeError:
                listener(envelope["payload"])

    def clear(self) -> None:
        """Clear all registered listeners."""
        with self._lock:
            self._listeners.clear()


# Default global event bus singleton
event_bus = EventBus()


def subscribe(event_name: str, callback: Callable[..., Any]) -> None:
    """Register a listener callback on the default event bus."""
    event_bus.subscribe(event_name, callback)


def publish(event_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Publish an event to the default event bus with the standardized envelope."""
    return event_bus.publish(event_name, payload)
