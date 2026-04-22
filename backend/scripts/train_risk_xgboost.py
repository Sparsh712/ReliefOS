"""
Train an XGBoost regressor for ward risk scoring and save model artifact.

This uses synthetic training data for MVP development when real historical
outcome labels are not yet available.
"""

from __future__ import annotations

import random
from pathlib import Path

import xgboost as xgb

from lib.risk_features import FEATURE_ORDER


MODEL_PATH = Path(__file__).resolve().parent.parent / "data" / "risk_xgb_model.json"


def synthetic_row() -> tuple[list[float], float]:
    fever_cases = random.randint(0, 12)
    households_affected = random.randint(0, 90)

    stagnant_water = random.choice([0.0, 1.0])
    water_quality_issue = random.choice([0.0, 1.0])
    medicine_shortage = random.choice([0.0, 1.0])

    urgency_medium = 0.0
    urgency_high = 0.0
    urgency_pick = random.random()
    if urgency_pick > 0.72:
        urgency_high = 1.0
    elif urgency_pick > 0.38:
        urgency_medium = 1.0

    vuln_children = random.choice([0.0, 1.0])
    vuln_elderly = random.choice([0.0, 1.0])
    vuln_pregnant = random.choice([0.0, 1.0])
    vuln_disabled = random.choice([0.0, 1.0])

    extraction_confidence = random.uniform(0.45, 0.98)
    trust_score = random.uniform(0.35, 0.98)
    rain_multiplier = random.uniform(1.05, 1.45)
    corroboration_bonus = random.randint(0, 10)

    fever_x_stagnant = fever_cases * stagnant_water
    water_x_shortage = water_quality_issue * medicine_shortage

    features = {
        "fever_cases": float(fever_cases),
        "households_affected": float(households_affected),
        "stagnant_water": stagnant_water,
        "water_quality_issue": water_quality_issue,
        "medicine_shortage": medicine_shortage,
        "urgency_medium": urgency_medium,
        "urgency_high": urgency_high,
        "vuln_children": vuln_children,
        "vuln_elderly": vuln_elderly,
        "vuln_pregnant": vuln_pregnant,
        "vuln_disabled": vuln_disabled,
        "extraction_confidence": extraction_confidence,
        "trust_score": trust_score,
        "rain_multiplier": rain_multiplier,
        "corroboration_bonus": float(corroboration_bonus),
        "fever_x_stagnant": float(fever_x_stagnant),
        "water_x_shortage": water_x_shortage,
    }

    # Synthetic target function with mild randomness to emulate noisy outcomes.
    target = (
        7.4 * features["fever_cases"]
        + 0.33 * features["households_affected"]
        + 13.0 * features["stagnant_water"]
        + 10.0 * features["water_quality_issue"]
        + 8.0 * features["medicine_shortage"]
        + 5.0 * features["urgency_medium"]
        + 11.5 * features["urgency_high"]
        + 4.0 * features["vuln_children"]
        + 3.0 * features["vuln_elderly"]
        + 3.0 * features["vuln_pregnant"]
        + 2.0 * features["vuln_disabled"]
        + 1.8 * features["corroboration_bonus"]
        + 1.0 * features["fever_x_stagnant"]
        + 5.0 * features["water_x_shortage"]
    )

    target *= features["rain_multiplier"] * (0.90 + 0.18 * features["trust_score"] * features["extraction_confidence"])
    target += random.uniform(-4.0, 4.0)
    target = max(0.0, min(100.0, target))

    row = [features[name] for name in FEATURE_ORDER]
    return row, target


def train_model(samples: int = 3000) -> None:
    data: list[list[float]] = []
    labels: list[float] = []

    for _ in range(samples):
        row, target = synthetic_row()
        data.append(row)
        labels.append(target)

    split = int(samples * 0.85)
    x_train, y_train = data[:split], labels[:split]
    x_valid, y_valid = data[split:], labels[split:]

    dtrain = xgb.DMatrix(x_train, label=y_train, feature_names=FEATURE_ORDER)
    dvalid = xgb.DMatrix(x_valid, label=y_valid, feature_names=FEATURE_ORDER)

    params = {
        "objective": "reg:squarederror",
        "eval_metric": "mae",
        "max_depth": 5,
        "eta": 0.05,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "seed": 42,
    }

    model = xgb.train(
        params=params,
        dtrain=dtrain,
        num_boost_round=240,
        evals=[(dtrain, "train"), (dvalid, "valid")],
        verbose_eval=False,
    )

    preds = model.predict(dvalid)
    mae = sum(abs(p - y) for p, y in zip(preds, y_valid)) / max(len(y_valid), 1)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    model.save_model(str(MODEL_PATH))

    print(f"Trained XGBoost model with {samples} samples")
    print(f"Validation MAE: {mae:.3f}")
    print(f"Saved model: {MODEL_PATH}")


if __name__ == "__main__":
    train_model()
