"""
lib/risk.py — Dengue/monsoon hotspot risk scoring + escalation clock.

Formula (Phase 4):
    base = fever_cases * 12
         + 25 if stagnant_water
         + 15 if water_quality_issue
         + 10 if medicine_shortage
         + 15 if urgency == "high"
         +  8 if urgency == "medium"
         + corroboration_bonus

    final_score = min(100, base * rain_multiplier)

Escalation clock: estimate days-to-next-risk-level based on signal velocity.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from models import ExtractedReport, TrustResult, RiskResult


DEFAULT_RAIN_MULTIPLIER = 1.2


@lru_cache(maxsize=1)
def _ward_multiplier_map() -> dict[str, float]:
    data_path = Path(__file__).resolve().parent.parent / "data" / "wards.json"
    try:
        raw = json.loads(data_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}

    mapping: dict[str, float] = {}
    for row in raw:
        ward_name = str(row.get("ward", "")).strip().lower()
        multiplier = row.get("rain_multiplier")
        if ward_name and isinstance(multiplier, (int, float)):
            mapping[ward_name] = float(multiplier)
            mapping[ward_name.replace(" ", "")] = float(multiplier)
    return mapping


def _rain_multiplier_for_ward(ward: str | None) -> float:
    if not ward:
        return DEFAULT_RAIN_MULTIPLIER
    key = ward.strip().lower()
    return _ward_multiplier_map().get(key, _ward_multiplier_map().get(key.replace(" ", ""), DEFAULT_RAIN_MULTIPLIER))


def _cross_report_corroboration_bonus(extracted: ExtractedReport, trust_score: float) -> int:
    """
    Approximate corroboration in MVP mode without a reports DB query.
    A higher bonus implies stronger indications that the report is not isolated.
    """
    bonus = 0

    fever = extracted.fever_cases or 0
    households = extracted.households_affected or 0
    notes = (extracted.source_notes or "").lower()

    if fever >= 5 and extracted.stagnant_water:
        bonus += 4

    if households >= 25:
        bonus += 3

    corroboration_terms = ["multiple", "several", "nearby", "same ward", "cluster"]
    if any(term in notes for term in corroboration_terms):
        bonus += 3

    if trust_score >= 0.7:
        bonus += 2

    return min(10, bonus)


def compute_risk_score(
    extracted: ExtractedReport,
    trust: TrustResult,
) -> RiskResult:
    """
    Compute hotspot risk score (0–100), label, explanation, and escalation window.
    """
    factors: list[str] = []
    base = 0

    # Fever contribution
    fever = extracted.fever_cases or 0
    if fever > 0:
        fever_pts = fever * 12
        base += fever_pts
        factors.append(f"{fever} fever case{'s' if fever != 1 else ''} (+{fever_pts} pts)")

    # Stagnant water
    if extracted.stagnant_water:
        base += 25
        factors.append("Stagnant water reported (+25 pts)")

    # Water quality issue
    if extracted.water_quality_issue:
        base += 15
        factors.append("Water contamination reported (+15 pts)")

    # Medicine shortage
    if extracted.medicine_shortage:
        base += 10
        factors.append("Medicine/ORS shortage (+10 pts)")

    # Urgency
    urgency = extracted.urgency_level
    if urgency == "high":
        base += 15
        factors.append("Urgency reported as HIGH (+15 pts)")
    elif urgency == "medium":
        base += 8
        factors.append("Urgency reported as MEDIUM (+8 pts)")

    corroboration_bonus = _cross_report_corroboration_bonus(extracted, trust.trust_score)
    if corroboration_bonus > 0:
        base += corroboration_bonus
        factors.append(f"Cross-report corroboration signal (+{corroboration_bonus} pts)")

    rain_multiplier = _rain_multiplier_for_ward(extracted.ward)
    raw_score = base * rain_multiplier
    final_score = int(min(100, raw_score))

    if final_score >= 70:
        label = "High"
    elif final_score >= 40:
        label = "Medium"
    else:
        label = "Low"

    # Escalation clock — estimate days to next risk level
    escalation_window = _estimate_escalation(
        current_label=label,
        fever=fever,
        stagnant_water=extracted.stagnant_water or False,
        trust_score=trust.trust_score,
    )

    ward_name = extracted.ward or "this area"
    explanation = (
        f"{ward_name} scores {final_score}/100 ({label} risk). "
        f"Rain multiplier for ward: {rain_multiplier}×. "
        f"Contributing factors: {'; '.join(factors) if factors else 'No signals detected'}."
    )

    return RiskResult(
        score=final_score,
        label=label,
        explanation=explanation,
        escalation_window=escalation_window,
        contributing_factors=factors,
        rain_multiplier=rain_multiplier,
    )


def _estimate_escalation(
    current_label: str,
    fever: int,
    stagnant_water: bool,
    trust_score: float,
) -> str:
    """
    Estimate days until the area escalates to the next risk level.
    Based on signal velocity heuristics.
    """
    if current_label == "High":
        return "Already at HIGH — immediate action required"

    # Base escalation days: fewer signals = slower escalation
    base_days = 7

    if fever >= 5:
        base_days -= 2
    elif fever >= 3:
        base_days -= 1

    if stagnant_water:
        base_days -= 2

    # Low trust = uncertainty, report wider window
    if trust_score < 0.5:
        base_days += 2

    base_days = max(1, base_days)

    if current_label == "Low":
        return f"~{base_days + 3} days to Medium risk if no action taken"
    else:  # Medium
        return f"~{base_days} days to High risk if no action taken"
