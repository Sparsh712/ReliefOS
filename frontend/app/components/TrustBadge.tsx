"use client";

import { useState } from "react";
import type { TrustResult } from "@/lib/types";

interface TrustBadgeProps {
  trust: TrustResult;
}

const LABEL_STYLES: Record<string, string> = {
  High:   "badge-trust-high",
  Medium: "badge-trust-medium",
  Low:    "badge-trust-low",
};

const RING_COLORS: Record<string, string> = {
  High:   "#22c55e",
  Medium: "#f59e0b",
  Low:    "#ef4444",
};

export default function TrustBadge({ trust }: TrustBadgeProps) {
  const [open, setOpen] = useState(false);
  const pct     = Math.round(trust.trust_score * 100);
  const color   = RING_COLORS[trust.confidence_label] ?? "#94a3b8";
  const radius  = 20;
  const circ    = 2 * Math.PI * radius;
  const offset  = circ - (pct / 100) * circ;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="label">Report Trust Score</h3>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-relief-500 hover:text-accent-400 transition-colors"
        >
          {open ? "Hide details ↑" : "Show factors ↓"}
        </button>
      </div>

      <div className="flex items-center gap-5">
        {/* Radial gauge */}
        <div className="relative flex-shrink-0 w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r={radius} fill="none" stroke="#1e293b" strokeWidth="5" />
            <circle
              cx="24" cy="24" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-relief-100">
            {pct}%
          </span>
        </div>

        <div className="space-y-1">
          <span className={LABEL_STYLES[trust.confidence_label]}>
            {trust.confidence_label} Confidence
          </span>
          <p className="text-xs text-relief-400 leading-snug">
            {trust.confidence_label === "High"
              ? "Data is reliable — proceed with confidence."
              : trust.confidence_label === "Medium"
              ? "Moderate reliability — verify key signals."
              : "Low reliability — treat as preliminary signal only."}
          </p>
        </div>
      </div>

      {/* Expandable factor breakdown */}
      {open && (
        <ul className="space-y-2 pt-1 border-t border-relief-700">
          {trust.factors.map((f, i) => (
            <li key={i} className="flex items-start justify-between gap-3 text-xs">
              <span className="text-relief-400">{f.label}</span>
              <span className={`font-medium flex-shrink-0 ${
                f.impact === "positive" ? "text-green-400"
                : f.impact === "negative" ? "text-red-400"
                : "text-relief-400"
              }`}>
                {f.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
