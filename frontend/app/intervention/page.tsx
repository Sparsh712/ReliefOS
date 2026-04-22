"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import StepProgress from "@/app/components/StepProgress";
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
        <StepProgress currentStep={5} />
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

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
      <StepProgress currentStep={5} />

      <div>
        <h1 className="text-2xl font-bold text-relief-100">Intervention Planner</h1>
        <p className="text-relief-400 text-sm mt-1">
          Recommended actions are ranked by risk severity, trust confidence, intervention fit, and travel cost.
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

      <div className="grid grid-cols-1 gap-4">
        <InterventionCard intervention={result.primary} kind="primary" />

        {result.alternatives.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.alternatives.map((item) => (
              <InterventionCard key={item.title} intervention={item} kind="alternative" />
            ))}
          </div>
        )}
      </div>

      <EvidenceTrail evidence={result.evidence_trail} />

      <div className="pt-2 border-t border-relief-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-relief-500">Phase 5 complete: recommendation ranking with explainable evidence trail.</p>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost text-sm">
            Back to Dashboard
          </button>
          <button onClick={() => router.push("/dispatch")} className="btn-primary text-sm">
            Prepare Dispatch
          </button>
        </div>
      </div>
    </main>
  );
}
