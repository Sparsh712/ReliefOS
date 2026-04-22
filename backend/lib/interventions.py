"""
lib/interventions.py — Deterministic rule-based intervention recommender.

Rules (from claude.md):
  - stagnant_water + fever >= 3  →  Drain cleanup + Mosquito awareness
  - fever >= 5 + children        →  ORS distribution + Medical volunteer visit
  - water_quality_issue          →  Safe water kit + Field inspection
  - medicine_shortage            →  Pharmacy support / Restocking request

Ranking formula:
  score = risk_severity * trust * intervention_fit / travel_cost
"""

from models import (
    ExtractedReport, TrustResult, RiskResult,
    Intervention, InterventionsResult, EvidenceTrail,
)

# intervention_fit constants (higher = better match for common scenario)
_FIT = {
    "drain_cleanup":   0.90,
    "awareness":       0.75,
    "ors":             0.85,
    "medical":         0.95,
    "water_kit":       0.88,
    "pharmacy":        0.80,
}

_TRAVEL_COST = 1.0  # normalized; could be replaced by real ETA later


def rank_interventions(
    extracted: ExtractedReport,
    trust: TrustResult,
    risk: RiskResult,
) -> InterventionsResult:
    candidates: list[Intervention] = []
    risk_severity = risk.score / 100.0

    fever = extracted.fever_cases or 0
    stagnant = extracted.stagnant_water or False
    water_bad = extracted.water_quality_issue or False
    med_short = extracted.medicine_shortage or False
    has_children = "children" in [g.lower() for g in extracted.vulnerable_groups]

    # Rule 1: drain cleanup + awareness
    if stagnant and fever >= 3:
        fit = _FIT["drain_cleanup"]
        candidates.append(Intervention(
            title="Drain Cleanup + Mosquito Awareness Drive",
            description="Clear stagnant water sources and educate residents on dengue prevention.",
            rationale=f"Stagnant water confirmed with {fever} fever cases — primary dengue breeding condition.",
            urgency="high" if fever >= 5 else "medium",
            team_composition=["sanitation", "field_ops", "awareness"],
            minimum_effective="2 sanitation volunteers + 1 awareness worker (90 min)",
            ranking_score=round(risk_severity * trust.trust_score * fit / _TRAVEL_COST, 3),
        ))

    # Rule 2: ORS + medical visit
    if fever >= 5 and has_children:
        fit = _FIT["medical"]
        candidates.append(Intervention(
            title="ORS Distribution + Medical Volunteer Visit",
            description="Distribute oral rehydration salts and conduct home visits for fever cases.",
            rationale=f"{fever} fever cases including children — immediate medical intervention needed.",
            urgency="high",
            team_composition=["medical", "community"],
            minimum_effective="1 medical volunteer + 1 community worker (2 hours)",
            ranking_score=round(risk_severity * trust.trust_score * fit / _TRAVEL_COST, 3),
        ))

    # Rule 3: water quality
    if water_bad:
        fit = _FIT["water_kit"]
        candidates.append(Intervention(
            title="Safe Water Kit Distribution + Field Inspection",
            description="Distribute water purification tablets and inspect water supply lines.",
            rationale="Water contamination or quality issues reported by residents.",
            urgency="high" if risk.label == "High" else "medium",
            team_composition=["field_ops", "sanitation"],
            minimum_effective="1 field inspector + water test kit (1 hour)",
            ranking_score=round(risk_severity * trust.trust_score * fit / _TRAVEL_COST, 3),
        ))

    # Rule 4: medicine/ORS shortage
    if med_short:
        fit = _FIT["pharmacy"]
        candidates.append(Intervention(
            title="Pharmacy Support / ORS Restocking Request",
            description="Coordinate with local health authorities to restock essential medicines.",
            rationale="Local dispensary reported shortage of ORS and fever medication.",
            urgency="medium",
            team_composition=["logistics", "medical"],
            minimum_effective="1 logistics volunteer (30 min coordination call)",
            ranking_score=round(risk_severity * trust.trust_score * fit / _TRAVEL_COST, 3),
        ))

    # Fallback: awareness drive
    if not candidates:
        candidates.append(Intervention(
            title="General Awareness + Monitoring Drive",
            description="Conduct a door-to-door awareness campaign and monitor ward for 48 hours.",
            rationale="No specific high-signal conditions detected — preventive monitoring recommended.",
            urgency="low",
            team_composition=["awareness", "community"],
            minimum_effective="2 community volunteers (2 hours)",
            ranking_score=round(risk_severity * trust.trust_score * _FIT["awareness"] / _TRAVEL_COST, 3),
        ))

    # Sort by ranking score descending
    candidates.sort(key=lambda x: x.ranking_score, reverse=True)
    primary = candidates[0]
    alternatives = candidates[1:3]

    evidence_trail = _build_evidence_trail(extracted, risk, primary)
    return InterventionsResult(
        primary=primary,
        alternatives=alternatives,
        evidence_trail=evidence_trail,
    )


def _build_evidence_trail(
    extracted: ExtractedReport,
    risk: RiskResult,
    intervention: Intervention,
) -> EvidenceTrail:
    key_facts: list[str] = []
    if extracted.fever_cases:
        key_facts.append(f"{extracted.fever_cases} fever cases reported in {extracted.ward or 'the ward'}")
    if extracted.stagnant_water:
        key_facts.append("Stagnant water confirmed near residential areas")
    if extracted.water_quality_issue:
        key_facts.append("Water contamination or discolouration reported")
    if extracted.medicine_shortage:
        key_facts.append("Local dispensary out of ORS and fever medication")
    if extracted.vulnerable_groups:
        key_facts.append(f"Vulnerable groups present: {', '.join(extracted.vulnerable_groups)}")
    if extracted.households_affected:
        key_facts.append(f"{extracted.households_affected} households surveyed")

    context_signals = [
        f"Ward rain multiplier: {risk.rain_multiplier}× (monsoon season adjustment)",
        f"Risk score: {risk.score}/100 — {risk.label} severity",
        f"Escalation forecast: {risk.escalation_window}",
    ]

    reasoning = (
        f"'{intervention.title}' was selected because: {intervention.rationale} "
        f"This is the highest-priority action given current field evidence and risk level."
    )

    return EvidenceTrail(
        key_facts=key_facts,
        context_signals=context_signals,
        reasoning=reasoning,
    )
