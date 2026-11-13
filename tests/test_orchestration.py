"""Unit test suite for UrbanFlow AI multi-agent orchestration system."""

import os
import shutil
import tempfile
import time
import unittest

from packages.shared.types import Node, Edge, Incident, WSEvent, RouteResult
from packages.shared.event_bus import EventBus
from packages.shared.xai_logger import log_decision, get_recent_decisions, set_log_path, get_log_path
from packages.shared.agents import (
    MonitorAgent,
    IncidentAnalystAgent,
    ResponseCoordinatorAgent,
    DefaultMockDB,
)
import src.integrations.agent_runner as agent_runner


class TestEventBus(unittest.TestCase):
    """Test pure Python event bus implementation."""

    def setUp(self):
        self.bus = EventBus()

    def test_publish_and_subscribe_envelope(self):
        received_events = []

        def on_test_event(envelope):
            received_events.append(envelope)

        self.bus.subscribe("test_event", on_test_event)
        result = self.bus.publish("test_event", {"key": "value"})

        self.assertEqual(len(received_events), 1)
        event = received_events[0]
        # Verify envelope structure
        self.assertEqual(event["event"], "test_event")
        self.assertIn("timestamp", event)
        self.assertEqual(event["payload"], {"key": "value"})
        self.assertEqual(result, event)

    def test_multiple_subscribers(self):
        counts = [0, 0]

        def sub1(e):
            counts[0] += 1

        def sub2(e):
            counts[1] += 1

        self.bus.subscribe("ping", sub1)
        self.bus.subscribe("ping", sub2)
        self.bus.publish("ping", {"msg": "hello"})

        self.assertEqual(counts[0], 1)
        self.assertEqual(counts[1], 1)

    def test_unsubscribe(self):
        received = []

        def listener(e):
            received.append(e)

        self.bus.subscribe("item", listener)
        self.bus.publish("item", {"v": 1})
        self.bus.unsubscribe("item", listener)
        self.bus.publish("item", {"v": 2})

        self.assertEqual(len(received), 1)
        self.assertEqual(received[0]["payload"]["v"], 1)


class TestSharedTypes(unittest.TestCase):
    """Test Shared Type Definitions and contracts."""

    def test_node_typeddict(self):
        node: Node = {
            "node_id": "N1",
            "name": "Central Crossing",
            "lat": 37.7749,
            "lng": -122.4194,
            "node_type": "intersection",
            "connected_edges": ["E1", "E2"],
        }
        self.assertEqual(node["node_id"], "N1")

    def test_edge_typeddict(self):
        edge: Edge = {
            "edge_id": "E1",
            "from_node": "N1",
            "to_node": "N2",
            "length": 1.5,
            "speed_limit": 50.0,
            "current_speed": 45.0,
            "congestion_level": 0.25,
            "is_blocked": False,
            "forecast_15min": 0.3,
        }
        self.assertEqual(edge["edge_id"], "E1")
        self.assertFalse(edge["is_blocked"])

    def test_incident_typeddict(self):
        incident: Incident = {
            "incident_id": "INC-01",
            "edge_id": "E1",
            "type": "accident",
            "severity": "high",
            "description": "Multi-car collision",
            "timestamp": "2026-11-13T10:00:00Z",
            "is_resolved": False,
            "affected_vehicles": ["VEH-1", "EMG-99"],
        }
        self.assertEqual(incident["severity"], "high")

    def test_wsevent_typeddict(self):
        event: WSEvent = {
            "event": "congestion_update",
            "timestamp": "2026-11-13T10:00:00Z",
            "payload": {"edge_id": "E1", "congestion_level": 0.8},
        }
        self.assertEqual(event["event"], "congestion_update")

    def test_route_result_typeddict(self):
        route: RouteResult = {
            "vehicle_id": "EMG-01",
            "route": ["E3", "E4"],
            "total_distance": 2.1,
            "estimated_duration": 3.0,
            "priority": "emergency",
            "reason": "Emergency vehicle EMG-01 granted priority rerouting.",
            "status": "recalculated",
        }
        self.assertEqual(route["priority"], "emergency")


class TestXAILogger(unittest.TestCase):
    """Test XAI decision logger functions."""

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.log_file = os.path.join(self.test_dir, "test_xai_log.jsonl")
        self.orig_log_path = get_log_path()
        set_log_path(self.log_file)

    def tearDown(self):
        set_log_path(self.orig_log_path)
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_log_and_retrieve_decisions(self):
        # Empty when non-existent
        self.assertEqual(get_recent_decisions(5), [])

        # Log decisions
        log_decision("AgentA", "Decision 1", "Reason 1")
        log_decision("AgentB", "Decision 2", "Reason 2")
        log_decision("AgentC", "Decision 3", "Reason 3")

        recent = get_recent_decisions(2)
        self.assertEqual(len(recent), 2)
        self.assertEqual(recent[0]["agent_name"], "AgentB")
        self.assertEqual(recent[1]["agent_name"], "AgentC")
        self.assertEqual(recent[1]["reason"], "Reason 3")
        self.assertIn("timestamp", recent[1])


class TestMonitorAgent(unittest.TestCase):
    """Test MonitorAgent behavior, thresholds, and logging."""

    def setUp(self):
        self.bus = EventBus()
        self.db = DefaultMockDB()

    def test_forecast_above_threshold_triggers_update(self):
        events = []
        self.bus.subscribe("congestion_update", lambda e: events.append(e))

        forecast_map = {
            "edge_1": 0.65,  # <= 0.7: ignored
            "edge_2": 0.85,  # > 0.7: triggers update
        }

        agent = MonitorAgent(
            event_bus=self.bus,
            db=self.db,
            edges=["edge_1", "edge_2"],
            forecast_fetcher=lambda edge_id: forecast_map.get(edge_id, 0.0),
        )

        updates = agent.step()
        self.assertEqual(len(updates), 1)
        self.assertEqual(updates[0]["edge_id"], "edge_2")
        self.assertEqual(updates[0]["forecast_15min"], 0.85)

        # Verify DB was updated
        self.assertEqual(self.db.edges["edge_2"]["congestion_level"], 0.85)
        self.assertNotEqual(self.db.edges["edge_1"]["congestion_level"], 0.65)

        # Verify event bus received event
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event"], "congestion_update")
        self.assertEqual(events[0]["payload"]["edge_id"], "edge_2")

    def test_forecast_below_threshold_does_not_trigger(self):
        events = []
        self.bus.subscribe("congestion_update", lambda e: events.append(e))

        agent = MonitorAgent(
            event_bus=self.bus,
            db=self.db,
            edges=["edge_1"],
            forecast_fetcher=lambda e: 0.5,
        )

        updates = agent.step()
        self.assertEqual(len(updates), 0)
        self.assertEqual(len(events), 0)


class TestIncidentAnalystAgent(unittest.TestCase):
    """Test IncidentAnalystAgent behavior, DB locking, and trigger firing."""

    def setUp(self):
        self.bus = EventBus()
        self.db = DefaultMockDB()
        self.agent = IncidentAnalystAgent(event_bus=self.bus, db=self.db)
        self.agent.register_listeners()

    def test_incident_detected_blocks_edge_and_triggers_reroute(self):
        triggers = []
        self.bus.subscribe("route_recalculated_trigger", lambda e: triggers.append(e))

        incident_payload = {
            "edge_id": "edge_2",
            "type": "debris",
            "severity": "severe",
            "affected_vehicles": ["VEH-42", "EMG-07"],
        }

        self.bus.publish("incident_detected", incident_payload)

        # Verify edge blocked in DB
        self.assertTrue(self.db.edges["edge_2"]["is_blocked"])

        # Verify trigger event fired
        self.assertEqual(len(triggers), 1)
        trigger = triggers[0]["payload"]
        self.assertEqual(trigger["edge_id"], "edge_2")
        expected_reason = "Edge edge_2 blocked due to debris incident (severity: severe). Rerouting affected vehicles."
        self.assertEqual(trigger["reason"], expected_reason)
        self.assertEqual(trigger["affected_vehicles"], ["VEH-42", "EMG-07"])


class TestResponseCoordinatorAgent(unittest.TestCase):
    """Test ResponseCoordinatorAgent routing and emergency override events."""

    def setUp(self):
        self.bus = EventBus()
        self.agent = ResponseCoordinatorAgent(event_bus=self.bus)
        self.agent.register_listeners()

    def test_normal_vehicle_fires_route_recalculated(self):
        events = []
        self.bus.subscribe("route_recalculated", lambda e: events.append(e))

        trigger_payload = {
            "edge_id": "edge_3",
            "type": "accident",
            "severity": "critical",
            "reason": "Edge edge_3 blocked due to accident incident (severity: critical). Rerouting affected vehicles.",
            "affected_vehicles": ["VEH-101"],
        }

        self.bus.publish("route_recalculated_trigger", trigger_payload)

        self.assertEqual(len(events), 1)
        event = events[0]
        self.assertEqual(event["event"], "route_recalculated")
        payload = event["payload"]
        self.assertEqual(payload["vehicle_id"], "VEH-101")
        self.assertEqual(payload["priority"], "normal")
        self.assertIn("rerouted around blocked edge edge_3", payload["reason"])

    def test_emg_vehicle_fires_emergency_override(self):
        events = []
        self.bus.subscribe("emergency_override", lambda e: events.append(e))

        trigger_payload = {
            "edge_id": "edge_1",
            "type": "fire",
            "severity": "extreme",
            "reason": "Edge edge_1 blocked due to fire incident (severity: extreme). Rerouting affected vehicles.",
            "affected_vehicles": ["EMG-999"],
        }

        self.bus.publish("route_recalculated_trigger", trigger_payload)

        self.assertEqual(len(events), 1)
        event = events[0]
        self.assertEqual(event["event"], "emergency_override")
        payload = event["payload"]
        self.assertEqual(payload["vehicle_id"], "EMG-999")
        self.assertEqual(payload["priority"], "emergency")
        self.assertIn("Emergency vehicle EMG-999", payload["reason"])


class TestEndToEndAgentRunner(unittest.TestCase):
    """Test full multi-agent orchestration via agent_runner and event bus."""

    def setUp(self):
        self.bus = EventBus()
        self.db = DefaultMockDB()

    def tearDown(self):
        agent_runner.stop()

    def test_full_pipeline_via_event_bus(self):
        # Start the runner with custom bus and db
        state = agent_runner.start(bus=self.bus, db=self.db, poll_interval=10.0)
        self.assertTrue(state["is_running"])

        # Capture output WebSocket events
        normal_reroutes = []
        emergency_overrides = []
        self.bus.subscribe("route_recalculated", lambda e: normal_reroutes.append(e))
        self.bus.subscribe("emergency_override", lambda e: emergency_overrides.append(e))

        # Simulate AGENT_1 or external detector publishing incident_detected
        self.bus.publish(
            "incident_detected",
            {
                "edge_id": "edge_1",
                "type": "sinkhole",
                "severity": "critical",
                "affected_vehicles": ["VEH-202", "EMG-01"],
            },
        )

        # Verify DB updated
        self.assertTrue(self.db.edges["edge_1"]["is_blocked"])

        # Verify ResponseCoordinatorAgent responded via the bus for both vehicles
        self.assertEqual(len(normal_reroutes), 1)
        self.assertEqual(normal_reroutes[0]["payload"]["vehicle_id"], "VEH-202")
        self.assertEqual(normal_reroutes[0]["payload"]["priority"], "normal")

        self.assertEqual(len(emergency_overrides), 1)
        self.assertEqual(emergency_overrides[0]["payload"]["vehicle_id"], "EMG-01")
        self.assertEqual(emergency_overrides[0]["payload"]["priority"], "emergency")

        # Stop runner cleanly
        stop_state = agent_runner.stop()
        self.assertFalse(stop_state["is_running"])


if __name__ == "__main__":
    unittest.main()
