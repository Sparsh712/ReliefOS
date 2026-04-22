"""
lib/risk.py — Dengue/monsoon hotspot risk scoring + escalation clock.

Formula (from claude.md):
    base = fever_cases * 12
         + 25 if stagnant_water
         + 15 if water_quality_issue
         + 10 if medicine_shortage
         + 15 if urgency == "high"
         +  8 if urgency == "medium"

    final_score = min(100, base * rain_multiplier)

Escalation clock: estimate days-to-next-risk-level based on signal velocity.
"""

from models import ExtractedReport, TrustResult, RiskResult

# Ward-level rain multipliers for Delhi wards (mock data)
WARD_RAIN_MULTIPLIERS: dict[str, float] = {
    "rohini":        1.4,
    "dwarka":        1.2,
    "seelampur":     1.3,
    "laxmi nagar":   1.1,
    "laxminagar":    1.1,
    "najafgarh":     1.35,
    "default":       1.2,  # fallback for unknown wards
}


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

    # Ward rain multiplier
    ward_key = (extracted.ward or "default").lower().strip()
    rain_multiplier = WARD_RAIN_MULTIPLIERS.get(ward_key, WARD_RAIN_MULTIPLIERS["default"])
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
