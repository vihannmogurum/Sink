"""Deterministic synthetic telemetry generator for testing."""

from schemas.incidents import SensorTelemetry


def generate_mock_telemetry_batch(inject_anomaly_edge: str = None) -> list[SensorTelemetry]:
    corridors = [
        ("EDGE_A_B", 45.0, 50.0, 5.0, 850.0, 35.0, 0.30),
        ("EDGE_B_C", 40.0, 48.0, 4.0, 1100.0, 48.0, 0.45),
        ("EDGE_C_D", 52.0, 55.0, 3.5, 700.0, 22.0, 0.20),
        ("EDGE_B_D", 38.0, 45.0, 4.0, 950.0, 40.0, 0.38),
        ("EDGE_A_C", 42.0, 50.0, 5.0, 900.0, 36.0, 0.32),
        ("EDGE_D_E", 50.0, 55.0, 3.0, 800.0, 25.0, 0.22),
    ]

    telemetry: list[SensorTelemetry] = []
    for edge_id, speed, hist_speed, std_dev, flow, density, occ in corridors:
        if inject_anomaly_edge and edge_id == inject_anomaly_edge:
            telemetry.append(
                SensorTelemetry(
                    edge_id=edge_id,
                    current_speed_kmh=8.0,
                    historical_avg_speed_kmh=hist_speed,
                    speed_std_dev=std_dev,
                    flow_rate_veh_hour=250.0,
                    density_veh_km=92.0,
                    occupancy_pct=0.88,
                    cv_detected_incident=True,
                    cv_incident_type="two_vehicle_collision",
                    cv_confidence=0.92,
                )
            )
        else:
            telemetry.append(
                SensorTelemetry(
                    edge_id=edge_id,
                    current_speed_kmh=speed,
                    historical_avg_speed_kmh=hist_speed,
                    speed_std_dev=std_dev,
                    flow_rate_veh_hour=flow,
                    density_veh_km=density,
                    occupancy_pct=occ,
                    cv_detected_incident=False,
                    cv_confidence=0.05,
                )
            )
    return telemetry
