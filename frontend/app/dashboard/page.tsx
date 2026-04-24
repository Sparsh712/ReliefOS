"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import StepProgress from "@/app/components/StepProgress";
import RiskGauge from "@/app/components/RiskGauge";
import EscalationClock from "@/app/components/EscalationClock";
import LoadingStateCard from "@/app/components/LoadingStateCard";
import InlineAlert from "@/app/components/InlineAlert";
import WardLeaderboard from "@/app/components/WardLeaderboard";
import WardMap from "@/app/components/WardMap";
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
        <h1 className="text-3xl font-black tracking-tight">Hotspot Risk Dashboard</h1>
        <p className="text-[var(--text-secondary)] text-lg mt-2 font-medium">
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

      {risk.silent_zone_warnings && risk.silent_zone_warnings.length > 0 && (
        <div className="space-y-3">
          {risk.silent_zone_warnings.map((warning, i) => (
            <div key={i} className="bg-amber-950/40 border border-amber-800 rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl">🚨</span>
              <div>
                <h3 className="text-sm font-semibold text-amber-500">Silent Zone Detected</h3>
                <p className="text-xs text-amber-200/70 mt-0.5 leading-relaxed">{warning}</p>
              </div>
            </div>
          ))}
        </div>
      )}

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

      <WardLeaderboard
        wards={rankedWards.map((w) => ({
          ...w,
          isCurrent: w.ward.toLowerCase() === (pipeline.extracted?.ward ?? "").toLowerCase(),
        }))}
      />

      <WardMap
        scores={rankedWards}
        currentWard={pipeline.extracted?.ward}
      />

      <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">
        <button onClick={() => router.push("/upload")} className="px-6 py-3 text-sm font-black uppercase tracking-widest border-2 border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all rounded-sm">
          ← Analyze Another Report
        </button>
        <button onClick={() => router.push("/intervention")} className="btn-human px-8 py-3 text-sm">
          Plan Intervention →
        </button>
      </div>
    </main>
  );
}
