"""
routers/interventions.py — POST /interventions
Ranks interventions and returns evidence trail.
"""

from fastapi import APIRouter

from models import InterventionsRequest, InterventionsResult
from lib.interventions import rank_interventions

router = APIRouter()


@router.post("", response_model=InterventionsResult)
async def recommend_interventions(req: InterventionsRequest) -> InterventionsResult:
    """
    Apply deterministic rules + ranking formula to recommend
    the primary intervention, 2 alternatives, and an evidence trail.
    """
    return rank_interventions(
        extracted=req.extracted,
        trust=req.trust,
        risk=req.risk,
    )
