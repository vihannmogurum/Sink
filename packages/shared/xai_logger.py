"""Explainable AI (XAI) decision logger for UrbanFlow AI.

Appends structured decisions to xai_log.jsonl with ISO-8601 timestamps.
Serves as the data feed for the real-time XAI dashboard feed.
"""

from datetime import datetime, timezone
import json
import os
from pathlib import Path
import threading
from typing import Any, Dict, List, Optional

_LOCK = threading.RLock()

# Default path for xai_log.jsonl: environment variable > project root > local dir
_DEFAULT_DIR = Path(__file__).resolve().parent.parent.parent
_DEFAULT_LOG_PATH = Path(os.environ.get("XAI_LOG_PATH", _DEFAULT_DIR / "xai_log.jsonl"))


def get_log_path() -> Path:
    """Return the currently configured XAI log path."""
    return Path(os.environ.get("XAI_LOG_PATH", _DEFAULT_LOG_PATH))


def set_log_path(path: str | Path) -> None:
    """Override the active XAI log path (useful for testing and environment configuration)."""
    global _DEFAULT_LOG_PATH
    _DEFAULT_LOG_PATH = Path(path)


def log_decision(
    agent_name: str,
    decision: str,
    reason: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Append a decision record to xai_log.jsonl with an ISO-8601 timestamp.

    Parameters:
        agent_name: Name of the deciding agent (e.g. 'MonitorAgent')
        decision: The decision or action taken
        reason: Plain English explanation of the decision
        metadata: Optional additional contextual attributes (all snake_case)

    Returns:
        The logged record dictionary.
    """
    record: Dict[str, Any] = {
        "agent_name": agent_name,
        "decision": decision,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if metadata:
        record["metadata"] = metadata

    target_path = get_log_path()
    target_path.parent.mkdir(parents=True, exist_ok=True)

    line = json.dumps(record) + "\n"
    with _LOCK:
        with open(target_path, "a", encoding="utf-8") as f:
            f.write(line)

    return record


def get_recent_decisions(n: int = 10) -> List[Dict[str, Any]]:
    """Return the last n decisions from xai_log.jsonl as a list of dictionaries.

    If fewer than n decisions exist, all available decisions are returned.
    If the log file does not exist, an empty list is returned.
    """
    target_path = get_log_path()
    if not target_path.exists():
        return []

    records: List[Dict[str, Any]] = []
    with _LOCK:
        with open(target_path, "r", encoding="utf-8") as f:
            for line in f:
                line_str = line.strip()
                if line_str:
                    try:
                        records.append(json.loads(line_str))
                    except json.JSONDecodeError:
                        continue

    return records[-n:] if n > 0 else []
