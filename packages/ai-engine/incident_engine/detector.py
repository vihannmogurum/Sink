"""Anomaly scoring and incident classification engine."""

import uuid
from datetime import datetime
from typing import Optional
from schemas.incidents import (
    IncidentDetectionResponse,
    IncidentRecord,
    IncidentSeverity,
    IncidentType,
    SensorTelemetry,
)


class IncidentDetector:
    def __init__(
        self,
        speed_drop_zscore_threshold: float = 2.0,
        density_spike_threshold: float = 75.0,
        cv_confidence_threshold: float = 0.65,
    ):
        self.zscore_thresh = speed_drop_zscore_threshold
        self.density_thresh = density_spike_threshold
        self.cv_thresh = cv_confidence_threshold
        self.active_incidents: dict[str, IncidentRecord] = {}

    def analyze_telemetry(self, telemetry_list: list[SensorTelemetry]) -> IncidentDetectionResponse:
        detected: list[IncidentRecord] = []
        now_str = datetime.utcnow().isoformat() + "Z"

        for item in telemetry_list:
            # 1. Statistical Speed Anomaly (Z-Score)
            speed_diff = item.historical_avg_speed_kmh - item.current_speed_kmh
            std_dev = max(1.0, item.speed_std_dev)
            speed_zscore = speed_diff / std_dev
            speed_drop_pct = max(0.0, (speed_diff / max(1.0, item.historical_avg_speed_kmh)) * 100.0)

            # 2. Density Congestion Spike
            is_density_spike = item.density_veh_km >= self.density_thresh

            # 3. Computer Vision Alert
            cv_flag = item.cv_detected_incident and item.cv_confidence >= self.cv_thresh

            # Composite Anomaly Score (0.0 to 1.0)
            z_norm = min(1.0, max(0.0, speed_zscore / 4.0))
            density_norm = min(1.0, max(0.0, item.density_veh_km / 120.0))
            cv_score = item.cv_confidence if item.cv_detected_incident else 0.0

            anomaly_score = (z_norm * 0.40) + (density_norm * 0.25) + (cv_score * 0.35)

            # Determine whether incident criteria met
            is_incident = False
            incident_type = IncidentType.CONGESTION_SPIKE
            severity = IncidentSeverity.LOW
            description = ""
            affected_lanes = 1
            capacity_reduction = 25.0
            clearance_mins = 15

            if cv_flag:
                is_incident = True
                raw_type = (item.cv_incident_type or "").lower()
                if "accident" in raw_type or "collision" in raw_type:
                    incident_type = IncidentType.ACCIDENT
                    severity = IncidentSeverity.CRITICAL if speed_drop_pct > 60 else IncidentSeverity.HIGH
                    affected_lanes = 2 if speed_drop_pct > 60 else 1
                    capacity_reduction = 75.0 if severity == IncidentSeverity.CRITICAL else 50.0
                    clearance_mins = 45 if severity == IncidentSeverity.CRITICAL else 30
                    description = f"CV Confirmed {raw_type} with severe deceleration on {item.edge_id}"
                elif "debris" in raw_type:
                    incident_type = IncidentType.DEBRIS
                    severity = IncidentSeverity.MEDIUM
                    capacity_reduction = 30.0
                    clearance_mins = 20
                    description = f"Road debris obstruction detected by vision feed on {item.edge_id}"
                else:
                    incident_type = IncidentType.ROAD_BLOCKAGE
                    severity = IncidentSeverity.HIGH
                    capacity_reduction = 60.0
                    clearance_mins = 35
                    description = f"Visual obstruction reported on {item.edge_id}"
            elif speed_zscore >= self.zscore_thresh and speed_drop_pct >= 40.0:
                is_incident = True
                if speed_drop_pct >= 70.0:
                    incident_type = IncidentType.ROAD_BLOCKAGE
                    severity = IncidentSeverity.HIGH
                    capacity_reduction = 70.0
                    clearance_mins = 40
                    description = f"Sudden standstill anomaly: speed dropped {speed_drop_pct:.1f}% on {item.edge_id}"
                else:
                    incident_type = IncidentType.CONGESTION_SPIKE
                    severity = IncidentSeverity.MEDIUM
                    capacity_reduction = 40.0
                    clearance_mins = 25
                    description = f"Abnormal deceleration anomaly detected (Z-score: {speed_zscore:.2f}) on {item.edge_id}"
            elif is_density_spike and speed_drop_pct >= 30.0:
                is_incident = True
                incident_type = IncidentType.CONGESTION_SPIKE
                severity = IncidentSeverity.MEDIUM
                capacity_reduction = 35.0
                clearance_mins = 20
                description = f"Critical vehicle density ({item.density_veh_km} veh/km) bottleneck on {item.edge_id}"

            if is_incident or anomaly_score >= 0.65:
                confidence = max(item.cv_confidence, min(0.99, round(0.50 + (anomaly_score * 0.49), 2)))
                inc_id = f"INC-{item.edge_id}-{uuid.uuid4().hex[:6].upper()}"
                rec = IncidentRecord(
                    incident_id=inc_id,
                    edge_id=item.edge_id,
                    incident_type=incident_type,
                    severity=severity,
                    confidence=confidence,
                    anomaly_score=round(anomaly_score, 3),
                    speed_drop_pct=round(speed_drop_pct, 1),
                    estimated_clearance_minutes=clearance_mins,
                    capacity_reduction_pct=capacity_reduction,
                    affected_lanes=affected_lanes,
                    description=description or f"Sensor anomaly on {item.edge_id}",
                    detected_at=now_str,
                )
                detected.append(rec)
                self.active_incidents[item.edge_id] = rec

        return IncidentDetectionResponse(
            anomalies_detected=len(detected),
            incidents=detected,
        )

    def register_manual_incident(
        self,
        edge_id: str,
        incident_type: IncidentType,
        severity: IncidentSeverity,
        affected_lanes: int = 1,
        description: Optional[str] = None,
    ) -> IncidentRecord:
        now_str = datetime.utcnow().isoformat() + "Z"
        clearance_map = {
            IncidentSeverity.LOW: 15,
            IncidentSeverity.MEDIUM: 25,
            IncidentSeverity.HIGH: 45,
            IncidentSeverity.CRITICAL: 60,
        }
        capacity_map = {
            IncidentSeverity.LOW: 20.0,
            IncidentSeverity.MEDIUM: 40.0,
            IncidentSeverity.HIGH: 70.0,
            IncidentSeverity.CRITICAL: 90.0,
        }
        inc_id = f"SIM-{edge_id}-{uuid.uuid4().hex[:6].upper()}"
        record = IncidentRecord(
            incident_id=inc_id,
            edge_id=edge_id,
            incident_type=incident_type,
            severity=severity,
            confidence=0.98,
            anomaly_score=0.92,
            speed_drop_pct=75.0,
            estimated_clearance_minutes=clearance_map.get(severity, 30),
            capacity_reduction_pct=capacity_map.get(severity, 50.0),
            affected_lanes=affected_lanes,
            description=description or f"Manually simulated {incident_type.value} on {edge_id}",
            detected_at=now_str,
        )
        self.active_incidents[edge_id] = record
        return record

    def clear_incident(self, edge_id: str) -> bool:
        if edge_id in self.active_incidents:
            del self.active_incidents[edge_id]
            return True
        return False
