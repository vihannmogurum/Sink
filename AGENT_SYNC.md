# Sink — Multi-Agent Synchronization Blackboard

> This file is the shared source of truth. Update the relevant table before changing a shared contract, and append every synchronization or breaking-change entry to the log.

## Project “Sink” Spec & Architecture Snapshot

| Item | Current Definition |
|---|---|
| Core Problem | `Autonomous Urban Traffic & Emergency Preemption Grid Orchestration` |
| Primary User Flow | `Live Telemetry Vector Map -> Origin-Destination Route Search -> Real-Time Incident Ingestion & Emergency Green-Wave Override` |
| System Stack | `Vite + React 19 + TypeScript + Tailwind CSS (Port 3000), FastAPI + WebSocket + NetworkX (Port 8000), AI Engine (Port 8001), SQLite/Postgres (Port 5432)` |

## 5-Teammate & Agent Ownership Matrix

| Agent ID | Teammate | Owned Directory | Assigned Port | Current Task | Status (IDLE / IN_PROGRESS / BLOCKED / READY) |
|---|---|---|---|---|---|
| `AGENT_1` | Rohith | `/frontend` | `3000` | `Full frontend AppShell, Leaflet canvas, dynamic dispatch mode, Hyderabad & SF/Seattle topologies` | `READY` |
| `AGENT_2` | Vihann | `/apps/api` | `8000` | `API gateway, WebSocket, Dijkstra routing, emergency preemption` | `IN_PROGRESS` |
| `AGENT_3` | Madhu | `/packages/ai-engine` | `8001` | `[TBD]` | `IDLE` |
| `AGENT_4` | Mansi | `/packages/database` | `5432 / 6379` | `SQLite data layer (urbanflow.db, seed.py, db.py)` | `READY` |
| `AGENT_5` | Shloka | `/packages/shared` & `/src/integrations` | `3001` | `[TBD]` | `IDLE` |

## Active Module Locks

| Directory / Module | Owner Agent | Lock Status | Authorized Collaborators | Notes |
|---|---|---|---|---|
| `/frontend` | `AGENT_1` | `LOCKED` | `AGENT_1` (Rohith) | Locked to Port 3000. Setup Vite + React + TS + Tailwind + AppShell + Leaflet |
| `/apps/api` | `AGENT_2` | `LOCKED` | `AGENT_2` (Vihann) | FastAPI gateway, routing engine, and live WebSocket broadcaster on Port 8000 |
| `/packages/database` | `AGENT_4` | `LOCKED` | `AGENT_4` (Mansi) | SQLite schema (nodes, edges, incidents), mock Hyderabad seeder, db.py functions |

## Canonical Contracts

### Entity Schemas

#### SQLite Relational Schema (`urbanflow.db` - AGENT_4)

```sql
-- nodes table
CREATE TABLE nodes (
    node_id TEXT PRIMARY KEY,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    name TEXT NOT NULL
);

-- edges table
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

-- incidents table
CREATE TABLE incidents (
    incident_id TEXT PRIMARY KEY,
    edge_id TEXT NOT NULL,
    type TEXT NOT NULL, -- accident | blockage | congestion_spike
    severity TEXT NOT NULL, -- low | medium | high
    timestamp TEXT NOT NULL, -- ISO-8601
    resolved INTEGER DEFAULT 0,
    FOREIGN KEY (edge_id) REFERENCES edges(edge_id) ON DELETE CASCADE
);
```

### WebSocket / Event Channels

```json
{
  "event_name": {
    "channel": "string",
    "direction": "client_to_server | server_to_client",
    "payload": {}
  }
}
```

| Event | Channel | Direction | Payload |
|---|---|---|---|
| `route_recalculated` | `/ws/live` | `server_to_client` | `{ "route": ["string"], "total_weight": "float", "reason": "string" }` |
| `emergency_override` | `/ws/live` | `server_to_client` | `{ "route": ["string"], "total_weight": "float", "reason": "string" }` |
| `incident_detected` | `/ws/live` | `server_to_client` | `{ "edge_id": "string", "type": "string", "severity": "string" }` |

## Live API Endpoint Registry

| Owner Agent | Method | Route | Request Body / Params | Response Data Shape | Status (MOCK / LIVE) |
|---|---|---|---|---|---|
| `AGENT_2` | `GET` | `/graph` | None | `{ "nodes": [object], "edges": [object] }` | `LIVE` |
| `AGENT_2` | `POST` | `/routes/compute` | `{ "from": "string", "to": "string", "priority": "normal \| emergency" }` | `{ "route": ["string"], "total_weight": "float", "reason": "string" }` | `LIVE` |
| `AGENT_2` | `GET` | `/routes/{vehicle_id}` | `vehicle_id: string` | `{ "route": ["string"], "total_weight": "float" }` | `LIVE` |
| `AGENT_2` | `POST` | `/internal/incident` | `{ "edge_id": "string", "type": "string", "severity": "string" }` | `{ "edge_id": "string", "type": "string", "severity": "string" }` | `LIVE` |
| `AGENT_2` | `WS` | `/ws/live` | None | Events: `route_recalculated`, `emergency_override`, `incident_detected` | `LIVE` |
| `AGENT_1` | `GET` | `/api/v1/graph` | none | `{ grid_id, city, timestamp, nodes: [], edges: [] }` | `MOCK / FALLBACK` |
| `AGENT_1` | `POST` | `/api/v1/incident/inject` | `{ edge_id, type, severity, notes? }` | `{ incident_id, status }` | `MOCK / FALLBACK` |
| `AGENT_1` | `POST` | `/api/v1/emergency/dispatch` | `{ origin_node_id, destination_node_id, priority_tier, vehicle_type }` | `{ dispatch_id, clear_corridor_active }` | `MOCK / FALLBACK` |

## Environment Variables Registry (`.env.example` mirror)

| Variable Name | Owner Agent | Required By | Description/Default Local Value |
|---|---|---|---|
| `DB_PATH` | `AGENT_4` | `AGENT_4`, `AGENT_2` | SQLite Database file path (`./urbanflow.db`) |
| `VITE_API_BASE_URL` | `AGENT_1` | `AGENT_1` | REST Base URL (`http://localhost:8000`) |
| `VITE_WS_URL` | `AGENT_1` | `AGENT_1` | WebSocket URL (`ws://localhost:8000/ws/live`) |
| `API_PORT` | `AGENT_2` | `/apps/api` | `8000` |
| `AI_ENGINE_PORT` | `AGENT_2` | `/apps/api` | `8001` |
| `AGENT5_URL` | `AGENT_2` | `/apps/api` | `http://localhost:3001` |

## Chronological Sync & Breaking-Change Log (Append-Only at Top)

- [2026-11-13 11:25] [AGENT_1] Merged backend from main: Integrated AGENT_2 `/apps/api` routes (`/routes/compute`, `/ws/live`, `/internal/incident`, `/graph`) with frontend HUD dispatch and emergency preemption on Port 3000.
- [2026-11-13 11:05] [AGENT_4] Status: READY; module: /packages/database; task: Initialized SQLite schema (nodes, edges, incidents), seeded mock Hyderabad road network (14 nodes, 20 edges), and implemented db.py and seed.py.
- [2026-11-13 10:55] [AGENT_4] Status: IN_PROGRESS; module: /packages/database; task: Setting up SQLite schema, seed data, and db.py module.
- [2026-11-13 09:40] [AGENT_2] Status: IN_PROGRESS; module: /apps/api; task: API gateway, WebSocket, Dijkstra routing, emergency preemption.
- [2026-11-13 01:50] [AGENT_1] Endpoint & Contract Sync: Defined strict Zod schemas (`graph_topology`, `telemetry_tick`, `forecast_update`, `agent_decision`) and implemented `fetchGraph`, `injectIncident`, `dispatchEmergency`, `useSinkSocket` with zero-hardcoded mock failover engine on Port 3000.
- [2026-11-13 01:45] [AGENT_1] Status: READY; module: /frontend; task: Initialized foundational architecture (Vite, React 19, TS, Tailwind CSS, react-router-dom SaaS routes, AppShell, Sidebar, Topbar, DebugRouter, 404 Catch-All, and Button/Card/Input components on port 3000).
- [2026-11-12 22:45] [ORCHESTRATOR] Initialized the five-agent synchronization protocol, ownership matrix, canonical contract templates, registries, and onboarding pointers.

## Update Templates

### Status Update

```text
- [YYYY-MM-DD HH:MM] [AGENT_X] Status: <IDLE | IN_PROGRESS | BLOCKED | READY>; module: <module>; task: <task>.
```

### Endpoint Update

```text
- [YYYY-MM-DD HH:MM] [AGENT_X] Endpoint: <METHOD> <ROUTE>; request: <shape>; response: <shape>; status: <MOCK | LIVE>.
```

### Breaking-Change Update

```text
- [YYYY-MM-DD HH:MM] [AGENT_X] BREAKING CHANGE: <contract>; old: <old value>; new: <new value>; migration: <required action>; authorized by: <agent>.
```
