"""
routers/feedback.py — POST /feedback
Captures post-task feedback and adjusts ward risk score.
"""

from fastapi import APIRouter
import firebase_admin
from firebase_admin import firestore

from models import FeedbackInput, FeedbackResult

router = APIRouter()


@router.post("", response_model=FeedbackResult)
async def submit_feedback(feedback: FeedbackInput) -> FeedbackResult:
    """
    Record post-deployment outcome. Adjusts risk score slightly:
    - Resolved = True  → risk_adjustment = -5 (reduced threat)
    - Resolved = False → risk_adjustment = +3 (ongoing issue)
    """
    risk_adjustment = _compute_risk_adjustment(feedback)
    _update_deployment_feedback(feedback, risk_adjustment)

    message = (
        f"Feedback recorded. Risk score for this ward adjusted by {risk_adjustment:+d} points."
        if feedback.resolved
        else f"Issue unresolved. Risk flagged for follow-up. Adjustment: {risk_adjustment:+d}."
    )

    return FeedbackResult(
        deployment_id=feedback.deployment_id,
        status="completed",
        risk_adjustment=risk_adjustment,
        message=message,
    )


def _compute_risk_adjustment(feedback: FeedbackInput) -> int:
    """
    Slightly shift ward risk using simple outcome-based heuristic.
    """
    if feedback.resolved:
        if feedback.people_reached >= 50:
            return -8
        if feedback.people_reached >= 20:
            return -6
        return -4

    if feedback.people_reached == 0:
        return +4
    return +2


def _update_deployment_feedback(feedback: FeedbackInput, risk_adjustment: int) -> None:
    """
    Best-effort Firestore write. No-op when Firebase is not configured.
    """
    if not firebase_admin._apps:
        return

    db = firestore.client()
    db.collection("deployments").document(feedback.deployment_id).set(
        {
            "status": "completed",
            "risk_adjustment": risk_adjustment,
            "feedback_summary": feedback.model_dump(),
        },
        merge=True,
    )
