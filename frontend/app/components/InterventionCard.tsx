"use client";

import type { Intervention } from "@/lib/types";

interface InterventionCardProps {
  intervention: Intervention;
  kind: "primary" | "alternative";
}

function urgencyBadge(urgency: Intervention["urgency"]): string {
  if (urgency === "high") return "badge-high";
  if (urgency === "medium") return "badge-medium";
  return "badge-low";
}

export default function InterventionCard({ intervention, kind }: InterventionCardProps) {
  return (
    <article className={`card space-y-4 ${kind === "primary" ? "border-accent-500/60" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">{kind === "primary" ? "Primary Recommendation" : "Alternative"}</p>
          <h3 className="text-lg font-semibold text-relief-100 mt-1">{intervention.title}</h3>
        </div>
        <span className={urgencyBadge(intervention.urgency)}>{intervention.urgency.toUpperCase()}</span>
      </div>

      <p className="text-sm text-relief-300 leading-relaxed">{intervention.description}</p>

      <div className="space-y-2">
        <p className="text-xs text-relief-400">
          <span className="text-relief-200 font-semibold">Rationale:</span> {intervention.rationale}
        </p>
        <p className="text-xs text-relief-400">
          <span className="text-relief-200 font-semibold">Minimum effective action:</span> {intervention.minimum_effective}
        </p>
        <p className="text-xs text-relief-400">
          <span className="text-relief-200 font-semibold">Ranking score:</span> {intervention.ranking_score}
        </p>
      </div>

      <div>
        <p className="label mb-2">Team Needs</p>
        <div className="flex flex-wrap gap-1.5">
          {intervention.team_composition.map((role) => (
            <span
              key={role}
              className="px-2 py-0.5 rounded-full border border-relief-600 text-xs text-relief-300 capitalize"
            >
              {role.replace("_", " ")}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
