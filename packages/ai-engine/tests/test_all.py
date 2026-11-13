"""Comprehensive unit test suite for UrbanFlow AI Engine (AGENT_3)."""

import unittest
from fastapi.testclient import TestClient

from main import app, road_graph, forecaster, incident_detector, route_optimizer, preemption_engine
from schemas.incidents import SensorTelemetry, IncidentType, IncidentSeverity
from schemas.routing import RouteAlgorithm, RouteOptimizeRequest, EmergencyPreemptionRequest


class TestUrbanFlowAIEngine(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["port"], 8001)
        self.assertEqual(json_data["data"]["service"], "urbanflow-ai-engine")

    def test_02_forecast_predict(self):
        # Test 15-30 min prediction
        response = self.client.post("/forecast/predict", json={"segment_ids": ["EDGE_A_B", "EDGE_B_C"]})
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["horizons"], [15, 30])
        self.assertEqual(len(data["forecasts"]), 2)
        f1 = data["forecasts"][0]
        self.assertIn("plus_15_min", f1["predictions"])
        self.assertIn("plus_30_min", f1["predictions"])
        self.assertGreater(f1["predictions"]["plus_15_min"]["predicted_speed_kmh"], 0)

    def test_03_forecast_segments(self):
        response = self.client.get("/forecast/segments")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertGreaterEqual(data["total_monitored"], 3)

    def test_04_incident_detection_normal(self):
        # Normal telemetry shouldn't flag incidents
        telemetry = [
            {
                "edge_id": "EDGE_A_B",
                "current_speed_kmh": 48.0,
                "historical_avg_speed_kmh": 50.0,
                "speed_std_dev": 5.0,
                "flow_rate_veh_hour": 800.0,
                "density_veh_km": 30.0,
                "occupancy_pct": 0.25,
                "cv_detected_incident": False,
            }
        ]
        response = self.client.post("/incidents/detect", json={"telemetry": telemetry})
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["anomalies_detected"], 0)

    def test_05_incident_detection_anomaly_and_cv(self):
        # Severe crash detected by CV and speed collapse
        telemetry = [
            {
                "edge_id": "EDGE_B_C",
                "current_speed_kmh": 6.0,
                "historical_avg_speed_kmh": 50.0,
                "speed_std_dev": 4.0,
                "flow_rate_veh_hour": 150.0,
                "density_veh_km": 95.0,
                "occupancy_pct": 0.90,
                "cv_detected_incident": True,
                "cv_incident_type": "multi_car_accident",
                "cv_confidence": 0.94,
            }
        ]
        response = self.client.post("/incidents/detect", json={"telemetry": telemetry})
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["anomalies_detected"], 1)
        inc = data["incidents"][0]
        self.assertEqual(inc["incident_type"], "accident")
        self.assertIn(inc["severity"], ["high", "critical"])
        self.assertGreater(inc["estimated_clearance_minutes"], 20)

    def test_06_route_optimize_dijkstra_and_astar(self):
        # A* Path
        astar_payload = {
            "origin": "A",
            "destination": "D",
            "algorithm": "astar",
            "alternatives": 2,
        }
        res_astar = self.client.post("/routes/optimize", json=astar_payload)
        self.assertEqual(res_astar.status_code, 200)
        astar_data = res_astar.json()["data"]
        self.assertEqual(astar_data["origin"], "A")
        self.assertEqual(astar_data["destination"], "D")
        self.assertGreater(len(astar_data["primary_route"]["nodes"]), 1)
        self.assertGreaterEqual(len(astar_data["alternative_routes"]), 1)

        # Dijkstra Path
        dijkstra_payload = {
            "origin": "A",
            "destination": "E",
            "algorithm": "dijkstra",
            "alternatives": 1,
        }
        res_dijk = self.client.post("/routes/optimize", json=dijkstra_payload)
        self.assertEqual(res_dijk.status_code, 200)
        dijk_data = res_dijk.json()["data"]
        self.assertEqual(dijk_data["destination"], "E")

    def test_07_emergency_preemption(self):
        payload = {
            "origin": "A",
            "destination": "E",
            "vehicle_id": "AMBULANCE_911",
            "vehicle_type": "ambulance",
        }
        response = self.client.post("/routes/emergency-preemption", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertEqual(data["vehicle_id"], "AMBULANCE_911")
        self.assertGreater(data["travel_time_saved_pct"], 40.0)
        self.assertGreater(len(data["green_wave_actions"]), 0)

    def test_08_multi_agent_cycle_and_xai(self):
        # Trigger cooperative agent cycle with an incident
        response = self.client.post("/agents/step", json={"force_incident_edge": "EDGE_B_C"})
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]
        self.assertIn("traffic_monitor", data["agent_states"])
        self.assertIn("incident_analyzer", data["agent_states"])
        self.assertIn("response_coordinator", data["agent_states"])
        self.assertGreater(len(data["actions_taken"]), 0)

        # Verify XAI Logs
        xai_res = self.client.get("/agents/xai-logs?limit=5")
        self.assertEqual(xai_res.status_code, 200)
        xai_data = xai_res.json()["data"]
        self.assertGreater(xai_data["total"], 0)
        latest_log = xai_data["logs"][0]
        self.assertIn("human_explanation", latest_log)
        self.assertIn("trigger_event", latest_log)
        self.assertIn("influencing_factors", latest_log)


if __name__ == "__main__":
    unittest.main()
