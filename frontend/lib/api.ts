/**
 * lib/api.ts — Typed API client for the ReliefOS FastAPI backend.
 * All calls go to NEXT_PUBLIC_API_URL (default: http://localhost:8000).
 */

import type {
  UploadResponse,
  ExtractedReport,
  TrustResult,
  RiskResult,
  InterventionsResult,
  DispatchPlan,
  FeedbackInput,
  FeedbackResult,
} from "./types";

// ---------- helpers ----------

// Extend ExtractedReport with report_id for the request
interface ExtractRequest {
  report_id: string;
  raw_ocr_text: string;
  ocr_confidence: number;
}

interface TrustRequest {
  report_id: string;
  extracted: ExtractedReport;
  ocr_confidence: number;
}

interface RiskRequest {
  report_id: string;
  extracted: ExtractedReport;
  trust: TrustResult;
}

interface InterventionsRequest {
  report_id: string;
  extracted: ExtractedReport;
  trust: TrustResult;
  risk: RiskResult;
}

interface DispatchRequest {
  report_id: string;
  ward: string;
  intervention: InterventionsResult["primary"];
  risk: RiskResult;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------- public API ----------

export async function uploadReport(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<UploadResponse>;
}

export function extractReport(req: ExtractRequest): Promise<ExtractedReport> {
  return post<ExtractedReport>("/extract", req);
}

export function scoreTrust(req: TrustRequest): Promise<TrustResult> {
  return post<TrustResult>("/trust", req);
}

export function scoreRisk(req: RiskRequest): Promise<RiskResult> {
  return post<RiskResult>("/risk", req);
}

export function getInterventions(req: InterventionsRequest): Promise<InterventionsResult> {
  return post<InterventionsResult>("/interventions", req);
}

export function dispatchTeam(req: DispatchRequest): Promise<DispatchPlan> {
  return post<DispatchPlan>("/dispatch", req);
}

export function submitFeedback(req: FeedbackInput): Promise<FeedbackResult> {
  return post<FeedbackResult>("/feedback", req);
}
