"use client";

import type { Intervention } from "@/lib/types";

interface InterventionCardProps {
  intervention: Intervention;
  kind: "primary" | "alternative";
}

function urgencyColor(urgency: Intervention["urgency"]) {
  if (urgency === "high") return {
    badge: "bg-red-500 border-red-700 text-white shadow-[3px_3px_0px_0px_rgba(127,29,29,1)]",
    border: "border-red-500/40",
    glow: "shadow-red-900/20",
  };
  if (urgency === "medium") return {
    badge: "bg-amber-400 border-amber-600 text-gray-900 shadow-[3px_3px_0px_0px_rgba(120,53,15,1)]",
    border: "border-amber-500/40",
    glow: "shadow-amber-900/20",
  };
  return {
    badge: "bg-green-500 border-green-700 text-white shadow-[3px_3px_0px_0px_rgba(20,83,45,1)]",
    border: "border-green-500/40",
    glow: "shadow-green-900/20",
  };
}

export default function InterventionCard({ intervention, kind }: InterventionCardProps) {
  const colors = urgencyColor(intervention.urgency);

  return (
    <article className={`
      relative rounded-sm border-2 p-6 space-y-5
      bg-[var(--bg-surface)] shadow-lg
      ${kind === "primary"
        ? `border-[var(--text-primary)] shadow-xl`
        : `border-[var(--border)] hover:border-[var(--text-primary)] transition-colors`}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">
            {kind === "primary" ? "⭐ Primary Recommendation" : "Alternative"}
          </p>
          <h3 className="text-xl font-black tracking-tight leading-tight">
            {intervention.title}
          </h3>
        </div>
        <span className={`flex-shrink-0 px-4 py-1.5 text-xs font-black uppercase tracking-widest border-2 ${colors.badge}`}>
          {intervention.urgency}
        </span>
      </div>

      {/* Description */}
      <p className="text-[var(--text-secondary)] leading-relaxed font-medium border-l-4 border-[var(--border)] pl-4">
        {intervention.description}
      </p>

      {/* Details — 3 clearly visible boxes */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-zinc-800/60 dark:bg-zinc-800 border border-zinc-600 rounded-sm px-4 py-3">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-1">Rationale</span>
          <p className="text-sm text-zinc-200 font-medium">{intervention.rationale}</p>
        </div>
        <div className="bg-zinc-800/60 dark:bg-zinc-800 border border-zinc-600 rounded-sm px-4 py-3">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-1">Minimum Effective Action</span>
          <p className="text-sm text-zinc-200 font-medium">{intervention.minimum_effective}</p>
        </div>
        <div className="bg-zinc-800/60 dark:bg-zinc-800 border border-zinc-600 rounded-sm px-4 py-3">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-1">Ranking Score</span>
          <p className="text-2xl font-black text-white">{intervention.ranking_score}</p>
        </div>
      </div>

      {/* Team Needs */}
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3">Team Needs</p>
        <div className="flex flex-wrap gap-2">
          {intervention.team_composition.map((role) => (
            <span
              key={role}
              className="px-4 py-1.5 text-xs font-black uppercase tracking-widest border-2 border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors cursor-default"
            >
              {role.replace("_", " ")}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
