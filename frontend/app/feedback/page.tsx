"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import FeedbackForm from "@/app/components/FeedbackForm";
import InlineAlert from "@/app/components/InlineAlert";
import { submitFeedback } from "@/lib/api";
import type { FeedbackInput, FeedbackResult, PipelineState } from "@/lib/types";

export default function FeedbackPage() {
  const router = useRouter();
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("reliefos_pipeline");
    if (!raw) {
      router.replace("/upload");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PipelineState;
      setPipeline(parsed);
      if (!parsed.dispatch || !parsed.risk) {
        router.replace("/dispatch");
      }
    } catch {
      router.replace("/upload");
    }
  }, [router]);

  const adjustedRiskScore = useMemo(() => {
    if (!pipeline?.risk || !result) return null;
    return Math.max(0, Math.min(100, pipeline.risk.score + result.risk_adjustment));
  }, [pipeline, result]);

  const handleSubmit = useCallback(
    async (payload: FeedbackInput) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await submitFeedback(payload);
        setResult(response);

        if (pipeline?.risk) {
          const nextRiskScore = Math.max(0, Math.min(100, pipeline.risk.score + response.risk_adjustment));
          const nextRiskLabel = nextRiskScore >= 70 ? "High" : nextRiskScore >= 40 ? "Medium" : "Low";
          const nextState: PipelineState = {
            ...pipeline,
            risk: {
              ...pipeline.risk,
              score: nextRiskScore,
              label: nextRiskLabel,
              explanation: `${pipeline.risk.explanation} Feedback adjustment applied: ${response.risk_adjustment >= 0 ? "+" : ""}${response.risk_adjustment}.`,
            },
          };
          setPipeline(nextState);
          localStorage.setItem("reliefos_pipeline", JSON.stringify(nextState));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit feedback.");
      } finally {
        setSubmitting(false);
      }
    },
    [pipeline],
  );

  if (!pipeline?.dispatch || !pipeline.risk) {
    return null;
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

      <div>
        <h1 className="text-3xl font-black tracking-tight">Feedback Loop</h1>
        <p className="text-[var(--text-secondary)] text-lg mt-2 font-medium">
          Capture outcome data so hotspot risk can be updated based on on-ground resolution.
        </p>
      </div>

      {error && (
        <InlineAlert
          title="Feedback submission failed"
          message={error}
        />
      )}

      <FeedbackForm
        deploymentId={pipeline.dispatch.deployment_id}
        onSubmit={handleSubmit}
        loading={submitting}
      />

      {result && (
        <section className="card space-y-3 border-accent-500/50">
          <p className="label">Updated Risk</p>
          <p className="text-sm text-relief-200">{result.message}</p>

          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-accent-400 leading-none">{adjustedRiskScore}</p>
            <p className="text-sm text-relief-400 mb-1">/100 after feedback</p>
          </div>

          <p className="text-xs text-relief-500">Adjustment applied: {result.risk_adjustment >= 0 ? "+" : ""}{result.risk_adjustment}</p>
        </section>
      )}

      <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-end gap-4">
        <button onClick={() => router.push("/dispatch")} className="px-6 py-3 text-sm font-black uppercase tracking-widest border-2 border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all rounded-sm">
          ← Back to Dispatch
        </button>
        <button onClick={() => router.push("/upload")} className="btn-human px-8 py-3 text-sm">
          Start New Report →
        </button>
      </div>
    </main>
  );
}
