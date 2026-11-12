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
| `AGENT_2` | Vihann | `/apps/api` | `8000` | `[TBD]` | `IDLE` |
| `AGENT_3` | Madhu | `/packages/ai-engine` | `8001` | `[TBD]` | `IDLE` |
| `AGENT_4` | Mansi | `/packages/database` | `5432 / 6379` | `[TBD]` | `IDLE` |
| `AGENT_5` | Shloka | `/packages/shared` & `/src/integrations` | `3001` | `[TBD]` | `IDLE` |

## Active Module Locks

| Directory / Module | Owner Agent | Lock Status | Authorized Collaborators | Notes |
|---|---|---|---|---|
| `[TBD]` | `[TBD]` | `UNLOCKED` | `[TBD]` | `[TBD]` |

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

## Live API Endpoint Registry

| Owner Agent | Method | Route | Request Body / Params | Response Data Shape | Status (MOCK / LIVE) |
|---|---|---|---|---|---|
| `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` | `MOCK` |

## Environment Variables Registry (`.env.example` mirror)

| Variable Name | Owner Agent | Required By | Description/Default Local Value |
|---|---|---|---|
| `[TBD]` | `[TBD]` | `[TBD]` | `[TBD]` |

## Chronological Sync & Breaking-Change Log (Append-Only at Top)

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
