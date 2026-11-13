# Sink — Multi-Agent Synchronization Blackboard

> This file is the shared source of truth. Update the relevant table before changing a shared contract, and append every synchronization or breaking-change entry to the log.

## Project “Sink” Spec & Architecture Snapshot

| Item | Current Definition |
|---|---|
| Core Problem | `[TBD - FILL BEFORE CODING]` |
| Primary User Flow | `[TBD - FILL BEFORE CODING]` |
| System Stack | `[TBD - FILL BEFORE CODING]` |

## 5-Teammate & Agent Ownership Matrix

| Agent ID | Teammate | Owned Directory | Assigned Port | Current Task | Status (IDLE / IN_PROGRESS / BLOCKED / READY) |
|---|---|---|---|---|---|
| `AGENT_1` | Rohith | `/apps/web` | `3000` | `[TBD]` | `IDLE` |
| `AGENT_2` | Vihann | `/apps/api` | `8000` | `API gateway, WebSocket, Dijkstra routing, emergency preemption` | `IN_PROGRESS` |
| `AGENT_3` | Madhu | `/packages/ai-engine` | `8001` | `Congestion forecasting, incident CV/sensor detection, adaptive Dijkstra/A* routing, multi-agent XAI` | `IN_PROGRESS` |
| `AGENT_4` | Mansi | `/packages/database` | `5432 / 6379` | `[TBD]` | `IDLE` |
| `AGENT_5` | Shloka | `/packages/shared` & `/src/integrations` | `3001` | `[TBD]` | `IDLE` |

## Active Module Locks

| Directory / Module | Owner Agent | Lock Status | Authorized Collaborators | Notes |
|---|---|---|---|---|
| `/apps/api` | `AGENT_2` | `LOCKED` | `AGENT_2` | `FastAPI gateway, routing engine, and live WebSocket broadcaster` |
| `/packages/ai-engine` | `AGENT_3` | `LOCKED` | `AGENT_3` | `Traffic forecasting, incident anomaly detection, adaptive A*/Dijkstra routing, multi-agent XAI` |

## Canonical Contracts

### Entity Schemas

```json
{
  "entity_name": {
    "id": "string",
    "created_at": "ISO-8601 datetime",
    "updated_at": "ISO-8601 datetime"
  }
}
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
| `traffic_forecast_updated` | `/ws/live` | `server_to_client` | `{ "horizon_minutes": 15, "forecasts": [object] }` |
| `xai_decision_logged` | `/ws/live` | `server_to_client` | `{ "decision_id": "string", "trigger": "string", "action": "string", "justification": "string" }` |

## Live API Endpoint Registry

| Owner Agent | Method | Route | Request Body / Params | Response Data Shape | Status (MOCK / LIVE) |
|---|---|---|---|---|---|
| `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` | `MOCK` |
| `AGENT_2` | `GET` | `/graph` | None | `{ "nodes": [object], "edges": [object] }` | `LIVE` |
| `AGENT_2` | `POST` | `/routes/compute` | `{ "from": "string", "to": "string", "priority": "normal | emergency" }` | `{ "route": ["string"], "total_weight": "float", "reason": "string" }` | `LIVE` |
| `AGENT_2` | `GET` | `/routes/{vehicle_id}` | `vehicle_id: string` | `{ "route": ["string"], "total_weight": "float" }` | `LIVE` |
| `AGENT_2` | `POST` | `/internal/incident` | `{ "edge_id": "string", "type": "string", "severity": "string" }` | `{ "edge_id": "string", "type": "string", "severity": "string" }` | `LIVE` |
| `AGENT_3` | `GET` | `/health` | None | `{ "status": "healthy", "service": "urbanflow-ai-engine", "port": 8001 }` | `LIVE` |
| `AGENT_3` | `POST` | `/forecast/predict` | `{ "segment_ids": ["string"], "timestamp": "ISO-8601" }` | `{ "forecasts": [object], "horizons": [15, 30] }` | `LIVE` |
| `AGENT_3` | `GET` | `/forecast/segments` | None | `{ "segments": [object] }` | `LIVE` |
| `AGENT_3` | `POST` | `/incidents/detect` | `{ "telemetry": [object] }` | `{ "incidents": [object], "anomalies_detected": int }` | `LIVE` |
| `AGENT_3` | `GET` | `/incidents/active` | None | `{ "active_incidents": [object] }` | `LIVE` |
| `AGENT_3` | `POST` | `/incidents/simulate` | `{ "edge_id": "string", "severity": "string", "incident_type": "string" }` | `{ "incident": object }` | `LIVE` |
| `AGENT_3` | `GET` | `/incidents/cv-analyze` | `camera_id: str, edge_id: str, simulate_incident: bool` | `{ "camera_id": "string", "collision_detected": bool, "detected_objects": [object] }` | `LIVE` |
| `AGENT_3` | `POST` | `/routes/optimize` | `{ "origin": "string", "destination": "string", "algorithm": "astar | dijkstra", "alternatives": int }` | `{ "primary_route": object, "alternative_routes": [object] }` | `LIVE` |
| `AGENT_3` | `POST` | `/routes/emergency-preemption` | `{ "origin": "string", "destination": "string", "vehicle_id": "string", "vehicle_type": "ambulance | fire_truck | police" }` | `{ "corridor": object, "green_wave_actions": [object], "travel_time_saved_pct": float }` | `LIVE` |
| `AGENT_3` | `GET` | `/graph/network` | None | `{ "nodes": [object], "edges": [object] }` | `LIVE` |
| `AGENT_3` | `POST` | `/agents/step` | `{ "simulated_telemetry": [object] }` | `{ "cycle_id": "string", "agent_states": object, "actions_taken": [object], "xai_logs": [object] }` | `LIVE` |
| `AGENT_3` | `GET` | `/agents/xai-logs` | `limit: int = 50` | `{ "logs": [object], "total": int }` | `LIVE` |

## Environment Variables Registry (`.env.example` mirror)

| Variable Name | Owner Agent | Required By | Description/Default Local Value |
|---|---|---|---|
| `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` |
| `API_PORT` | `AGENT_2` | `/apps/api` | `8000` |
| `AI_ENGINE_PORT` | `AGENT_2`, `AGENT_3` | `/apps/api`, `/packages/ai-engine` | `8001` |
| `DB_PATH` | `AGENT_2` | `/apps/api`, `/packages/database` | `./urbanflow.db` |
| `AGENT5_URL` | `AGENT_2` | `/apps/api` | `http://localhost:3001` |

## Chronological Sync & Breaking-Change Log (Append-Only at Top)

- [2026-11-13 11:10] [AGENT_3] Status: IN_PROGRESS; module: /packages/ai-engine; task: Initialized UrbanFlow AI Engine (Forecasting, Anomaly Detection, Dijkstra/A* routing, Multi-Agent XAI).
- [2026-11-13 09:40] [AGENT_2] Status: IN_PROGRESS; module: /apps/api; task: API gateway, WebSocket, Dijkstra routing, emergency preemption.
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
