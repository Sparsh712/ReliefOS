"""
lib/risk.py — Dengue/monsoon hotspot risk scoring + escalation clock.

Primary mode: XGBoost model prediction (0-100).
Fallback mode: expanded heuristic if model is unavailable.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from models import ExtractedReport, TrustResult, RiskResult
from lib.risk_features import (
    FEATURE_ORDER,
    build_features,
    cross_report_corroboration_bonus,
    ordered_feature_vector,
)

try:
    import xgboost as xgb
except Exception:  # pragma: no cover - graceful fallback when package is absent
    xgb = None


DEFAULT_RAIN_MULTIPLIER = 1.2
MODEL_PATH = Path(__file__).resolve().parent.parent / "data" / "risk_xgb_model.json"


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


@lru_cache(maxsize=1)
def _load_model() -> xgb.Booster | None:
    if xgb is None or not MODEL_PATH.exists():
        return None

    booster = xgb.Booster()
    booster.load_model(str(MODEL_PATH))
    return booster


def _predict_with_xgb(features: dict[str, float]) -> float | None:
    booster = _load_model()
    if booster is None or xgb is None:
        return None

    vector = ordered_feature_vector(features)
    matrix = xgb.DMatrix([vector], feature_names=FEATURE_ORDER)
    prediction = float(booster.predict(matrix)[0])
    return max(0.0, min(100.0, prediction))


def _expanded_heuristic(features: dict[str, float]) -> float:
    """
    Fallback risk function using more signals than the original phase-4 formula.
    """
    base = (
        features["fever_cases"] * 8.5
        + features["households_affected"] * 0.35
        + features["stagnant_water"] * 15.0
        + features["water_quality_issue"] * 11.0
        + features["medicine_shortage"] * 8.0
        + features["urgency_medium"] * 6.0
        + features["urgency_high"] * 13.0
        + features["vuln_children"] * 5.0
        + features["vuln_elderly"] * 4.0
        + features["vuln_pregnant"] * 4.0
        + features["vuln_disabled"] * 4.0
        + features["corroboration_bonus"] * 1.8
        + features["fever_x_stagnant"] * 1.3
        + features["water_x_shortage"] * 6.0
    )

    confidence_scaler = 0.92 + (0.16 * features["extraction_confidence"] * features["trust_score"])
    score = base * features["rain_multiplier"] * confidence_scaler
    return max(0.0, min(100.0, score))


def _build_explanations(features: dict[str, float], model_used: bool) -> list[str]:
    factors: list[str] = []

    if features["fever_cases"] > 0:
        factors.append(f"Fever cases: {int(features['fever_cases'])}")
    if features["households_affected"] > 0:
        factors.append(f"Households affected: {int(features['households_affected'])}")
    if features["stagnant_water"] > 0:
        factors.append("Stagnant water signal present")
    if features["water_quality_issue"] > 0:
        factors.append("Water quality issue reported")
    if features["medicine_shortage"] > 0:
        factors.append("Medicine shortage reported")
    if features["urgency_high"] > 0:
        factors.append("Urgency marked HIGH")
    elif features["urgency_medium"] > 0:
        factors.append("Urgency marked MEDIUM")

    if features["vuln_children"] > 0:
        factors.append("Children in vulnerable groups")
    if features["vuln_elderly"] > 0:
        factors.append("Elderly in vulnerable groups")
    if features["vuln_pregnant"] > 0:
        factors.append("Pregnant women in vulnerable groups")
    if features["vuln_disabled"] > 0:
        factors.append("Disabled persons in vulnerable groups")

    factors.append(f"Rain multiplier: {features['rain_multiplier']:.2f}x")
    factors.append(f"Trust score: {features['trust_score']:.2f}")
    factors.append(f"Extraction confidence: {features['extraction_confidence']:.2f}")
    factors.append(
        "Scoring engine: XGBoost model"
        if model_used
        else "Scoring engine: Expanded heuristic fallback"
    )

    return factors


def compute_risk_score(
    extracted: ExtractedReport,
    trust: TrustResult,
) -> RiskResult:
    """
    Compute hotspot risk score (0–100), label, explanation, and escalation window.
    """
    fever = extracted.fever_cases or 0

    rain_multiplier = _rain_multiplier_for_ward(extracted.ward)
    corroboration_bonus = cross_report_corroboration_bonus(extracted, trust.trust_score)
    feature_map = build_features(
        extracted=extracted,
        trust=trust,
        rain_multiplier=rain_multiplier,
        corroboration_bonus=corroboration_bonus,
    )

    model_score = _predict_with_xgb(feature_map)
    model_used = model_score is not None
    score_value = model_score if model_score is not None else _expanded_heuristic(feature_map)
    final_score = int(round(score_value))
    factors = _build_explanations(feature_map, model_used)

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
        f"Signals considered: {len(FEATURE_ORDER)} parameters. "
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
