"""Traffic Monitor Agent: continuously tracks telemetry streams and detects bottlenecks."""

from datetime import datetime
from schemas.agents_xai import AgentAction, AgentRole, AgentState, InfluencingFactor
from schemas.incidents import SensorTelemetry
from .xai_logger import XAILogger


class TrafficMonitorAgent:
    def __init__(self, xai_logger: XAILogger):
        self.role = AgentRole.TRAFFIC_MONITOR
        self.agent_id = "AGENT_TRAFFIC_MONITOR"
        self.xai_logger = xai_logger
        self.observations_count = 0
        self.active_alerts: list[str] = []

    def monitor_stream(self, telemetry_batch: list[SensorTelemetry]) -> tuple[AgentState, list[AgentAction]]:
        self.observations_count += len(telemetry_batch)
        actions: list[AgentAction] = []
        alerts_raised: list[str] = []

        now_str = datetime.utcnow().isoformat() + "Z"

        for item in telemetry_batch:
            speed_ratio = item.current_speed_kmh / max(1.0, item.historical_avg_speed_kmh)
            speed_drop_pct = (1.0 - speed_ratio) * 100.0

            # Alert condition: sudden 40%+ drop or density > 75 veh/km
            if speed_drop_pct >= 40.0 or item.density_veh_km >= 75.0 or item.cv_detected_incident:
                alert_msg = f"Traffic anomaly on {item.edge_id}: speed dropped to {item.current_speed_kmh} km/h (density: {item.density_veh_km} veh/km)"
                alerts_raised.append(alert_msg)

                action = AgentAction(
                    action_id=f"ACT-TM-{item.edge_id}",
                    agent_role=self.role,
                    action_type="ANOMALY_ESCALATION",
                    target_entity_id=item.edge_id,
                    parameters={
                        "speed_kmh": item.current_speed_kmh,
                        "density_veh_km": item.density_veh_km,
                        "cv_flag": item.cv_detected_incident,
                    },
                    timestamp=now_str,
                )
                actions.append(action)

                # Record Explainable XAI Log
                self.xai_logger.record_decision(
                    agent_role=self.role,
                    trigger_event=f"Telemetry anomaly threshold breached on segment {item.edge_id}",
                    decision_category="CONGESTION_MITIGATION",
                    selected_action=f"Escalate anomaly on {item.edge_id} to Incident Analyzer Agent",
                    rejected_alternatives=["Suppress anomaly as transient noise", "Defer until next polling cycle"],
                    influencing_factors=[
                        InfluencingFactor(
                            factor_name="speed_drop_percentage",
                            weight_or_value=round(speed_drop_pct, 1),
                            description="Percentage drop below historical baseline",
                        ),
                        InfluencingFactor(
                            factor_name="density_veh_per_km",
                            weight_or_value=item.density_veh_km,
                            description="Vehicles per kilometer on roadway segment",
                        ),
                    ],
                    human_explanation=(
                        f"Traffic Monitor Agent flagged segment {item.edge_id} after observing a {speed_drop_pct:.1f}% "
                        f"speed reduction to {item.current_speed_kmh} km/h with vehicle density at {item.density_veh_km} veh/km."
                    ),
                    confidence=0.92,
                )

        self.active_alerts = alerts_raised[-5:]
        state = AgentState(
            agent_id=self.agent_id,
            role=self.role,
            status="MONITORING" if not alerts_raised else "ALERTED",
            last_action=f"Processed batch of {len(telemetry_batch)} readings, flagged {len(actions)} anomalies",
            last_updated=now_str,
            observations_count=self.observations_count,
            active_alerts=self.active_alerts,
        )
        return state, actions
