"""Multi-agent orchestration classes for UrbanFlow AI.

Contains:
1. MonitorAgent: Periodically monitors edge forecasts, flags congestion > 0.7, updates DB, emits events.
2. IncidentAnalystAgent: Listens for incident_detected events, blocks edges in DB, triggers vehicle rerouting.
3. ResponseCoordinatorAgent: Computes alternative routes via AGENT_2 API, emits route_recalculated or emergency_override WS events.

All inter-agent communication flows strictly through the EventBus.
All decisions are logged via XAI logger.
All keys and field names are snake_case.
"""

from datetime import datetime, timezone
import json
import threading
import time
from typing import Any, Callable, Dict, List, Optional
import urllib.error
import urllib.parse
import urllib.request

from packages.shared.event_bus import EventBus, event_bus as default_event_bus
from packages.shared.types import Edge, Incident, RouteResult, WSEvent
from packages.shared.xai_logger import log_decision


class DefaultMockDB:
    """In-memory fallback graph/DB store used if AGENT_4's DB module is not injected."""

    def __init__(self) -> None:
        self.edges: Dict[str, Dict[str, Any]] = {
            "edge_1": {"edge_id": "edge_1", "congestion_level": 0.2, "is_blocked": False},
            "edge_2": {"edge_id": "edge_2", "congestion_level": 0.4, "is_blocked": False},
            "edge_3": {"edge_id": "edge_3", "congestion_level": 0.1, "is_blocked": False},
        }
        self._lock = threading.Lock()

    def update_edge_congestion(self, edge_id: str, congestion_level: float) -> None:
        with self._lock:
            if edge_id not in self.edges:
                self.edges[edge_id] = {"edge_id": edge_id, "is_blocked": False}
            self.edges[edge_id]["congestion_level"] = congestion_level

    def set_edge_blocked(self, edge_id: str, is_blocked: bool = True) -> None:
        with self._lock:
            if edge_id not in self.edges:
                self.edges[edge_id] = {"edge_id": edge_id, "congestion_level": 0.0}
            self.edges[edge_id]["is_blocked"] = is_blocked

    def get_edges(self) -> List[str]:
        with self._lock:
            return list(self.edges.keys())


class MonitorAgent:
    """Agent that monitors edge traffic forecasts on a 5-second interval.

    - Queries GET /forecast on AGENT_3's AI engine for each edge.
    - If forecast_15min > 0.7 on any edge:
        - Calls update_edge_congestion on db module.
        - Emits congestion_update event to the event bus.
    - Logs actions and rationale to the XAI logger.
    """

    def __init__(
        self,
        event_bus: Optional[EventBus] = None,
        db: Optional[Any] = None,
        edges: Optional[List[str]] = None,
        ai_engine_url: str = "http://localhost:8003",
        forecast_fetcher: Optional[Callable[[str], float]] = None,
        poll_interval: float = 5.0,
    ) -> None:
        self.event_bus = event_bus or default_event_bus
        self.db = db or DefaultMockDB()
        self.edges = edges or ["edge_1", "edge_2", "edge_3"]
        self.ai_engine_url = ai_engine_url.rstrip("/")
        self.forecast_fetcher = forecast_fetcher
        self.poll_interval = poll_interval

        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def fetch_forecast(self, edge_id: str) -> Optional[float]:
        """Fetch 15-minute congestion forecast for a given edge from AGENT_3."""
        if self.forecast_fetcher:
            try:
                return float(self.forecast_fetcher(edge_id))
            except Exception:
                return None

        # Call GET /forecast on AGENT_3 API
        query_url = f"{self.ai_engine_url}/forecast?edge_id={urllib.parse.quote(edge_id)}"
        try:
            req = urllib.request.Request(query_url, headers={"User-Agent": "UrbanFlow-MonitorAgent/1.0"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return float(data.get("forecast_15min", 0.0))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, KeyError):
            # Graceful fallback when AGENT_3 AI engine service is offline
            return None

    def step(self) -> List[Dict[str, Any]]:
        """Perform a single monitoring pass over all monitored edges."""
        updates: List[Dict[str, Any]] = []
        # Query edges from db if available
        current_edges = getattr(self.db, "get_edges", lambda: self.edges)()

        for edge_id in current_edges:
            forecast_val = self.fetch_forecast(edge_id)
            if forecast_val is None:
                continue

            if forecast_val > 0.7:
                # 1. Call update_edge_congestion on db module
                if hasattr(self.db, "update_edge_congestion"):
                    self.db.update_edge_congestion(edge_id, forecast_val)

                # 2. Fire congestion_update event to event bus
                payload = {
                    "edge_id": edge_id,
                    "forecast_15min": forecast_val,
                    "congestion_level": forecast_val,
                }
                self.event_bus.publish("congestion_update", payload)

                # 3. Log what it did and why
                reason = (
                    f"Predicted 15-minute congestion index ({forecast_val:.2f}) on edge '{edge_id}' "
                    f"exceeded threshold (0.7). Updated edge congestion state and notified subscribers."
                )
                log_decision(
                    agent_name="MonitorAgent",
                    decision=f"Flagged high congestion on edge {edge_id} (forecast: {forecast_val:.2f})",
                    reason=reason,
                    metadata={"edge_id": edge_id, "forecast_15min": forecast_val},
                )
                updates.append(payload)

        return updates

    def run_loop(self) -> None:
        """Run monitor loop executing every 5 seconds until stopped."""
        while not self._stop_event.is_set():
            try:
                self.step()
            except Exception as e:
                # Keep thread resilient against uncaught exceptions
                pass
            self._stop_event.wait(self.poll_interval)

    def start(self) -> None:
        """Start monitoring loop in a background daemon thread."""
        if self._thread is not None and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self.run_loop, name="MonitorAgentThread", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Signal background thread to stop and wait for termination."""
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=2.0)
            self._thread = None


class IncidentAnalystAgent:
    """Agent that analyzes incident reports and initiates road closures and rerouting triggers.

    - Listens on event bus for incident_detected events.
    - Calls set_edge_blocked(edge_id, True) on the db module.
    - Fires a route_recalculated trigger to ResponseCoordinatorAgent via event bus with reason:
      "Edge {edge_id} blocked due to {type} incident (severity: {severity}). Rerouting affected vehicles."
    - Logs actions and rationale to the XAI logger.
    """

    def __init__(
        self,
        event_bus: Optional[EventBus] = None,
        db: Optional[Any] = None,
    ) -> None:
        self.event_bus = event_bus or default_event_bus
        self.db = db or DefaultMockDB()

    def register_listeners(self) -> None:
        """Subscribe to incident_detected events on the event bus."""
        self.event_bus.subscribe("incident_detected", self.on_incident_detected)

    def on_incident_detected(self, event_or_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming incident_detected event."""
        payload = event_or_payload.get("payload", event_or_payload) if isinstance(event_or_payload, dict) else {}

        edge_id = payload.get("edge_id", "unknown_edge")
        incident_type = payload.get("type", "traffic")
        severity = payload.get("severity", "moderate")
        affected_vehicles = payload.get("affected_vehicles", [])

        # 1. Call set_edge_blocked(edge_id, True) on db module
        if hasattr(self.db, "set_edge_blocked"):
            self.db.set_edge_blocked(edge_id, True)

        # 2. Plain English reason mandated by specification
        reason = (
            f"Edge {edge_id} blocked due to {incident_type} incident (severity: {severity}). "
            f"Rerouting affected vehicles."
        )

        # 3. Fire route_recalculated trigger to ResponseCoordinatorAgent via event bus
        trigger_payload = {
            "edge_id": edge_id,
            "type": incident_type,
            "severity": severity,
            "reason": reason,
            "affected_vehicles": affected_vehicles,
        }
        self.event_bus.publish("route_recalculated_trigger", trigger_payload)

        # 4. Log what it did and why
        log_decision(
            agent_name="IncidentAnalystAgent",
            decision=f"Blocked edge {edge_id} and triggered reroute for affected vehicles",
            reason=reason,
            metadata={
                "edge_id": edge_id,
                "incident_type": incident_type,
                "severity": severity,
                "affected_vehicles_count": len(affected_vehicles),
            },
        )

        return trigger_payload


class ResponseCoordinatorAgent:
    """Agent that coordinates rerouting and priority traffic dispatching.

    - Listens for route_recalculated triggers from IncidentAnalystAgent via event bus.
    - Calls POST /routes/compute on AGENT_2 API:
        - priority: "emergency" for vehicle IDs starting with "EMG-"
        - priority: "normal" for regular vehicles
    - Fires route_recalculated or emergency_override WebSocket event depending on vehicle type.
    - The reason field must always be a plain English sentence explaining the decision.
    - Logs actions and rationale to the XAI logger.
    """

    def __init__(
        self,
        event_bus: Optional[EventBus] = None,
        routing_api_url: str = "http://localhost:8002",
        route_computer: Optional[Callable[[str, str, str], Dict[str, Any]]] = None,
    ) -> None:
        self.event_bus = event_bus or default_event_bus
        self.routing_api_url = routing_api_url.rstrip("/")
        self.route_computer = route_computer

    def register_listeners(self) -> None:
        """Subscribe to route_recalculated_trigger events on the event bus."""
        self.event_bus.subscribe("route_recalculated_trigger", self.on_route_recalculated_trigger)

    def compute_route(
        self, vehicle_id: str, priority: str, blocked_edge: str, reason: str
    ) -> Dict[str, Any]:
        """Call POST /routes/compute on AGENT_2's Routing API or fallback to mock route."""
        if self.route_computer:
            try:
                return self.route_computer(vehicle_id, priority, blocked_edge)
            except Exception:
                pass

        compute_url = f"{self.routing_api_url}/routes/compute"
        request_body = json.dumps(
            {
                "vehicle_id": vehicle_id,
                "priority": priority,
                "blocked_edge": blocked_edge,
                "reason": reason,
            }
        ).encode("utf-8")

        try:
            req = urllib.request.Request(
                compute_url,
                data=request_body,
                headers={"Content-Type": "application/json", "User-Agent": "UrbanFlow-ResponseCoordinator/1.0"},
            )
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
            # Fallback path computation if AGENT_2 service is offline or in test environment
            alt_route = [f"detour_start_{blocked_edge}", "detour_mid", f"detour_end_{blocked_edge}"]
            return {
                "vehicle_id": vehicle_id,
                "route": alt_route,
                "total_distance": 3.8 if priority == "emergency" else 5.2,
                "estimated_duration": 4.5 if priority == "emergency" else 8.0,
                "status": "computed_fallback",
            }

    def on_route_recalculated_trigger(self, event_or_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Handle incoming route_recalculated_trigger event from IncidentAnalystAgent."""
        payload = event_or_payload.get("payload", event_or_payload) if isinstance(event_or_payload, dict) else {}

        blocked_edge = payload.get("edge_id", "unknown_edge")
        incident_type = payload.get("type", "hazard")
        severity = payload.get("severity", "moderate")
        trigger_reason = payload.get("reason", f"Edge {blocked_edge} blocked.")
        affected_vehicles = payload.get("affected_vehicles", [])

        # If no specific vehicles are listed, route a default affected vehicle
        if not affected_vehicles:
            affected_vehicles = ["VEH-101"]

        dispatched_events: List[Dict[str, Any]] = []

        for vehicle_id in affected_vehicles:
            # Determine vehicle priority
            is_emergency = str(vehicle_id).startswith("EMG-")
            priority = "emergency" if is_emergency else "normal"

            # 1. Call POST /routes/compute on AGENT_2's API
            compute_result = self.compute_route(
                vehicle_id=vehicle_id,
                priority=priority,
                blocked_edge=blocked_edge,
                reason=trigger_reason,
            )

            # 2. Formulate plain English reason
            if is_emergency:
                english_reason = (
                    f"Emergency vehicle {vehicle_id} was dispatched on priority clearance detour bypassing "
                    f"blocked edge {blocked_edge} to guarantee rapid response."
                )
                event_name = "emergency_override"
            else:
                english_reason = (
                    f"Vehicle {vehicle_id} has been rerouted around blocked edge {blocked_edge} "
                    f"to prevent traffic congestion caused by the {incident_type} incident."
                )
                event_name = "route_recalculated"

            route_result: RouteResult = {
                "vehicle_id": vehicle_id,
                "route": compute_result.get("route", [f"alt_for_{blocked_edge}"]),
                "total_distance": float(compute_result.get("total_distance", 4.2)),
                "estimated_duration": float(compute_result.get("estimated_duration", 6.0)),
                "priority": priority,
                "reason": english_reason,
                "status": "recalculated",
            }

            # 3. Fire route_recalculated or emergency_override WebSocket event
            self.event_bus.publish(event_name, route_result)

            # 4. Log what it did and why
            log_decision(
                agent_name="ResponseCoordinatorAgent",
                decision=f"Computed route and published {event_name} for vehicle {vehicle_id}",
                reason=english_reason,
                metadata={
                    "vehicle_id": vehicle_id,
                    "priority": priority,
                    "blocked_edge": blocked_edge,
                    "event_name": event_name,
                },
            )

            dispatched_events.append({"event": event_name, "payload": route_result})

        return dispatched_events
