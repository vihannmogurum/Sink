"""Configuration settings for UrbanFlow AI Engine (AGENT_3)."""

import os
from pydantic import BaseModel


class Settings(BaseModel):
    service_name: str = "urbanflow-ai-engine"
    port: int = int(os.getenv("AI_ENGINE_PORT", "8001"))
    host: str = os.getenv("AI_ENGINE_HOST", "0.0.0.0")
    api_gateway_url: str = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
    cors_origins: list[str] = ["*"]

    # Anomaly & Incident Detection Thresholds
    speed_drop_zscore_threshold: float = 2.0
    density_spike_threshold_veh_per_km: float = 75.0
    cv_confidence_threshold: float = 0.65

    # Emergency corridor settings
    preemption_weight_multiplier: float = 0.15  # Reduce corridor travel time by ~85% with green waves
    signal_preemption_seconds: int = 45


settings = Settings()
