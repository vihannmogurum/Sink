"""End-to-end integration and smoke test script querying port 8001 live."""

import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8001"


def make_request(method: str, path: str, data: dict = None) -> dict:
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def run_e2e_suite():
    print(f"--- Running E2E Verification against {BASE_URL} ---")

    # 1. Health
    res = make_request("GET", "/health")
    assert res["success"] is True and res["data"]["port"] == 8001
    print("✓ [GET /health] Passed")

    # 2. Forecasting
    res = make_request("POST", "/forecast/predict", {"segment_ids": ["EDGE_A_B", "EDGE_B_C"]})
    assert res["success"] is True and len(res["data"]["forecasts"]) == 2
    f1 = res["data"]["forecasts"][0]
    assert "plus_15_min" in f1["predictions"] and "plus_30_min" in f1["predictions"]
    print("✓ [POST /forecast/predict] Passed (+15m & +30m predictions verified)")

    res = make_request("GET", "/forecast/segments")
    assert res["success"] is True and res["data"]["total_monitored"] >= 3
    print("✓ [GET /forecast/segments] Passed")

    # 3. Incident Detection
    telemetry = [
        {
            "edge_id": "EDGE_B_C",
            "current_speed_kmh": 6.5,
            "historical_avg_speed_kmh": 50.0,
            "speed_std_dev": 4.0,
            "flow_rate_veh_hour": 150.0,
            "density_veh_km": 94.0,
            "occupancy_pct": 0.88,
            "cv_detected_incident": True,
            "cv_incident_type": "overturned_truck",
            "cv_confidence": 0.95,
        }
    ]
    res = make_request("POST", "/incidents/detect", {"telemetry": telemetry})
    assert res["success"] is True and res["data"]["anomalies_detected"] == 1
    assert res["data"]["incidents"][0]["severity"] in ["high", "critical"]
    print("✓ [POST /incidents/detect] Passed (sensor anomaly & CV fusion verified)")

    # 4. CV Camera Analysis
    res = make_request("GET", "/incidents/cv-analyze?simulate_incident=true")
    assert res["success"] is True and res["data"]["collision_detected"] is True
    assert len(res["data"]["detected_objects"]) >= 2
    print("✓ [GET /incidents/cv-analyze] Passed (bounding boxes & collision flag verified)")

    # 5. Routing Optimization
    res = make_request("POST", "/routes/optimize", {
        "origin": "A",
        "destination": "D",
        "algorithm": "astar",
        "alternatives": 2
    })
    assert res["success"] is True
    assert len(res["data"]["primary_route"]["nodes"]) >= 2
    assert len(res["data"]["alternative_routes"]) == 2
    print("✓ [POST /routes/optimize] Passed (A* primary and 2 ranked alternatives verified)")

    # 6. Emergency Preemption
    res = make_request("POST", "/routes/emergency-preemption", {
        "origin": "A",
        "destination": "E",
        "vehicle_id": "MEDIC_42",
        "vehicle_type": "ambulance"
    })
    assert res["success"] is True
    assert res["data"]["travel_time_saved_pct"] >= 50.0
    assert len(res["data"]["green_wave_actions"]) >= 2
    print(f"✓ [POST /routes/emergency-preemption] Passed (Corridor cleared, time saved: {res['data']['travel_time_saved_pct']}%)")

    # 7. Network Graph
    res = make_request("GET", "/graph/network")
    assert res["success"] is True and res["data"]["total_nodes"] >= 5
    print("✓ [GET /graph/network] Passed (network topology verified)")

    # 8. Cooperating Multi-Agent Step & XAI
    res = make_request("POST", "/agents/step", {"force_incident_edge": "EDGE_B_D"})
    assert res["success"] is True
    states = res["data"]["agent_states"]
    assert "traffic_monitor" in states and "incident_analyzer" in states and "response_coordinator" in states
    assert len(res["data"]["actions_taken"]) >= 2
    print("✓ [POST /agents/step] Passed (cooperating agents executed state transitions)")

    # 9. Explainable AI Logs
    res = make_request("GET", "/agents/xai-logs?limit=5")
    assert res["success"] is True and len(res["data"]["logs"]) > 0
    sample_log = res["data"]["logs"][0]
    assert "human_explanation" in sample_log and "influencing_factors" in sample_log
    print("✓ [GET /agents/xai-logs] Passed (structured XAI explanation logs verified)")

    print("\n==========================================")
    print("ALL 9 LIVE ENDPOINTS PASSED WITH 100% SUCCESS")
    print("==========================================")


if __name__ == "__main__":
    run_e2e_suite()
