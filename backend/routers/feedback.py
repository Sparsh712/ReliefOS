"""
routers/feedback.py — POST /feedback
Captures post-task feedback and adjusts ward risk score.
"""

from fastapi import APIRouter

from models import FeedbackInput, FeedbackResult

router = APIRouter()


@router.post("", response_model=FeedbackResult)
async def submit_feedback(feedback: FeedbackInput) -> FeedbackResult:
    """
    Record post-deployment outcome. Adjusts risk score slightly:
    - Resolved = True  → risk_adjustment = -5 (reduced threat)
    - Resolved = False → risk_adjustment = +3 (ongoing issue)
    """
    risk_adjustment = -5 if feedback.resolved else +3

    # TODO: update Firestore
    # db.collection("deployments").document(feedback.deployment_id).update({
    #     "status": "completed",
    #     "feedback_summary": feedback.model_dump(),
    # })

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
