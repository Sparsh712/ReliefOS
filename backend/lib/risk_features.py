"""
Feature engineering for risk scoring.
Keeps a stable feature order for both training and inference.
"""

from __future__ import annotations

from models import ExtractedReport, TrustResult

FEATURE_ORDER = [
    "fever_cases",
    "households_affected",
    "stagnant_water",
    "water_quality_issue",
    "medicine_shortage",
    "urgency_medium",
    "urgency_high",
    "vuln_children",
    "vuln_elderly",
    "vuln_pregnant",
    "vuln_disabled",
    "extraction_confidence",
    "trust_score",
    "rain_multiplier",
    "corroboration_bonus",
    "fever_x_stagnant",
    "water_x_shortage",
]


def cross_report_corroboration_bonus(extracted: ExtractedReport, trust_score: float) -> int:
    bonus = 0

    fever = extracted.fever_cases or 0
    households = extracted.households_affected or 0
    notes = (extracted.source_notes or "").lower()

    if fever >= 5 and (extracted.stagnant_water or False):
        bonus += 4

    if households >= 25:
        bonus += 3

    corroboration_terms = ["multiple", "several", "nearby", "same ward", "cluster"]
    if any(term in notes for term in corroboration_terms):
        bonus += 3

    if trust_score >= 0.7:
        bonus += 2

    return min(10, bonus)


def build_features(
    extracted: ExtractedReport,
    trust: TrustResult,
    rain_multiplier: float,
    corroboration_bonus: int,
) -> dict[str, float]:
    groups = {g.lower().strip() for g in extracted.vulnerable_groups}

    fever = float(extracted.fever_cases or 0)
    households = float(extracted.households_affected or 0)
    stagnant = 1.0 if extracted.stagnant_water else 0.0
    water_issue = 1.0 if extracted.water_quality_issue else 0.0
    shortage = 1.0 if extracted.medicine_shortage else 0.0

    urgency = (extracted.urgency_level or "").lower()
    urgency_medium = 1.0 if urgency == "medium" else 0.0
    urgency_high = 1.0 if urgency == "high" else 0.0

    features = {
        "fever_cases": fever,
        "households_affected": households,
        "stagnant_water": stagnant,
        "water_quality_issue": water_issue,
        "medicine_shortage": shortage,
        "urgency_medium": urgency_medium,
        "urgency_high": urgency_high,
        "vuln_children": 1.0 if "children" in groups else 0.0,
        "vuln_elderly": 1.0 if "elderly" in groups else 0.0,
        "vuln_pregnant": 1.0 if "pregnant" in groups else 0.0,
        "vuln_disabled": 1.0 if "disabled" in groups or "differently abled" in groups else 0.0,
        "extraction_confidence": float(extracted.extraction_confidence),
        "trust_score": float(trust.trust_score),
        "rain_multiplier": float(rain_multiplier),
        "corroboration_bonus": float(corroboration_bonus),
        "fever_x_stagnant": fever * stagnant,
        "water_x_shortage": water_issue * shortage,
    }

    return features


def ordered_feature_vector(feature_map: dict[str, float]) -> list[float]:
    return [float(feature_map[name]) for name in FEATURE_ORDER]
