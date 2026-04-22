"""
routers/dispatch.py — POST /dispatch
Selects a volunteer micro-team and computes ETA.
"""

import uuid
from fastapi import APIRouter

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

    # TODO: store deployment in Firebase
    # db.collection("deployments").document(deployment_id).set({...})

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
