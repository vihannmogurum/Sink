# UrbanFlow AI - Database Package (`/packages/database`)

**Agent Owner:** `AGENT_4` (Mansi)  
**Assigned Ports:** `5432 / 6379` (Persistent SQLite Data Layer)  
**Database File:** `urbanflow.db`

---

## 1. Schema Overview

### `nodes` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `node_id` | `TEXT` | `PRIMARY KEY` | Unique node identifier (e.g. `node_hitec_city`) |
| `lat` | `REAL` | `NOT NULL` | Latitude coordinate |
| `lng` | `REAL` | `NOT NULL` | Longitude coordinate |
| `name` | `TEXT` | `NOT NULL` | Landmark name (e.g. `Hitec City`) |

### `edges` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `edge_id` | `TEXT` | `PRIMARY KEY` | Unique edge identifier (e.g. `edge_hitec_madhapur`) |
| `from_node` | `TEXT` | `REFERENCES nodes(node_id)` | Source node |
| `to_node` | `TEXT` | `REFERENCES nodes(node_id)` | Destination node |
| `base_weight` | `REAL` | `NOT NULL` | Normal traversal time in minutes (2.0 - 15.0) |
| `congestion_score` | `REAL` | `DEFAULT 0.0` | Current congestion factor (0.0 = free flow) |
| `is_blocked` | `INTEGER` | `DEFAULT 0` | 0 = open, 1 = blocked |
| `effective_weight` | `REAL` | `NOT NULL` | Active weight: `base_weight * (1 + congestion_score)` or `999999` if blocked |

### `incidents` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `incident_id` | `TEXT` | `PRIMARY KEY` | Unique incident identifier |
| `edge_id` | `TEXT` | `REFERENCES edges(edge_id)` | Affected edge |
| `type` | `TEXT` | `NOT NULL` | `accident`, `blockage`, or `congestion_spike` |
| `severity` | `TEXT` | `NOT NULL` | `low`, `medium`, or `high` |
| `timestamp` | `TEXT` | `NOT NULL` | ISO-8601 UTC timestamp |
| `resolved` | `INTEGER` | `DEFAULT 0` | 0 = active, 1 = resolved |

---

## 2. Mock Hyderabad Road Network

Seeded with 14 real Hyderabad landmark nodes and 20 connected road edges:
- **Landmarks:** Hitec City, Madhapur, Gachibowli, Jubilee Hills, Banjara Hills, Kondapur, Financial District, Panjagutta, Ameerpet, Secunderabad, Charminar, Begumpet, Durgam Cheruvu, Kukatpally.
- **Base Weights:** 2.0 to 15.0 minutes.

---

## 3. Python API (`db.py`)

- `get_all_nodes() -> list[dict]`
- `get_all_edges() -> list[dict]`
- `update_edge_congestion(edge_id, congestion_score) -> dict`
- `set_edge_blocked(edge_id, is_blocked) -> dict`
- `log_incident(incident_id, edge_id, type, severity) -> dict`
- `resolve_incident(incident_id) -> dict`

---

## 4. Reset & Seed

Run from repo root or package folder:
```bash
python packages/database/seed.py
```
Or with custom database location:
```bash
DB_PATH=/path/to/db.sqlite python packages/database/seed.py
```
