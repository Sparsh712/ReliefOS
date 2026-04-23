"use client";

import { useState } from "react";
import type { ExtractedReport } from "@/lib/types";

interface ExtractionReviewProps {
  report: ExtractedReport;
  onUpdate?: (updated: ExtractedReport) => void;
}

const URGENCY_OPTIONS = ["low", "medium", "high"] as const;

const URGENCY_STYLES: Record<string, string> = {
  high:   "badge-high",
  medium: "badge-medium",
  low:    "badge-low",
};

// ─── Editable text field ───────────────────────────────────────────────────────
function EditableText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-widest font-semibold text-relief-500">
        {label}
      </label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="—"
        className="bg-relief-900 border border-relief-700 focus:border-amber-500 focus:outline-none rounded-md px-2 py-1 text-sm text-relief-100 placeholder:text-relief-600 transition-colors w-full"
      />
    </div>
  );
}

// ─── Editable number field ─────────────────────────────────────────────────────
function EditableNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-widest font-semibold text-relief-500">
        {label}
      </label>
      <input
        type="number"
        min={0}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        placeholder="—"
        className="bg-relief-900 border border-relief-700 focus:border-amber-500 focus:outline-none rounded-md px-2 py-1 text-sm text-relief-100 placeholder:text-relief-600 transition-colors w-full"
      />
    </div>
  );
}

// ─── Editable boolean toggle ───────────────────────────────────────────────────
function EditableBool({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest font-semibold text-relief-500">
        {label}
      </span>
      <div className="flex gap-1.5 mt-0.5">
        {[
          { label: "Yes ⚠", val: true,  cls: "text-red-400 border-red-700" },
          { label: "No",    val: false, cls: "text-green-400 border-green-700" },
          { label: "—",     val: null,  cls: "text-relief-500 border-relief-700" },
        ].map(({ label: lbl, val, cls }) => (
          <button
            key={String(val)}
            onClick={() => onChange(val)}
            className={`text-xs px-2 py-0.5 rounded border transition-all ${
              value === val
                ? `${cls} bg-relief-800 font-semibold`
                : "text-relief-600 border-relief-800 hover:border-relief-600"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ExtractionReview({ report, onUpdate }: ExtractionReviewProps) {
  const [draft, setDraft] = useState<ExtractedReport>(report);
  const [saved, setSaved] = useState(false);

  const conf = Math.round(draft.extraction_confidence * 100);

  function patch<K extends keyof ExtractedReport>(key: K, value: ExtractedReport[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    onUpdate?.(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="label">Structured Extraction</h3>
          <p className="text-[11px] text-relief-500 mt-0.5">Click any field to correct OCR errors</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-relief-500">Confidence</span>
          <span className={`text-xs font-bold ${conf >= 70 ? "text-green-400" : conf >= 45 ? "text-amber-400" : "text-red-400"}`}>
            {conf}%
          </span>
        </div>
      </div>

      {/* Editable grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <EditableText  label="Ward"         value={draft.ward}            onChange={(v) => patch("ward", v)} />
        <EditableText  label="Location"     value={draft.location_text}   onChange={(v) => patch("location_text", v)} />
        <EditableText  label="Geo hint"     value={draft.geo_hint}        onChange={(v) => patch("geo_hint", v)} />
        <EditableNumber label="HH Surveyed" value={draft.households_surveyed} onChange={(v) => patch("households_surveyed", v)} />
        <EditableNumber label="HH Affected" value={draft.households_affected} onChange={(v) => patch("households_affected", v)} />
        <EditableNumber label="Fever cases" value={draft.fever_cases}     onChange={(v) => patch("fever_cases", v)} />

        {/* Urgency select */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest font-semibold text-relief-500">
            Urgency
          </label>
          <select
            value={draft.urgency_level ?? ""}
            onChange={(e) =>
              patch("urgency_level", (e.target.value as typeof draft.urgency_level) || null)
            }
            className="bg-relief-900 border border-relief-700 focus:border-amber-500 focus:outline-none rounded-md px-2 py-1 text-sm text-relief-100 transition-colors"
          >
            <option value="">— unknown</option>
            {URGENCY_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u.toUpperCase()}
              </option>
            ))}
          </select>
          {draft.urgency_level && (
            <span className={`mt-0.5 self-start ${URGENCY_STYLES[draft.urgency_level]}`}>
              {draft.urgency_level.toUpperCase()}
            </span>
          )}
        </div>

        <EditableBool label="Stagnant water"    value={draft.stagnant_water}      onChange={(v) => patch("stagnant_water", v)} />
        <EditableBool label="Water quality"     value={draft.water_quality_issue}  onChange={(v) => patch("water_quality_issue", v)} />
        <EditableBool label="Medicine shortage" value={draft.medicine_shortage}    onChange={(v) => patch("medicine_shortage", v)} />
      </div>

      {/* Vulnerable groups */}
      {draft.vulnerable_groups.length > 0 && (
        <div>
          <span className="label block mb-1.5">Vulnerable groups</span>
          <div className="flex flex-wrap gap-1.5">
            {draft.vulnerable_groups.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded-full border border-relief-600 text-xs text-relief-300 capitalize">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {draft.source_notes && (
        <div>
          <span className="label block mb-1">Notes</span>
          <p className="text-xs text-relief-400 leading-relaxed">{draft.source_notes}</p>
        </div>
      )}

      {/* Save button */}
      {onUpdate && (
        <div className="flex justify-end pt-1 border-t border-relief-800">
          <button
            onClick={handleSave}
            className={`btn-primary text-sm transition-all ${saved ? "bg-green-600 hover:bg-green-600" : ""}`}
          >
            {saved ? "✓ Saved" : "Confirm Extraction"}
          </button>
        </div>
      )}
    </div>
  );
}
