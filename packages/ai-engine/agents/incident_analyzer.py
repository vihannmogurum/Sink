"""Incident Analyzer Agent: evaluates incident severity, confidence, and capacity impact."""

from datetime import datetime
from schemas.agents_xai import AgentAction, AgentRole, AgentState, InfluencingFactor
from schemas.incidents import IncidentRecord
from .xai_logger import XAILogger


class IncidentAnalyzerAgent:
    def __init__(self, xai_logger: XAILogger):
        self.role = AgentRole.INCIDENT_ANALYZER
        self.agent_id = "AGENT_INCIDENT_ANALYZER"
        self.xai_logger = xai_logger
        self.analyzed_count = 0
        self.confirmed_incidents: list[str] = []

    def analyze_incidents(self, incidents: list[IncidentRecord]) -> tuple[AgentState, list[AgentAction]]:
        self.analyzed_count += len(incidents)
        actions: list[AgentAction] = []
        now_str = datetime.utcnow().isoformat() + "Z"

        for inc in incidents:
            self.confirmed_incidents.append(inc.incident_id)

            action = AgentAction(
                action_id=f"ACT-IA-{inc.incident_id}",
                agent_role=self.role,
                action_type="INCIDENT_CONFIRMED",
                target_entity_id=inc.edge_id,
                parameters={
                    "incident_id": inc.incident_id,
                    "type": inc.incident_type.value,
                    "severity": inc.severity.value,
                    "capacity_reduction_pct": inc.capacity_reduction_pct,
                    "clearance_minutes": inc.estimated_clearance_minutes,
                },
                timestamp=now_str,
            )
            actions.append(action)

            # Record XAI explainability
            self.xai_logger.record_decision(
                agent_role=self.role,
                trigger_event=f"Confirmed {inc.severity.value} severity {inc.incident_type.value} on {inc.edge_id}",
                decision_category="INCIDENT_ASSESSMENT",
                selected_action=f"Dispatch incident advisory and request dynamic network reroute for {inc.edge_id}",
                rejected_alternatives=["Treat as low-priority delay", "Await secondary sensor verification"],
                influencing_factors=[
                    InfluencingFactor(
                        factor_name="composite_anomaly_score",
                        weight_or_value=inc.anomaly_score,
                        description="Weighted score from speed z-score, density, and CV feed",
                    ),
                    InfluencingFactor(
                        factor_name="capacity_reduction_pct",
                        weight_or_value=inc.capacity_reduction_pct,
                        description="Estimated reduction in road carrying capacity",
                    ),
                    InfluencingFactor(
                        factor_name="estimated_clearance_minutes",
                        weight_or_value=float(inc.estimated_clearance_minutes),
                        description="Time required by emergency responders to clear roadway",
                    ),
                ],
                human_explanation=(
                    f"Incident Analyzer Agent verified a {inc.severity.value} {inc.incident_type.value} on edge {inc.edge_id}. "
                    f"With road capacity reduced by {inc.capacity_reduction_pct}% and {inc.estimated_clearance_minutes} min "
                    f"estimated clearance time, downstream traffic diversion is immediately advised."
                ),
                confidence=inc.confidence,
            )

        state = AgentState(
            agent_id=self.agent_id,
            role=self.role,
            status="ANALYZING" if incidents else "IDLE",
            last_action=f"Assessed {len(incidents)} incidents",
            last_updated=now_str,
            observations_count=self.analyzed_count,
            active_alerts=[f"Confirmed incident on {inc.edge_id}" for inc in incidents[-3:]],
        )
        return state, actions
