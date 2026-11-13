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
| `AGENT_3` | Madhu | `/packages/ai-engine` | `8001` | `[TBD]` | `IDLE` |
| `AGENT_4` | Mansi | `/packages/database` | `5432 / 6379` | `[TBD]` | `IDLE` |
| `AGENT_5` | Shloka | `/packages/shared` & `/src/integrations` | `3001` | `Multi-agent orchestration, event bus, shared types, XAI logger` | `READY` |

## Active Module Locks

| Directory / Module | Owner Agent | Lock Status | Authorized Collaborators | Notes |
|---|---|---|---|---|
| `/apps/api` | `AGENT_2` | `LOCKED` | `AGENT_2` | `FastAPI gateway, routing engine, and live WebSocket broadcaster` |

## Canonical Contracts

### Entity Schemas

All shared types are strictly defined in `packages/shared/types.py` with `snake_case` keys:

#### Node
```json
{
  "node_id": "string",
  "name": "string",
  "lat": "float",
  "lng": "float",
  "node_type": "string",
  "connected_edges": ["string"]
}
```

#### Edge
```json
{
  "edge_id": "string",
  "from_node": "string",
  "to_node": "string",
  "length": "float",
  "speed_limit": "float",
  "current_speed": "float",
  "congestion_level": "float",
  "is_blocked": "bool",
  "forecast_15min": "float"
}
```

#### Incident
```json
{
  "incident_id": "string",
  "edge_id": "string",
  "type": "string",
  "severity": "string",
  "description": "string",
  "timestamp": "ISO-8601 string",
  "is_resolved": "bool",
  "affected_vehicles": ["string"]
}
```

#### WSEvent (Envelope)
```json
{
  "event": "string",
  "timestamp": "ISO-8601 string",
  "payload": {}
}
```

#### RouteResult
```json
{
  "vehicle_id": "string",
  "route": ["string"],
  "total_distance": "float",
  "estimated_duration": "float",
  "priority": "normal | emergency",
  "reason": "string",
  "status": "string"
}
```

### WebSocket / Event Channels

```json
{
  "event_name": {
    "channel": "string",
    "direction": "client_to_server | server_to_client | agent_to_agent",
    "payload": {}
  }
}
```

| Event | Channel | Direction | Payload |
|---|---|---|---|
| `route_recalculated` | `/ws/live` | `server_to_client` | `{ "vehicle_id": "string", "route": ["string"], "total_distance": "float", "estimated_duration": "float", "priority": "string", "reason": "string", "status": "string" }` |
| `emergency_override` | `/ws/live` | `server_to_client` | `{ "vehicle_id": "string", "route": ["string"], "total_distance": "float", "estimated_duration": "float", "priority": "emergency", "reason": "string", "status": "string" }` |
| `incident_detected` | `/ws/live` | `server_to_client` | `{ "edge_id": "string", "type": "string", "severity": "string", "affected_vehicles": ["string"] }` |
| `congestion_update` | `/ws/live` | `server_to_client` | `{ "edge_id": "string", "forecast_15min": "float", "congestion_level": "float" }` |
| `route_recalculated_trigger` | `internal` | `agent_to_agent` | `{ "edge_id": "string", "type": "string", "severity": "string", "reason": "string", "affected_vehicles": ["string"] }` |

## Live API Endpoint Registry

| Owner Agent | Method | Route | Request Body / Params | Response Data Shape | Status (MOCK / LIVE) |
|---|---|---|---|---|---|
| `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` | `MOCK` |
| `AGENT_2` | `GET` | `/graph` | None | `{ "nodes": [object], "edges": [object] }` | `LIVE` |
| `AGENT_2` | `POST` | `/routes/compute` | `{ "from": "string", "to": "string", "priority": "normal | emergency" }` | `{ "route": ["string"], "total_weight": "float", "reason": "string" }` | `LIVE` |
| `AGENT_2` | `GET` | `/routes/{vehicle_id}` | `vehicle_id: string` | `{ "route": ["string"], "total_weight": "float" }` | `LIVE` |
| `AGENT_2` | `POST` | `/internal/incident` | `{ "edge_id": "string", "type": "string", "severity": "string" }` | `{ "edge_id": "string", "type": "string", "severity": "string" }` | `LIVE` |

## Environment Variables Registry (`.env.example` mirror)

| Variable Name | Owner Agent | Required By | Description/Default Local Value |
|---|---|---|---|
| `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` |
| `API_PORT` | `AGENT_2` | `/apps/api` | `8000` |
| `AI_ENGINE_PORT` | `AGENT_2` | `/apps/api` | `8001` |
| `DB_PATH` | `AGENT_2` | `/apps/api`, `/packages/database` | `./urbanflow.db` |
| `AGENT5_URL` | `AGENT_2` | `/apps/api` | `http://localhost:3001` |

## Chronological Sync & Breaking-Change Log (Append-Only at Top)

- [2026-11-13 11:05] [AGENT_5] Status: READY; module: /packages/shared, /src/integrations; task: Multi-agent orchestration, event bus, shared types, XAI logger.
- [2026-11-13 10:30] [AGENT_5] Status: IN_PROGRESS; module: /packages/shared, /src/integrations; task: Multi-agent orchestration, event bus, shared types, XAI logger.
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
