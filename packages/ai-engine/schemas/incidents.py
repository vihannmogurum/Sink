"""Schemas for incident & anomaly detection."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class IncidentType(str, Enum):
    ACCIDENT = "accident"
    ROAD_BLOCKAGE = "road_blockage"
    CONGESTION_SPIKE = "congestion_spike"
    DEBRIS = "debris"
    VEHICLE_BREAKDOWN = "vehicle_breakdown"


class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SensorTelemetry(BaseModel):
    edge_id: str
    timestamp: Optional[str] = None
    current_speed_kmh: float
    historical_avg_speed_kmh: float
    speed_std_dev: float = 5.0
    flow_rate_veh_hour: float
    density_veh_km: float
    occupancy_pct: float
    cv_detected_incident: bool = False
    cv_incident_type: Optional[str] = None
    cv_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    weather_condition: Optional[str] = "clear"


class IncidentRecord(BaseModel):
    incident_id: str
    edge_id: str
    incident_type: IncidentType
    severity: IncidentSeverity
    confidence: float
    anomaly_score: float
    speed_drop_pct: float
    estimated_clearance_minutes: int
    capacity_reduction_pct: float
    affected_lanes: int
    description: str
    detected_at: str


class IncidentDetectionRequest(BaseModel):
    telemetry: list[SensorTelemetry]


class IncidentDetectionResponse(BaseModel):
    anomalies_detected: int
    incidents: list[IncidentRecord]


class SimulateIncidentRequest(BaseModel):
    edge_id: str
    incident_type: IncidentType = IncidentType.ACCIDENT
    severity: IncidentSeverity = IncidentSeverity.HIGH
    affected_lanes: int = 1
    description: Optional[str] = None
