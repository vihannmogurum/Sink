"""
UrbanFlow AI - SQLite Database Seeder (AGENT_4 | Mansi)
Directory: /packages/database
"""

import os
import sqlite3
import sys
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Ensure local package import works whether run directly or as a module
sys.path.insert(0, str(Path(__file__).parent))
try:
    from db import get_db_path
except ImportError:
    def get_db_path() -> str:
        return os.getenv("DB_PATH", str((Path(__file__).parent / "urbanflow.db").resolve()))


# Mock Hyderabad Road Network Nodes (minimum 10)
# Real-ish coordinates around Hyderabad (17.3850° N, 78.4867° E)
MOCK_NODES = [
    {
        "node_id": "node_hitec_city",
        "lat": 17.4504,
        "lng": 78.3808,
        "name": "Hitec City"
    },
    {
        "node_id": "node_madhapur",
        "lat": 17.4483,
        "lng": 78.3915,
        "name": "Madhapur"
    },
    {
        "node_id": "node_gachibowli",
        "lat": 17.4401,
        "lng": 78.3489,
        "name": "Gachibowli"
    },
    {
        "node_id": "node_jubilee_hills",
        "lat": 17.4319,
        "lng": 78.4073,
        "name": "Jubilee Hills"
    },
    {
        "node_id": "node_banjara_hills",
        "lat": 17.4156,
        "lng": 78.4350,
        "name": "Banjara Hills"
    },
    {
        "node_id": "node_kondapur",
        "lat": 17.4699,
        "lng": 78.3578,
        "name": "Kondapur"
    },
    {
        "node_id": "node_financial_district",
        "lat": 17.4152,
        "lng": 78.3427,
        "name": "Financial District"
    },
    {
        "node_id": "node_panjagutta",
        "lat": 17.4265,
        "lng": 78.4526,
        "name": "Panjagutta"
    },
    {
        "node_id": "node_ameerpet",
        "lat": 17.4375,
        "lng": 78.4483,
        "name": "Ameerpet"
    },
    {
        "node_id": "node_secunderabad",
        "lat": 17.4344,
        "lng": 78.5017,
        "name": "Secunderabad"
    },
    {
        "node_id": "node_charminar",
        "lat": 17.3616,
        "lng": 78.4747,
        "name": "Charminar"
    },
    {
        "node_id": "node_begumpet",
        "lat": 17.4448,
        "lng": 78.4682,
        "name": "Begumpet"
    },
    {
        "node_id": "node_durgam_cheruvu",
        "lat": 17.4358,
        "lng": 78.3892,
        "name": "Durgam Cheruvu"
    },
    {
        "node_id": "node_kukatpally",
        "lat": 17.4938,
        "lng": 78.4018,
        "name": "Kukatpally"
    },
]

# Mock Hyderabad Road Network Edges (minimum 15, varied base_weights 2.0 to 15.0 minutes)
MOCK_EDGES = [
    {
        "edge_id": "edge_hitec_madhapur",
        "from_node": "node_hitec_city",
        "to_node": "node_madhapur",
        "base_weight": 3.5,
    },
    {
        "edge_id": "edge_madhapur_durgam",
        "from_node": "node_madhapur",
        "to_node": "node_durgam_cheruvu",
        "base_weight": 2.5,
    },
    {
        "edge_id": "edge_durgam_jubilee",
        "from_node": "node_durgam_cheruvu",
        "to_node": "node_jubilee_hills",
        "base_weight": 5.0,
    },
    {
        "edge_id": "edge_jubilee_banjara",
        "from_node": "node_jubilee_hills",
        "to_node": "node_banjara_hills",
        "base_weight": 6.5,
    },
    {
        "edge_id": "edge_banjara_panjagutta",
        "from_node": "node_banjara_hills",
        "to_node": "node_panjagutta",
        "base_weight": 4.5,
    },
    {
        "edge_id": "edge_panjagutta_ameerpet",
        "from_node": "node_panjagutta",
        "to_node": "node_ameerpet",
        "base_weight": 3.0,
    },
    {
        "edge_id": "edge_ameerpet_begumpet",
        "from_node": "node_ameerpet",
        "to_node": "node_begumpet",
        "base_weight": 4.0,
    },
    {
        "edge_id": "edge_begumpet_secunderabad",
        "from_node": "node_begumpet",
        "to_node": "node_secunderabad",
        "base_weight": 8.5,
    },
    {
        "edge_id": "edge_gachibowli_hitec",
        "from_node": "node_gachibowli",
        "to_node": "node_hitec_city",
        "base_weight": 6.0,
    },
    {
        "edge_id": "edge_gachibowli_financial",
        "from_node": "node_gachibowli",
        "to_node": "node_financial_district",
        "base_weight": 3.5,
    },
    {
        "edge_id": "edge_kondapur_hitec",
        "from_node": "node_kondapur",
        "to_node": "node_hitec_city",
        "base_weight": 5.5,
    },
    {
        "edge_id": "edge_kukatpally_hitec",
        "from_node": "node_kukatpally",
        "to_node": "node_hitec_city",
        "base_weight": 11.5,
    },
    {
        "edge_id": "edge_kukatpally_ameerpet",
        "from_node": "node_kukatpally",
        "to_node": "node_ameerpet",
        "base_weight": 12.0,
    },
    {
        "edge_id": "edge_panjagutta_charminar",
        "from_node": "node_panjagutta",
        "to_node": "node_charminar",
        "base_weight": 14.0,
    },
    {
        "edge_id": "edge_banjara_charminar",
        "from_node": "node_banjara_hills",
        "to_node": "node_charminar",
        "base_weight": 13.5,
    },
    {
        "edge_id": "edge_financial_jubilee",
        "from_node": "node_financial_district",
        "to_node": "node_jubilee_hills",
        "base_weight": 10.0,
    },
    {
        "edge_id": "edge_madhapur_gachibowli",
        "from_node": "node_madhapur",
        "to_node": "node_gachibowli",
        "base_weight": 7.0,
    },
    {
        "edge_id": "edge_secunderabad_charminar",
        "from_node": "node_secunderabad",
        "to_node": "node_charminar",
        "base_weight": 15.0,
    },
    {
        "edge_id": "edge_kondapur_gachibowli",
        "from_node": "node_kondapur",
        "to_node": "node_gachibowli",
        "base_weight": 7.5,
    },
    {
        "edge_id": "edge_jubilee_ameerpet",
        "from_node": "node_jubilee_hills",
        "to_node": "node_ameerpet",
        "base_weight": 6.0,
    },
]


def create_schema(conn: sqlite3.Connection) -> None:
    """
    Drops and recreates all 3 tables: nodes, edges, incidents.
    """
    cursor = conn.cursor()
    # Drop in dependency order
    cursor.execute("DROP TABLE IF EXISTS incidents;")
    cursor.execute("DROP TABLE IF EXISTS edges;")
    cursor.execute("DROP TABLE IF EXISTS nodes;")

    cursor.execute(
        """
        CREATE TABLE nodes (
            node_id TEXT PRIMARY KEY,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            name TEXT NOT NULL
        );
        """
    )

    cursor.execute(
        """
        CREATE TABLE edges (
            edge_id TEXT PRIMARY KEY,
            from_node TEXT NOT NULL,
            to_node TEXT NOT NULL,
            base_weight REAL NOT NULL,
            congestion_score REAL DEFAULT 0.0,
            is_blocked INTEGER DEFAULT 0,
            effective_weight REAL NOT NULL,
            FOREIGN KEY (from_node) REFERENCES nodes(node_id) ON DELETE CASCADE,
            FOREIGN KEY (to_node) REFERENCES nodes(node_id) ON DELETE CASCADE
        );
        """
    )

    cursor.execute(
        """
        CREATE TABLE incidents (
            incident_id TEXT PRIMARY KEY,
            edge_id TEXT NOT NULL,
            type TEXT NOT NULL,
            severity TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            resolved INTEGER DEFAULT 0,
            FOREIGN KEY (edge_id) REFERENCES edges(edge_id) ON DELETE CASCADE
        );
        """
    )
    conn.commit()


def seed_mock_data(conn: sqlite3.Connection) -> None:
    """
    Inserts mock nodes and edges into the database.
    """
    cursor = conn.cursor()

    # Insert Nodes
    for node in MOCK_NODES:
        cursor.execute(
            """
            INSERT INTO nodes (node_id, lat, lng, name)
            VALUES (?, ?, ?, ?);
            """,
            (node["node_id"], node["lat"], node["lng"], node["name"])
        )

    # Insert Edges:
    # Set effective_weight equal to base_weight initially.
    # Set all congestion_score to 0.0 and is_blocked to 0.
    for edge in MOCK_EDGES:
        cursor.execute(
            """
            INSERT INTO edges (edge_id, from_node, to_node, base_weight, congestion_score, is_blocked, effective_weight)
            VALUES (?, ?, ?, ?, 0.0, 0, ?);
            """,
            (
                edge["edge_id"],
                edge["from_node"],
                edge["to_node"],
                edge["base_weight"],
                edge["base_weight"]  # effective_weight = base_weight
            )
        )

    conn.commit()


def seed(db_path: Optional[str] = None) -> None:
    """
    Main entry point for database seeding.
    Drops and recreates all tables, then inserts mock Hyderabad network.
    """
    target = db_path or get_db_path()
    parent = Path(target).parent
    if parent and not parent.exists():
        parent.mkdir(parents=True, exist_ok=True)

    print(f"[*] Initializing and seeding UrbanFlow AI SQLite database at: {target}")
    conn = sqlite3.connect(target)
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        create_schema(conn)
        seed_mock_data(conn)
        print(f"[✓] Seeding complete: {len(MOCK_NODES)} nodes, {len(MOCK_EDGES)} edges inserted into {target}")
    finally:
        conn.close()


if __name__ == "__main__":
    seed()
