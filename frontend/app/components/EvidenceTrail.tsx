"use client";

import type { EvidenceTrail as EvidenceTrailModel } from "@/lib/types";

interface EvidenceTrailProps {
  evidence: EvidenceTrailModel;
}

export default function EvidenceTrail({ evidence }: EvidenceTrailProps) {
  return (
    <section className="card space-y-5">
      <div>
        <p className="label">Why This Decision?</p>
        <h2 className="text-lg font-semibold text-relief-100 mt-1">Evidence Trail</h2>
      </div>

      <div>
        <p className="text-sm font-semibold text-relief-200 mb-2">Extracted Facts</p>
        {evidence.key_facts.length > 0 ? (
          <ul className="space-y-2">
            {evidence.key_facts.map((fact) => (
              <li key={fact} className="text-xs text-relief-300 bg-relief-900 border border-relief-700 rounded-lg px-3 py-2">
                {fact}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-relief-500">No report facts were extracted.</p>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-relief-200 mb-2">Corroborating Context</p>
        <ul className="space-y-2">
          {evidence.context_signals.map((signal) => (
            <li key={signal} className="text-xs text-relief-300 bg-relief-900 border border-relief-700 rounded-lg px-3 py-2">
              {signal}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-relief-700 pt-4">
        <p className="text-sm font-semibold text-relief-200 mb-2">Reasoning Chain</p>
        <p className="text-sm text-relief-300 leading-relaxed">{evidence.reasoning}</p>
      </div>
    </section>
  );
}
