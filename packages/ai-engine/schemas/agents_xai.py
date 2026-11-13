"""Schemas for Multi-Agent coordination and Explainable AI (XAI) logs."""

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class AgentRole(str, Enum):
    TRAFFIC_MONITOR = "traffic_monitor_agent"
    INCIDENT_ANALYZER = "incident_analyzer_agent"
    RESPONSE_COORDINATOR = "response_coordinator_agent"


class AgentState(BaseModel):
    agent_id: str
    role: AgentRole
    status: str  # IDLE, MONITORING, ANALYZING, MITIGATING
    last_action: str
    last_updated: str
    observations_count: int
    active_alerts: list[str] = Field(default_factory=list)


class AgentAction(BaseModel):
    action_id: str
    agent_role: AgentRole
    action_type: str  # REROUTE, SIGNAL_PREEMPTION, INCIDENT_FLAG, NOTIFICATION
    target_entity_id: str  # edge_id, node_id, route_id
    parameters: dict[str, Any]
    timestamp: str


class InfluencingFactor(BaseModel):
    factor_name: str
    weight_or_value: float
    description: str


class XAIDecisionLog(BaseModel):
    decision_id: str
    timestamp: str
    agent_role: AgentRole
    trigger_event: str
    decision_category: str  # ROUTE_SELECTION, EMERGENCY_OVERRIDE, CONGESTION_MITIGATION
    selected_action: str
    rejected_alternatives: list[str]
    influencing_factors: list[InfluencingFactor]
    human_explanation: str
    confidence: float = Field(ge=0.0, le=1.0)


class MultiAgentCycleRequest(BaseModel):
    simulated_telemetry: Optional[list[dict[str, Any]]] = None
    force_incident_edge: Optional[str] = None


class MultiAgentCycleResponse(BaseModel):
    cycle_id: str
    timestamp: str
    agent_states: dict[str, AgentState]
    actions_taken: list[AgentAction]
    xai_logs: list[XAIDecisionLog]
