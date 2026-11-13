"""Schemas for traffic congestion forecasting."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class CongestionLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HEAVY = "heavy"
    SEVERE = "severe"


class ForecastHorizon(str, Enum):
    PLUS_15_MIN = "plus_15_min"
    PLUS_30_MIN = "plus_30_min"


class ForecastPrediction(BaseModel):
    horizon_minutes: int
    predicted_speed_kmh: float
    predicted_density_veh_km: float
    congestion_level: CongestionLevel
    confidence: float = Field(ge=0.0, le=1.0)
    bottleneck_probability: float = Field(ge=0.0, le=1.0)


class SegmentForecast(BaseModel):
    segment_id: str
    from_node: str
    to_node: str
    current_speed_kmh: float
    free_flow_speed_kmh: float
    current_density_veh_km: float
    predictions: dict[str, ForecastPrediction]  # "15_min", "30_min"


class ForecastRequest(BaseModel):
    segment_ids: Optional[list[str]] = None
    timestamp: Optional[str] = None


class ForecastResponse(BaseModel):
    timestamp: str
    horizons: list[int]
    forecasts: list[SegmentForecast]
