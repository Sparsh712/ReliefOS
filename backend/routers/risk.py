"""
routers/risk.py — POST /risk
Computes a hotspot risk score and escalation window.
"""

from fastapi import APIRouter

from models import RiskRequest, RiskResult
from lib.risk import compute_risk_score

router = APIRouter()


@router.post("", response_model=RiskResult)
async def score_risk(req: RiskRequest) -> RiskResult:
    """
    Fuse extracted report signals with ward-level rain multiplier
    to produce a 0–100 hotspot score, risk label, and escalation window.
    """
    return compute_risk_score(
        extracted=req.extracted,
        trust=req.trust,
    )
