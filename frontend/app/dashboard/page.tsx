"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import StepProgress from "@/app/components/StepProgress";
import RiskGauge from "@/app/components/RiskGauge";
import EscalationClock from "@/app/components/EscalationClock";
import LoadingStateCard from "@/app/components/LoadingStateCard";
import InlineAlert from "@/app/components/InlineAlert";
import { scoreRisk } from "@/lib/api";
import type { PipelineState, RiskResult } from "@/lib/types";

const WARD_MULTIPLIERS: Record<string, number> = {
  rohini: 1.4,
  dwarka: 1.2,
  seelampur: 1.3,
  "laxmi nagar": 1.1,
  najafgarh: 1.35,
};

const WARD_ADJACENCY: Record<string, string[]> = {
  rohini: ["Dwarka", "Najafgarh"],
  dwarka: ["Rohini", "Najafgarh"],
  seelampur: ["Laxmi Nagar"],
  "laxmi nagar": ["Seelampur"],
  najafgarh: ["Rohini", "Dwarka"],
};

interface RankedWardCard {
  ward: string;
  score: number;
  label: "Low" | "Medium" | "High";
  escalation: string;
}

function labelFromScore(score: number): "Low" | "Medium" | "High" {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function badgeClass(label: "Low" | "Medium" | "High"): string {
  if (label === "High") return "badge-high";
  if (label === "Medium") return "badge-medium";
  return "badge-low";
}

function estimatedEscalation(score: number, label: "Low" | "Medium" | "High"): string {
  if (label === "High") return "Escalation risk active now";
  if (score >= 55) return "~3 days to High if no action taken";
  if (label === "Medium") return "~5 days to High if no action taken";
  return "~7 days to Medium if no action taken";
}

export default function DashboardPage() {
  const router = useRouter();
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const computeRisk = useCallback(
    async (state: PipelineState) => {
      if (!state.extracted || !state.trust || !state.reportId) {
        router.replace("/upload");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const scored = await scoreRisk({
          report_id: state.reportId,
          extracted: state.extracted,
          trust: state.trust,
        });

        const nextState: PipelineState = { ...state, risk: scored };
        setPipeline(nextState);
        setRisk(scored);
        localStorage.setItem("reliefos_pipeline", JSON.stringify(nextState));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to score risk right now.");
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

      if (parsed.risk) {
        setRisk(parsed.risk);
        setLoading(false);
      } else {
        void computeRisk(parsed);
      }
    } catch {
      router.replace("/upload");
    }
  }, [computeRisk, router]);

  const rankedWards = useMemo<RankedWardCard[]>(() => {
    if (!pipeline?.extracted || !risk) return [];

    const currentWard = pipeline.extracted.ward ?? "Unknown Ward";
    const currentKey = currentWard.toLowerCase();
    const currentMultiplier = WARD_MULTIPLIERS[currentKey] ?? 1.2;

    const cards: RankedWardCard[] = [
      {
        ward: currentWard,
        score: risk.score,
        label: risk.label,
        escalation: risk.escalation_window,
      },
    ];

    const fallbackWards = Object.keys(WARD_MULTIPLIERS)
      .map((name) => name.split(" ").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "))
      .filter((name) => name.toLowerCase() !== currentKey)
      .slice(0, 3);

    const nearby = WARD_ADJACENCY[currentKey] ?? fallbackWards;

    for (const ward of nearby) {
      const wardKey = ward.toLowerCase();
      const multiplier = WARD_MULTIPLIERS[wardKey] ?? 1.2;
      const projected = Math.max(
        8,
        Math.round(risk.score * (multiplier / currentMultiplier) * 0.72),
      );
      const projectedLabel = labelFromScore(projected);

      cards.push({
        ward,
        score: projected,
        label: projectedLabel,
        escalation: estimatedEscalation(projected, projectedLabel),
      });
    }

    return cards.sort((a, b) => b.score - a.score);
  }, [pipeline, risk]);

  if (loading) {
    return (
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        <StepProgress currentStep={4} />
        <LoadingStateCard
          title="Computing hotspot risk and escalation clock..."
          subtitle="Using extracted signals and ward rainfall multiplier"
        />
      </main>
    );
  }

  if (!pipeline?.extracted || !risk) {
    return null;
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
      <StepProgress currentStep={4} />

      <div>
        <h1 className="text-2xl font-bold text-relief-100">Hotspot Risk Dashboard</h1>
        <p className="text-relief-400 text-sm mt-1">
          Risk scoring blends disease signals, urgency, corroboration, and monsoon intensity.
        </p>
      </div>

      {error && (
        <InlineAlert
          title="Risk computation failed"
          message={error}
          actionLabel="Retry risk scoring"
          onAction={() => void computeRisk(pipeline)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        <RiskGauge score={risk.score} label={risk.label} />
        <EscalationClock escalationWindow={risk.escalation_window} label={risk.label} />
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-relief-100">Risk Explanation</h2>
          <span className={badgeClass(risk.label)}>{risk.label}</span>
        </div>

        <p className="text-sm text-relief-300 leading-relaxed">{risk.explanation}</p>

        <div>
          <p className="label mb-3">Contributing Factors</p>
          {risk.contributing_factors.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {risk.contributing_factors.map((factor) => (
                <li key={factor} className="text-xs text-relief-300 bg-relief-900 border border-relief-700 rounded-lg px-3 py-2">
                  {factor}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-relief-500">No strong risk factors were found.</p>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-relief-100">Ward Priority Queue</h2>
          <p className="text-xs text-relief-500">Sorted by current and nearby projected risk</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rankedWards.map((item) => (
            <article key={item.ward} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-relief-100">{item.ward}</h3>
                <span className={badgeClass(item.label)}>{item.label}</span>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <p className="text-3xl font-bold text-relief-100 leading-none">{item.score}</p>
                <p className="text-xs text-relief-500">/100</p>
              </div>

              <p className="text-xs text-relief-400 mt-2">{item.escalation}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="pt-2 border-t border-relief-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-relief-500">Phase 4 complete: risk score, label, escalation clock, and hotspot ranking.</p>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/upload")} className="btn-ghost text-sm">
            Analyze Another Report
          </button>
          <button onClick={() => router.push("/intervention")} className="btn-primary text-sm">
            Plan Intervention
          </button>
        </div>
      </div>
    </main>
  );
}
