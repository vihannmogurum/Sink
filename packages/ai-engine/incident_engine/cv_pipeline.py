"""Simulated Computer Vision (CV) stream processor for accident & obstacle detection."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float


class CVObjectDetection(BaseModel):
    label: str  # car, truck, debris, pedestrian, barrier
    confidence: float
    bounding_box: BoundingBox


class CVFrameAnalysis(BaseModel):
    camera_id: str
    edge_id: str
    timestamp: str
    detected_objects: list[CVObjectDetection]
    collision_detected: bool
    stopped_vehicle_count: int
    lane_obstruction_ratio: float
    recommended_incident_type: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)


class CVStreamProcessor:
    """Processes simulated camera feeds along monitored urban corridors."""

    def process_camera_frame(
        self,
        camera_id: str,
        edge_id: str,
        is_incident_frame: bool = False,
    ) -> CVFrameAnalysis:
        now_str = datetime.utcnow().isoformat() + "Z"
        if is_incident_frame:
            return CVFrameAnalysis(
                camera_id=camera_id,
                edge_id=edge_id,
                timestamp=now_str,
                detected_objects=[
                    CVObjectDetection(label="car", confidence=0.96, bounding_box=BoundingBox(x_min=0.2, y_min=0.3, x_max=0.45, y_max=0.55)),
                    CVObjectDetection(label="car", confidence=0.94, bounding_box=BoundingBox(x_min=0.42, y_min=0.32, x_max=0.68, y_max=0.58)),
                    CVObjectDetection(label="debris", confidence=0.88, bounding_box=BoundingBox(x_min=0.38, y_min=0.50, x_max=0.52, y_max=0.62)),
                ],
                collision_detected=True,
                stopped_vehicle_count=2,
                lane_obstruction_ratio=0.65,
                recommended_incident_type="two_vehicle_collision",
                confidence=0.95,
            )

        return CVFrameAnalysis(
            camera_id=camera_id,
            edge_id=edge_id,
            timestamp=now_str,
            detected_objects=[
                CVObjectDetection(label="car", confidence=0.92, bounding_box=BoundingBox(x_min=0.1, y_min=0.2, x_max=0.3, y_max=0.4)),
                CVObjectDetection(label="truck", confidence=0.89, bounding_box=BoundingBox(x_min=0.6, y_min=0.3, x_max=0.85, y_max=0.6)),
            ],
            collision_detected=False,
            stopped_vehicle_count=0,
            lane_obstruction_ratio=0.0,
            recommended_incident_type=None,
            confidence=0.05,
        )
