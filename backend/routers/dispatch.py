"""
routers/dispatch.py — POST /dispatch
Selects a volunteer micro-team and computes ETA.
"""

import uuid
from fastapi import APIRouter
import firebase_admin
from firebase_admin import firestore

from models import DispatchRequest, DispatchPlan
from lib.volunteers import select_team
from lib.eta import compute_eta

router = APIRouter()


@router.post("", response_model=DispatchPlan)
async def dispatch_team(req: DispatchRequest) -> DispatchPlan:
    """
    Match volunteers by skill + area + availability, compute mock ETA,
    and return a deployment plan.
    """
    team = select_team(
        ward=req.ward,
        intervention=req.intervention,
    )
    eta_minutes, route_summary = compute_eta(
        team=team,
        target_ward=req.ward,
    )

    deployment_id = str(uuid.uuid4())

    _store_deployment(
        deployment_id=deployment_id,
        report_id=req.report_id,
        ward=req.ward,
        intervention_title=req.intervention.title,
        eta_minutes=eta_minutes,
        team=[v.name for v in team],
    )

    return DispatchPlan(
        deployment_id=deployment_id,
        team=team,
        task_brief=(
            f"Deploy to {req.ward}. Priority: {req.risk.label} risk. "
            f"Intervention: {req.intervention.title}. "
            f"Minimum team: {req.intervention.minimum_effective}."
        ),
        eta_minutes=eta_minutes,
        route_summary=route_summary,
    )


def _store_deployment(
    deployment_id: str,
    report_id: str,
    ward: str,
    intervention_title: str,
    eta_minutes: int,
    team: list[str],
) -> None:
    """
    Best-effort Firestore persistence.
    Skips silently when Firebase is not initialized in local/dev environments.
    """
    if not firebase_admin._apps:
        return

    try:
        db = firestore.client()
        db.collection("deployments").document(deployment_id).set(
            {
                "deployment_id": deployment_id,
                "report_id": report_id,
                "target_zone": ward,
                "assigned_volunteers": team,
                "intervention_title": intervention_title,
                "route_eta": eta_minutes,
                "status": "pending",
            }
        )
    except Exception as e:
        print(f"Firebase Dispatch Write Error: {e}")
