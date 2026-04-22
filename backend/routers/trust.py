"""
routers/trust.py — POST /trust
Computes a heuristic trust/confidence score for an extracted report.
"""

from fastapi import APIRouter

from models import TrustRequest, TrustResult
from lib.trust import compute_trust_score

router = APIRouter()


@router.post("", response_model=TrustResult)
async def score_trust(req: TrustRequest) -> TrustResult:
    """
    Compute trust score from OCR confidence, field completeness,
    and cross-report corroboration signals.
    """
    return compute_trust_score(
        extracted=req.extracted,
        ocr_confidence=req.ocr_confidence,
    )
