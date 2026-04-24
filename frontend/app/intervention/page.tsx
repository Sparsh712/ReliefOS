"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import InterventionCard from "@/app/components/InterventionCard";
import EvidenceTrail from "@/app/components/EvidenceTrail";
import LoadingStateCard from "@/app/components/LoadingStateCard";
import InlineAlert from "@/app/components/InlineAlert";
import { getInterventions } from "@/lib/api";
import type { InterventionsResult, PipelineState } from "@/lib/types";

export default function InterventionPage() {
  const router = useRouter();
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [result, setResult] = useState<InterventionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const computeInterventions = useCallback(
    async (state: PipelineState) => {
      if (!state.extracted || !state.trust || !state.risk || !state.reportId) {
        router.replace("/dashboard");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const recommended = await getInterventions({
          report_id: state.reportId,
          extracted: state.extracted,
          trust: state.trust,
          risk: state.risk,
        });

        const nextState: PipelineState = { ...state, interventions: recommended };
        setPipeline(nextState);
        setResult(recommended);
        localStorage.setItem("reliefos_pipeline", JSON.stringify(nextState));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to generate interventions.");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const raw = localStorage.getItem("reliefos_pipeline");
    if (!raw) {
      router.replace("/upload");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PipelineState;
      setPipeline(parsed);

      if (!parsed.risk) {
        router.replace("/dashboard");
        return;
      }

      if (parsed.interventions) {
        setResult(parsed.interventions);
        setLoading(false);
      } else {
        void computeInterventions(parsed);
      }
    } catch {
      router.replace("/upload");
    }
  }, [computeInterventions, router]);

  if (loading) {
    return (
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        <LoadingStateCard
          title="Generating minimum effective intervention plan..."
          subtitle="Applying deterministic field rules with trust and risk weighting"
        />
      </main>
    );
  }

  if (!pipeline || !result) {
    return null;
  }

  // Always show 2 alternative cards — pad if API returns only 1
  const alternatives = result.alternatives.length >= 2
    ? result.alternatives.slice(0, 2)
    : result.alternatives.length === 1
    ? [result.alternatives[0], result.alternatives[0]]
    : [];

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

      <div>
        <h1 className="text-3xl font-black tracking-tight">Intervention Planner</h1>
        <p className="text-[var(--text-secondary)] text-lg mt-2 font-medium">
          Recommended actions ranked by risk severity, trust confidence, and travel cost.
        </p>
      </div>

      {error && (
        <InlineAlert
          title="Intervention generation failed"
          message={error}
          actionLabel="Retry recommendations"
          onAction={() => void computeInterventions(pipeline)}
        />
      )}

      {/* Primary recommendation — full width */}
      <InterventionCard intervention={result.primary} kind="primary" />

      {/* Alternatives — always 2 columns */}
      {alternatives.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alternatives.map((item, idx) => (
            <InterventionCard key={`alt-${idx}`} intervention={item} kind="alternative" />
          ))}
        </div>
      )}

      <EvidenceTrail evidence={result.evidence_trail} />

      <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
        <button onClick={() => router.push("/dashboard")} className="px-6 py-3 text-sm font-black uppercase tracking-widest border-2 border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all rounded-sm">
          ← Back to Dashboard
        </button>
        <button onClick={() => router.push("/dispatch")} className="btn-human px-8 py-3 text-sm">
          Prepare Dispatch →
        </button>
      </div>
    </main>
  );
}
