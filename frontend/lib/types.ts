// ─── Upload Response ──────────────────────────────────────────────────────────
export interface UploadResponse {
  report_id: string;
  image_url: string;
  raw_ocr_text: string;
  ocr_confidence: number;
}

// ─── Feedback Result ──────────────────────────────────────────────────────────
export interface FeedbackResult {
  deployment_id: string;
  status: string;
  risk_adjustment: number;
  message: string;
}

// ─── Extracted Report (from Gemini) ──────────────────────────────────────────
export interface ExtractedReport {
  report_id: string;
  location_text: string | null;
  ward: string | null;
  geo_hint: string | null;
  households_affected: number | null;
  fever_cases: number | null;
  stagnant_water: boolean | null;
  medicine_shortage: boolean | null;
  water_quality_issue: boolean | null;
  vulnerable_groups: string[];
  urgency_level: "low" | "medium" | "high" | null;
  source_notes: string | null;
  extraction_confidence: number; // 0–1
}

// ─── Trust Result ─────────────────────────────────────────────────────────────
export interface TrustFactor {
  label: string;
  value: string;
  impact: "positive" | "negative" | "neutral";
}

export interface TrustResult {
  trust_score: number;             // 0–1
  confidence_label: "High" | "Medium" | "Low";
  factors: TrustFactor[];
}

// ─── Risk Result ──────────────────────────────────────────────────────────────
export interface RiskResult {
  score: number;                   // 0–100
  label: "Low" | "Medium" | "High";
  explanation: string;
  escalation_window: string;       // e.g. "~4 days"
  contributing_factors: string[];
  rain_multiplier: number;
}

// ─── Intervention ─────────────────────────────────────────────────────────────
export interface Intervention {
  title: string;
  description: string;
  rationale: string;
  urgency: "low" | "medium" | "high";
  team_composition: string[];
  minimum_effective: string;       // smallest action to prevent escalation
  ranking_score: number;
}

export interface InterventionsResult {
  primary: Intervention;
  alternatives: Intervention[];
  evidence_trail: EvidenceTrail;
}

export interface EvidenceTrail {
  key_facts: string[];
  context_signals: string[];
  reasoning: string;
}

// ─── Volunteer & Dispatch ─────────────────────────────────────────────────────
export interface Volunteer {
  name: string;
  skills: string[];
  home_location: string;
  availability: boolean;
  language: string;
  current_load: number;
  max_task_load: number;
}

export interface DispatchPlan {
  team: Volunteer[];
  task_brief: string;
  eta_minutes: number;
  route_summary: string;
  deployment_id: string;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export interface FeedbackInput {
  deployment_id: string;
  people_reached: number;
  resolved: boolean;
  remaining_issues: string;
  notes: string;
}

// ─── Pipeline state (frontend session) ───────────────────────────────────────
export interface PipelineState {
  reportId: string | null;
  imageUrl: string | null;
  ocrText: string | null;
  extracted: ExtractedReport | null;
  trust: TrustResult | null;
  risk: RiskResult | null;
  interventions: InterventionsResult | null;
  dispatch: DispatchPlan | null;
}
