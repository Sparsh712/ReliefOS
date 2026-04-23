"""
models.py — Shared Pydantic models for the ReliefOS API.
All routers import from here; keeps schemas in one place.
"""

from __future__ import annotations
from typing import Literal, Optional
from pydantic import AliasChoices, BaseModel, Field


# ─── Upload / OCR ────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    report_id: str
    image_url: str
    raw_ocr_text: str
    ocr_confidence: float = Field(ge=0.0, le=1.0)


# ─── Extracted Report ─────────────────────────────────────────────────────────

class ExtractedReport(BaseModel):
    report_id: str
    location_text: Optional[str] = None
    ward: Optional[str] = None
    geo_hint: Optional[str] = None
    households_surveyed: Optional[int] = None
    households_affected: Optional[int] = None
    fever_cases: Optional[int] = None
    stagnant_water: Optional[bool] = None
    medicine_shortage: Optional[bool] = None
    water_quality_issue: Optional[bool] = None
    vulnerable_groups: list[str] = Field(default_factory=list)
    urgency_level: Optional[Literal["low", "medium", "high"]] = None
    source_notes: Optional[str] = None
    extraction_confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class ExtractRequest(BaseModel):
    report_id: str
    raw_ocr_text: str
    ocr_confidence: float


# ─── Trust Score ──────────────────────────────────────────────────────────────

class TrustFactor(BaseModel):
    label: str
    value: str
    impact: Literal["positive", "negative", "neutral"]


class TrustResult(BaseModel):
    trust_score: float = Field(ge=0.0, le=1.0)
    confidence_label: Literal["High", "Medium", "Low"]
    factors: list[TrustFactor]


class TrustRequest(BaseModel):
    report_id: str
    extracted: ExtractedReport
    ocr_confidence: float


# ─── Risk Score ───────────────────────────────────────────────────────────────

class RiskResult(BaseModel):
    score: int = Field(ge=0, le=100)
    label: Literal["Low", "Medium", "High"]
    explanation: str
    escalation_window: str           # e.g. "~4 days"
    contributing_factors: list[str]
    rain_multiplier: float
    silent_zone_warnings: list[str] = []


class RiskRequest(BaseModel):
    report_id: str
    extracted: ExtractedReport
    trust: TrustResult


# ─── Interventions ────────────────────────────────────────────────────────────

class Intervention(BaseModel):
    title: str
    description: str
    rationale: str
    urgency: Literal["low", "medium", "high"]
    team_composition: list[str]
    minimum_effective: str
    ranking_score: float


class EvidenceTrail(BaseModel):
    key_facts: list[str]
    context_signals: list[str]
    reasoning: str


class InterventionsResult(BaseModel):
    primary: Intervention
    alternatives: list[Intervention]
    evidence_trail: EvidenceTrail


class InterventionsRequest(BaseModel):
    report_id: str
    extracted: ExtractedReport
    trust: TrustResult
    risk: RiskResult


# ─── Volunteer & Dispatch ─────────────────────────────────────────────────────

class Volunteer(BaseModel):
    name: str
    skills: list[str]
    home_location: str = Field(validation_alias=AliasChoices("home_location", "area"))
    availability: bool = Field(validation_alias=AliasChoices("availability", "available"))
    language: str
    current_load: int = 0
    max_task_load: int = 3


class DispatchPlan(BaseModel):
    deployment_id: str
    team: list[Volunteer]
    task_brief: str
    eta_minutes: int
    route_summary: str


class DispatchRequest(BaseModel):
    report_id: str
    ward: str
    intervention: Intervention
    risk: RiskResult


# ─── Feedback ─────────────────────────────────────────────────────────────────

class FeedbackInput(BaseModel):
    deployment_id: str
    people_reached: int = Field(ge=0)
    resolved: bool
    remaining_issues: str = ""
    notes: str = ""


class FeedbackResult(BaseModel):
    deployment_id: str
    status: str
    risk_adjustment: int             # positive = increased, negative = decreased
    message: str
