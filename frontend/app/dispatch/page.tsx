"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DispatchPanel from "@/app/components/DispatchPanel";
import LoadingStateCard from "@/app/components/LoadingStateCard";
import InlineAlert from "@/app/components/InlineAlert";
import { dispatchTeam } from "@/lib/api";
import type { DispatchPlan, PipelineState } from "@/lib/types";

export default function DispatchPage() {
  const router = useRouter();
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [plan, setPlan] = useState<DispatchPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const computeDispatch = useCallback(
    async (state: PipelineState) => {
      if (!state.interventions || !state.risk || !state.extracted || !state.reportId) {
        router.replace("/intervention");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const ward = state.extracted.ward ?? "Rohini";
        const response = await dispatchTeam({
          report_id: state.reportId,
          ward,
          intervention: state.interventions.primary,
          risk: state.risk,
        });

        const nextState: PipelineState = { ...state, dispatch: response };
        setPipeline(nextState);
        setPlan(response);
        localStorage.setItem("reliefos_pipeline", JSON.stringify(nextState));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to compute dispatch right now.");
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

      if (!parsed.interventions || !parsed.risk) {
        router.replace("/intervention");
        return;
      }

      if (parsed.dispatch) {
        setPlan(parsed.dispatch);
        setLoading(false);
      } else {
        void computeDispatch(parsed);
      }
    } catch {
      router.replace("/upload");
    }
  }, [computeDispatch, router]);

  const handleConfirm = () => {
    setConfirmed(true);
  };

  if (loading) {
    return (
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        <LoadingStateCard
          title="Matching volunteers and calculating ETA..."
          subtitle="Skill match, load balancing, and ward proximity in progress"
        />
      </main>
    );
  }

  if (!pipeline || !plan) {
    return null;
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

      <div>
        <h1 className="text-3xl font-black tracking-tight">Volunteer Dispatch</h1>
        <p className="text-[var(--text-secondary)] text-lg mt-2 font-medium">
          Dispatching the minimum capable team with fastest feasible arrival time.
        </p>
      </div>

      {error && (
        <InlineAlert
          title="Dispatch planning failed"
          message={error}
          actionLabel="Retry dispatch planning"
          onAction={() => void computeDispatch(pipeline)}
        />
      )}

      <DispatchPanel team={plan.team} />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <p className="label">Task Brief</p>
          <p className="text-sm text-relief-300 leading-relaxed">{plan.task_brief}</p>
          <p className="text-xs text-relief-500">Deployment ID: {plan.deployment_id}</p>
        </div>

        <div className="card space-y-3">
          <p className="label">ETA</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-accent-400 leading-none">{plan.eta_minutes}</p>
            <p className="text-sm text-relief-400 mb-1">minutes</p>
          </div>
          <p className="text-xs text-relief-400">{plan.route_summary}</p>
        </div>
      </section>

      <div className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-relief-100">Ready to mobilize team</p>
          <p className="text-xs text-relief-500">Once confirmed, this deployment moves into active response.</p>
        </div>

        {!confirmed ? (
          <button
            onClick={handleConfirm}
            className="px-8 py-3 text-sm font-black uppercase tracking-widest bg-red-600 text-white border-2 border-red-800 shadow-[4px_4px_0px_0px_rgba(127,29,29,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all rounded-sm"
          >
            🚨 Confirm Dispatch
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-green-500/20 border-2 border-green-500 px-6 py-3 rounded-sm">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-black uppercase tracking-widest text-green-400">Dispatch Confirmed</span>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
        <button onClick={() => router.push("/intervention")} className="px-6 py-3 text-sm font-black uppercase tracking-widest border-2 border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all rounded-sm">
          ← Back to Intervention
        </button>
        <button
          onClick={() => router.push("/feedback")}
          className="btn-human px-8 py-3 text-sm"
          disabled={!confirmed}
        >
          Submit Feedback →
        </button>
      </div>
    </main>
  );
}
