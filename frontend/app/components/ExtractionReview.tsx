"use client";

import type { ExtractedReport } from "@/lib/types";

interface ExtractionReviewProps {
  report: ExtractedReport;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest font-semibold text-relief-500">{label}</span>
      <span className="text-sm text-relief-200 font-medium">{value}</span>
    </div>
  );
}

function Bool({ val }: { val: boolean | null | undefined }) {
  if (val === null || val === undefined) return <span className="text-relief-600">—</span>;
  return val
    ? <span className="text-red-400 font-semibold">Yes ⚠</span>
    : <span className="text-green-400">No</span>;
}

const URGENCY_STYLES: Record<string, string> = {
  high:   "badge-high",
  medium: "badge-medium",
  low:    "badge-low",
};

export default function ExtractionReview({ report }: ExtractionReviewProps) {
  const conf = Math.round(report.extraction_confidence * 100);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="label">Structured Extraction</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-relief-500">Extraction confidence</span>
          <span className={`text-xs font-bold ${conf >= 70 ? "text-green-400" : conf >= 45 ? "text-amber-400" : "text-red-400"}`}>
            {conf}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="Ward"         value={report.ward ?? "—"} />
        <Field label="Location"     value={report.location_text ?? "—"} />
        <Field label="Geo hint"     value={report.geo_hint ?? "—"} />
        <Field label="Households"   value={report.households_affected ?? "—"} />
        <Field label="Fever cases"  value={report.fever_cases ?? "—"} />
        <Field label="Urgency"
          value={
            report.urgency_level
              ? <span className={URGENCY_STYLES[report.urgency_level]}>{report.urgency_level.toUpperCase()}</span>
              : <span className="text-relief-600">—</span>
          }
        />
        <Field label="Stagnant water"    value={<Bool val={report.stagnant_water} />} />
        <Field label="Water quality"     value={<Bool val={report.water_quality_issue} />} />
        <Field label="Medicine shortage" value={<Bool val={report.medicine_shortage} />} />
      </div>

      {report.vulnerable_groups.length > 0 && (
        <div>
          <span className="label block mb-1.5">Vulnerable groups</span>
          <div className="flex flex-wrap gap-1.5">
            {report.vulnerable_groups.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded-full border border-relief-600 text-xs text-relief-300 capitalize">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {report.source_notes && (
        <div>
          <span className="label block mb-1">Notes</span>
          <p className="text-xs text-relief-400 leading-relaxed">{report.source_notes}</p>
        </div>
      )}
    </div>
  );
}
