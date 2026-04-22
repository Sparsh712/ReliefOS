"""
lib/trust.py — Heuristic trust/confidence scoring for extracted reports.

Trust score = weighted combination of:
  1. OCR confidence (from Vision API)
  2. Field completeness (non-null critical fields)
  3. Internal consistency (repeated corroborating signals)
  4. Urgency-evidence alignment
"""

from models import ExtractedReport, TrustResult, TrustFactor


# Critical fields that should be present in a reliable report
_CRITICAL_FIELDS = [
    "ward", "households_affected", "fever_cases",
    "stagnant_water", "urgency_level",
]


def compute_trust_score(
    extracted: ExtractedReport,
    ocr_confidence: float,
) -> TrustResult:
    """
    Compute a 0–1 trust score and return labelled factor breakdown.
    """
    factors: list[TrustFactor] = []
    score = 0.0

    # 1. OCR confidence (weight: 30%)
    ocr_contrib = ocr_confidence * 0.30
    score += ocr_contrib
    factors.append(TrustFactor(
        label="OCR quality",
        value=f"{ocr_confidence:.0%}",
        impact="positive" if ocr_confidence >= 0.75 else "negative",
    ))

    # 2. Field completeness (weight: 35%)
    filled = sum(
        1 for f in _CRITICAL_FIELDS
        if getattr(extracted, f, None) is not None
    )
    completeness = filled / len(_CRITICAL_FIELDS)
    completeness_contrib = completeness * 0.35
    score += completeness_contrib
    factors.append(TrustFactor(
        label="Field completeness",
        value=f"{filled}/{len(_CRITICAL_FIELDS)} critical fields",
        impact="positive" if completeness >= 0.6 else "negative",
    ))

    # 3. Corroborating signals — stagnant water + fever = dengue pattern (weight: 20%)
    has_corroboration = bool(extracted.stagnant_water and extracted.fever_cases and extracted.fever_cases > 0)
    corroboration_contrib = 0.20 if has_corroboration else 0.0
    score += corroboration_contrib
    factors.append(TrustFactor(
        label="Signal corroboration",
        value="Stagnant water + fever cases align" if has_corroboration else "No corroborating signals",
        impact="positive" if has_corroboration else "neutral",
    ))

    # 4. Urgency–evidence alignment (weight: 15%)
    urgency = extracted.urgency_level
    high_evidence = bool(
        (extracted.fever_cases or 0) >= 5
        or extracted.stagnant_water
        or extracted.water_quality_issue
        or extracted.medicine_shortage
    )
    aligned = (urgency == "high" and high_evidence) or (urgency in ("low", "medium") and not high_evidence)
    alignment_contrib = 0.15 if aligned else 0.05
    score += alignment_contrib
    factors.append(TrustFactor(
        label="Urgency–evidence alignment",
        value=f"Urgency '{urgency}' {'matches' if aligned else 'conflicts with'} evidence",
        impact="positive" if aligned else "negative",
    ))

    final_score = round(min(score, 1.0), 3)

    if final_score >= 0.70:
        label = "High"
    elif final_score >= 0.40:
        label = "Medium"
    else:
        label = "Low"

    return TrustResult(
        trust_score=final_score,
        confidence_label=label,
        factors=factors,
    )
