# Sink Multi-Agent Protocol

**YOU ARE ONE OF 5 PARALLEL AI AGENTS WORKING ON PROJECT 'SINK'. DO NOT WRITE, REFACTOR, OR DELETE ANY CODE UNTIL YOU HAVE READ BOTH `AGENTS.md` AND `AGENT_SYNC.md` IN FULL.**

All 5 agents operate through Antigravity (AGY) and Claude Code. `AGENTS.md` and `AGENT_SYNC.md` are the single source of truth for every agent.

## 5-Agent Execution Loop (Mandatory)

1. **Pre-Flight:** Before starting any user prompt, run `git pull --rebase` and read `AGENT_SYNC.md` to check active module locks, port assignments, and canonical schemas.
2. **Territory Lock:** Identify which of the 5 Agent Roles (`AGENT_1` through `AGENT_5`) your human operator is assigned to. NEVER modify files outside your assigned directory without explicit cross-module authorization logged in `AGENT_SYNC.md`.
3. **Zero Unilateral Mutation:** Never invent or rename a shared JSON key, API endpoint, WebSocket event, Redis channel, or DB column on your own. If a contract needs to change, update `AGENT_SYNC.md` under `Canonical Contracts` FIRST, then implement.
4. **Post-Flight:** After completing a feature or modifying any interface, update `AGENT_SYNC.md` (status, endpoints, env vars, and changelog), then commit using the strict format `[AGENT_X | Module] <concise summary>` and push.

## Strict Territory & Directory Isolation

| Agent Role | Teammate | Owned Directory | Scope |
|---|---|---|---|
| `AGENT_1` | Rohith | `/apps/web` | UI, State, Client Routing |
| `AGENT_2` | Vihann | `/apps/api` | Core REST/WebSocket Server, Controllers |
| `AGENT_3` | Madhu | `/packages/ai-engine` | LLM/ML Pipelines, Workers, External APIs |
| `AGENT_4` | Mansi | `/packages/database` | Schemas, Migrations, Cache/Redis, Auth |
| `AGENT_5` | Shloka | `/packages/shared` & `/src/integrations` | Shared Types, Realtime Events, QA/DevOps, UI Components |

These role/module mappings are easy to swap once the team locks final tasks. NEVER modify another agent's territory without explicit cross-module authorization logged in `AGENT_SYNC.md`.

## Universal Code & Contract Standards

- Use `snake_case` across all JSON requests, responses, and WebSocket events.
- Every REST response MUST follow this envelope:

  ```json
  { "success": true, "data": null, "error": { "code": "string", "message": "string" } }
  ```

- Do not hardcode URLs, ports, or API keys. Read configuration from environment variables and document it in `.env.example` and `AGENT_SYNC.md`.
- Treat `AGENT_SYNC.md` as the shared source of truth for locks, ports, schemas, endpoints, environment variables, and breaking changes.
