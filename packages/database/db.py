"""
UrbanFlow AI - SQLite Data Layer Module (AGENT_4 | Mansi)
Directory: /packages/database
"""

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def get_db_path() -> str:
    """
    Resolves the SQLite database path from the DB_PATH environment variable,
    falling back to urbanflow.db in the module directory.
    """
    env_path = os.getenv("DB_PATH")
    if env_path:
        p = Path(env_path)
        if p.is_absolute():
            return str(p.resolve())
        # If relative path exists in current working directory, use it
        cwd_p = Path.cwd() / p
        if cwd_p.exists():
            return str(cwd_p.resolve())
        # If relative path exists in module directory, use it
        pkg_p = Path(__file__).parent / p
        if pkg_p.exists():
            return str(pkg_p.resolve())
        # If filename matches urbanflow.db in module dir, use that
        if p.name == "urbanflow.db" and (Path(__file__).parent / "urbanflow.db").exists():
            return str((Path(__file__).parent / "urbanflow.db").resolve())
        return str(cwd_p.resolve())

    # Default fallback: urbanflow.db adjacent to db.py
    return str((Path(__file__).parent / "urbanflow.db").resolve())


def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """
    Returns an open SQLite connection with Row factory and foreign keys enabled.
    """
    target = db_path or get_db_path()
    parent_dir = Path(target).parent
    if parent_dir and not parent_dir.exists():
        parent_dir.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(target)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def get_all_nodes() -> List[Dict[str, Any]]:
    """
    Retrieves all nodes from the nodes table.
    Returns:
        List of dicts: [{'node_id': str, 'lat': float, 'lng': float, 'name': str}, ...]
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT node_id, lat, lng, name
            FROM nodes
            ORDER BY node_id ASC;
            """
        )
        return [dict(row) for row in cursor.fetchall()]


def get_all_edges() -> List[Dict[str, Any]]:
    """
    Retrieves all edges from the edges table.
    Returns:
        List of dicts: [
            {
                'edge_id': str,
                'from_node': str,
                'to_node': str,
                'base_weight': float,
                'congestion_score': float,
                'is_blocked': int,
                'effective_weight': float
            },
            ...
        ]
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT edge_id, from_node, to_node, base_weight, congestion_score, is_blocked, effective_weight
            FROM edges
            ORDER BY edge_id ASC;
            """
        )
        return [dict(row) for row in cursor.fetchall()]


def update_edge_congestion(edge_id: str, congestion_score: float) -> Optional[Dict[str, Any]]:
    """
    Updates congestion_score for an edge and recalculates effective_weight as:
    base_weight * (1 + congestion_score).
    If the edge is currently blocked (is_blocked = 1), effective_weight remains 999999.
    Returns the updated edge dict, or None if edge_id was not found.
    """
    score = float(congestion_score)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE edges
            SET congestion_score = ?,
                effective_weight = CASE
                    WHEN is_blocked = 1 THEN 999999
                    ELSE base_weight * (1.0 + ?)
                END
            WHERE edge_id = ?;
            """,
            (score, score, edge_id)
        )
        conn.commit()

        cursor.execute(
            """
            SELECT edge_id, from_node, to_node, base_weight, congestion_score, is_blocked, effective_weight
            FROM edges
            WHERE edge_id = ?;
            """,
            (edge_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def set_edge_blocked(edge_id: str, is_blocked: Any) -> Optional[Dict[str, Any]]:
    """
    Updates is_blocked (0=false, 1=true).
    Sets effective_weight to 999999 if blocked.
    Restores base_weight calculation (base_weight * (1 + congestion_score)) if unblocked.
    Returns the updated edge dict, or None if edge_id was not found.
    """
    blocked_val = 1 if is_blocked else 0
    with get_connection() as conn:
        cursor = conn.cursor()
        if blocked_val == 1:
            cursor.execute(
                """
                UPDATE edges
                SET is_blocked = 1,
                    effective_weight = 999999
                WHERE edge_id = ?;
                """,
                (edge_id,)
            )
        else:
            cursor.execute(
                """
                UPDATE edges
                SET is_blocked = 0,
                    effective_weight = base_weight * (1.0 + congestion_score)
                WHERE edge_id = ?;
                """,
                (edge_id,)
            )
        conn.commit()

        cursor.execute(
            """
            SELECT edge_id, from_node, to_node, base_weight, congestion_score, is_blocked, effective_weight
            FROM edges
            WHERE edge_id = ?;
            """,
            (edge_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def log_incident(
    incident_id: str,
    edge_id: str,
    type: str,
    severity: str,
    timestamp: Optional[str] = None
) -> Dict[str, Any]:
    """
    Inserts a new incident into the incidents table with current ISO-8601 timestamp and resolved=0.
    Returns the inserted incident record as a dict.
    """
    ts = timestamp or datetime.now(timezone.utc).isoformat()
    resolved = 0
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO incidents (incident_id, edge_id, type, severity, timestamp, resolved)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            (incident_id, edge_id, type, severity, ts, resolved)
        )
        conn.commit()

        cursor.execute(
            """
            SELECT incident_id, edge_id, type, severity, timestamp, resolved
            FROM incidents
            WHERE incident_id = ?;
            """,
            (incident_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else {
            "incident_id": incident_id,
            "edge_id": edge_id,
            "type": type,
            "severity": severity,
            "timestamp": ts,
            "resolved": resolved
        }


def resolve_incident(incident_id: str) -> Optional[Dict[str, Any]]:
    """
    Resolves an active incident by setting resolved = 1.
    Returns the updated incident dict, or None if not found.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE incidents
            SET resolved = 1
            WHERE incident_id = ?;
            """,
            (incident_id,)
        )
        conn.commit()

        cursor.execute(
            """
            SELECT incident_id, edge_id, type, severity, timestamp, resolved
            FROM incidents
            WHERE incident_id = ?;
            """,
            (incident_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None


# Helpful query utilities for consumers (e.g. AGENT_2 API & AGENT_3 AI Engine)
def get_node(node_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT node_id, lat, lng, name FROM nodes WHERE node_id = ?;", (node_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_edge(edge_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT edge_id, from_node, to_node, base_weight, congestion_score, is_blocked, effective_weight
            FROM edges
            WHERE edge_id = ?;
            """,
            (edge_id,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def get_all_incidents(resolved: Optional[int] = None) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        if resolved is not None:
            cursor.execute(
                """
                SELECT incident_id, edge_id, type, severity, timestamp, resolved
                FROM incidents
                WHERE resolved = ?
                ORDER BY timestamp DESC;
                """,
                (resolved,)
            )
        else:
            cursor.execute(
                """
                SELECT incident_id, edge_id, type, severity, timestamp, resolved
                FROM incidents
                ORDER BY timestamp DESC;
                """
            )
        return [dict(row) for row in cursor.fetchall()]
