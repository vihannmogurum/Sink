"""Multi-agent coordinator and FastAPI startup runner for UrbanFlow AI.

Instantiates all 3 agents:
- MonitorAgent
- IncidentAnalystAgent
- ResponseCoordinatorAgent

Wires up event listeners and provides start() / stop() hooks for AGENT_2's FastAPI app.
"""

from typing import Any, Dict, Optional
import logging

from packages.shared.agents import IncidentAnalystAgent, MonitorAgent, ResponseCoordinatorAgent
from packages.shared.event_bus import EventBus, event_bus as shared_event_bus

logger = logging.getLogger("UrbanFlow.AgentRunner")

# Global instances of the three agents
event_bus: EventBus = shared_event_bus
monitor_agent: MonitorAgent = MonitorAgent(event_bus=event_bus)
incident_analyst_agent: IncidentAnalystAgent = IncidentAnalystAgent(event_bus=event_bus)
response_coordinator_agent: ResponseCoordinatorAgent = ResponseCoordinatorAgent(event_bus=event_bus)

_is_started: bool = False


def wire_agents(bus: Optional[EventBus] = None) -> None:
    """Wire up IncidentAnalystAgent and ResponseCoordinatorAgent to the event bus."""
    target_bus = bus or event_bus
    incident_analyst_agent.event_bus = target_bus
    response_coordinator_agent.event_bus = target_bus
    monitor_agent.event_bus = target_bus

    # Register event listeners
    target_bus.subscribe("incident_detected", incident_analyst_agent.on_incident_detected)
    target_bus.subscribe("route_recalculated_trigger", response_coordinator_agent.on_route_recalculated_trigger)
    logger.info("IncidentAnalystAgent and ResponseCoordinatorAgent wired to event bus.")


def start(
    bus: Optional[EventBus] = None,
    db: Optional[Any] = None,
    poll_interval: Optional[float] = None,
) -> Dict[str, Any]:
    """Start the multi-agent system.

    Called by AGENT_2's FastAPI app on startup (e.g. @app.on_event("startup")).
    - Wires listeners on the event bus
    - Injects optional db reference if provided
    - Starts the MonitorAgent loop in a background daemon thread
    """
    global _is_started, event_bus
    if _is_started:
        return get_runner_state()

    if bus is not None:
        event_bus = bus

    if db is not None:
        monitor_agent.db = db
        incident_analyst_agent.db = db

    if poll_interval is not None:
        monitor_agent.poll_interval = poll_interval

    # 1. Wire up IncidentAnalystAgent and ResponseCoordinatorAgent to the event bus
    wire_agents(event_bus)

    # 2. Start MonitorAgent in a background thread
    monitor_agent.start()

    _is_started = True
    logger.info("UrbanFlow multi-agent system successfully started.")
    return get_runner_state()


def stop() -> Dict[str, Any]:
    """Stop the multi-agent system gracefully during application shutdown."""
    global _is_started
    if not _is_started:
        return get_runner_state()

    # Stop MonitorAgent background loop
    monitor_agent.stop()

    _is_started = False
    logger.info("UrbanFlow multi-agent system stopped.")
    return get_runner_state()


def get_runner_state() -> Dict[str, Any]:
    """Return live status of the multi-agent runner."""
    return {
        "is_running": _is_started,
        "monitor_agent_alive": monitor_agent._thread.is_alive() if monitor_agent._thread else False,
        "agents": {
            "monitor_agent": "active" if _is_started else "idle",
            "incident_analyst_agent": "listening",
            "response_coordinator_agent": "listening",
        },
    }
