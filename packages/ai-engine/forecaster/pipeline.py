"""Inference pipeline for traffic congestion forecasting."""

from datetime import datetime
from typing import Optional
from schemas.forecasting import (
    CongestionLevel,
    ForecastPrediction,
    ForecastResponse,
    SegmentForecast,
)
from .model import SpatioTemporalForecasterModel


DEFAULT_CORRIDORS = [
    {
        "segment_id": "EDGE_A_B",
        "from_node": "A",
        "to_node": "B",
        "current_speed_kmh": 42.0,
        "free_flow_speed_kmh": 60.0,
        "current_density_veh_km": 38.0,
    },
    {
        "segment_id": "EDGE_B_C",
        "from_node": "B",
        "to_node": "C",
        "current_speed_kmh": 22.0,
        "free_flow_speed_kmh": 50.0,
        "current_density_veh_km": 68.0,
    },
    {
        "segment_id": "EDGE_C_D",
        "from_node": "C",
        "to_node": "D",
        "current_speed_kmh": 55.0,
        "free_flow_speed_kmh": 60.0,
        "current_density_veh_km": 20.0,
    },
    {
        "segment_id": "EDGE_B_D",
        "from_node": "B",
        "to_node": "D",
        "current_speed_kmh": 35.0,
        "free_flow_speed_kmh": 55.0,
        "current_density_veh_km": 45.0,
    },
    {
        "segment_id": "EDGE_A_C",
        "from_node": "A",
        "to_node": "C",
        "current_speed_kmh": 18.0,
        "free_flow_speed_kmh": 50.0,
        "current_density_veh_km": 82.0,
    },
]


class CongestionForecaster:
    def __init__(self):
        self.model = SpatioTemporalForecasterModel()
        self.segments_db = {seg["segment_id"]: dict(seg) for seg in DEFAULT_CORRIDORS}

    def _determine_level(self, speed: float, free_flow: float) -> CongestionLevel:
        ratio = speed / max(1.0, free_flow)
        if ratio >= 0.80:
            return CongestionLevel.LOW
        elif ratio >= 0.55:
            return CongestionLevel.MODERATE
        elif ratio >= 0.30:
            return CongestionLevel.HEAVY
        else:
            return CongestionLevel.SEVERE

    def update_segment_telemetry(self, segment_id: str, current_speed: float, current_density: float):
        if segment_id in self.segments_db:
            self.segments_db[segment_id]["current_speed_kmh"] = current_speed
            self.segments_db[segment_id]["current_density_veh_km"] = current_density

    def predict(self, segment_ids: Optional[list[str]] = None, timestamp_str: Optional[str] = None) -> ForecastResponse:
        now_dt = datetime.now()
        hour = now_dt.hour + (now_dt.minute / 60.0)

        target_ids = segment_ids if segment_ids else list(self.segments_db.keys())
        results: list[SegmentForecast] = []

        for seg_id in target_ids:
            seg = self.segments_db.get(seg_id)
            if not seg:
                # Synthesize fallback segment
                seg = {
                    "segment_id": seg_id,
                    "from_node": seg_id.split("_")[1] if "_" in seg_id else "X",
                    "to_node": seg_id.split("_")[2] if len(seg_id.split("_")) > 2 else "Y",
                    "current_speed_kmh": 40.0,
                    "free_flow_speed_kmh": 60.0,
                    "current_density_veh_km": 40.0,
                }
                self.segments_db[seg_id] = seg

            predictions = self.model.predict_segment(
                current_speed=seg["current_speed_kmh"],
                free_flow_speed=seg["free_flow_speed_kmh"],
                current_density=seg["current_density_veh_km"],
                hour_of_day=hour,
            )

            p15 = predictions["15_min"]
            p30 = predictions["30_min"]

            pred_15 = ForecastPrediction(
                horizon_minutes=15,
                predicted_speed_kmh=p15["speed_kmh"],
                predicted_density_veh_km=p15["density_veh_km"],
                congestion_level=self._determine_level(p15["speed_kmh"], seg["free_flow_speed_kmh"]),
                confidence=0.91,
                bottleneck_probability=p15["bottleneck_prob"],
            )

            pred_30 = ForecastPrediction(
                horizon_minutes=30,
                predicted_speed_kmh=p30["speed_kmh"],
                predicted_density_veh_km=p30["density_veh_km"],
                congestion_level=self._determine_level(p30["speed_kmh"], seg["free_flow_speed_kmh"]),
                confidence=0.84,
                bottleneck_probability=p30["bottleneck_prob"],
            )

            results.append(
                SegmentForecast(
                    segment_id=seg["segment_id"],
                    from_node=seg["from_node"],
                    to_node=seg["to_node"],
                    current_speed_kmh=seg["current_speed_kmh"],
                    free_flow_speed_kmh=seg["free_flow_speed_kmh"],
                    current_density_veh_km=seg["current_density_veh_km"],
                    predictions={"plus_15_min": pred_15, "plus_30_min": pred_30},
                )
            )

        return ForecastResponse(
            timestamp=datetime.utcnow().isoformat() + "Z",
            horizons=[15, 30],
            forecasts=results,
        )
