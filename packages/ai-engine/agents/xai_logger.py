"""Explainable AI (XAI) structured decision logger."""

import uuid
from datetime import datetime
from typing import Optional
from schemas.agents_xai import AgentRole, InfluencingFactor, XAIDecisionLog


class XAILogger:
    def __init__(self, max_history: int = 200):
        self.max_history = max_history
        self.history: list[XAIDecisionLog] = []

    def record_decision(
        self,
        agent_role: AgentRole,
        trigger_event: str,
        decision_category: str,
        selected_action: str,
        rejected_alternatives: list[str],
        influencing_factors: list[InfluencingFactor],
        human_explanation: str,
        confidence: float = 0.95,
    ) -> XAIDecisionLog:
        now_str = datetime.utcnow().isoformat() + "Z"
        decision_id = f"XAI-{uuid.uuid4().hex[:8].upper()}"

        log_entry = XAIDecisionLog(
            decision_id=decision_id,
            timestamp=now_str,
            agent_role=agent_role,
            trigger_event=trigger_event,
            decision_category=decision_category,
            selected_action=selected_action,
            rejected_alternatives=rejected_alternatives,
            influencing_factors=influencing_factors,
            human_explanation=human_explanation,
            confidence=round(confidence, 2),
        )

        self.history.insert(0, log_entry)
        if len(self.history) > self.max_history:
            self.history.pop()

        return log_entry

    def get_logs(self, limit: int = 50, role: Optional[AgentRole] = None) -> list[XAIDecisionLog]:
        filtered = self.history
        if role:
            filtered = [item for item in filtered if item.agent_role == role]
        return filtered[:limit]
