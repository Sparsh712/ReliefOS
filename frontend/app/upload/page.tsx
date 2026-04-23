"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import StepProgress    from "@/app/components/StepProgress";
import UploadDropzone  from "@/app/components/UploadDropzone";
import OcrPreview      from "@/app/components/OcrPreview";
import ExtractionReview from "@/app/components/ExtractionReview";
import TrustBadge      from "@/app/components/TrustBadge";
import LoadingStateCard from "@/app/components/LoadingStateCard";
import InlineAlert from "@/app/components/InlineAlert";

import { uploadReport, extractReport, scoreTrust } from "@/lib/api";
import type { ExtractedReport, TrustResult, UploadResponse } from "@/lib/types";

// ─── Pipeline state for this page ─────────────────────────────────────────────
type Stage =
  | "idle"          // waiting for file
  | "uploading"     // POST /upload in progress
  | "extracting"    // POST /extract in progress
  | "trusting"      // POST /trust in progress
  | "done"          // all three done
  | "error";

interface PageState {
  stage: Stage;
  imagePreview: string | null;
  upload: UploadResponse | null;
  extracted: ExtractedReport | null;
  trust: TrustResult | null;
  error: string | null;
}

const STAGE_LABELS: Record<Stage, string> = {
  idle:       "",
  uploading:  "Running OCR on report image…",
  extracting: "Extracting structured data with Gemini…",
  trusting:   "Scoring report reliability…",
  done:       "",
  error:      "",
};

export default function UploadPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({
    stage: "idle",
    imagePreview: null,
    upload: null,
    extracted: null,
    trust: null,
    error: null,
  });

  const runPipeline = useCallback(async (file: File) => {
    // Show preview immediately
    const preview = URL.createObjectURL(file);
    setState(s => ({ ...s, stage: "uploading", imagePreview: preview, error: null }));

    try {
      // Step 1 — OCR
      const upload = await uploadReport(file);
      setState(s => ({ ...s, stage: "extracting", upload }));

      // Step 2 — Gemini extraction
      const extracted = await extractReport({
        report_id:    upload.report_id,
        raw_ocr_text: upload.raw_ocr_text,
        ocr_confidence: upload.ocr_confidence,
      });
      setState(s => ({ ...s, stage: "trusting", extracted }));

      // Step 3 — Trust score
      const trust = await scoreTrust({
        report_id:     upload.report_id,
        extracted,
        ocr_confidence: upload.ocr_confidence,
      });
      setState(s => ({ ...s, stage: "done", trust }));

      // Persist to localStorage for downstream pages
      localStorage.setItem("reliefos_pipeline", JSON.stringify({
        reportId:   upload.report_id,
        imageUrl:   upload.image_url,
        ocrText:    upload.raw_ocr_text,
        extracted,
        trust,
        risk: null,
        interventions: null,
        dispatch: null,
      }));

    } catch (err) {
      setState(s => ({
        ...s,
        stage: "error",
        error: err instanceof Error ? err.message : "An unexpected error occurred.",
      }));
    }
  }, []);

  const handleReset = () => {
    setState({ stage: "idle", imagePreview: null, upload: null, extracted: null, trust: null, error: null });
  };

  const handleContinue = () => router.push("/dashboard");

  const { stage, imagePreview, upload, extracted, trust, error } = state;
  const busy = stage === "uploading" || stage === "extracting" || stage === "trusting";

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Step progress */}
      <StepProgress currentStep={1} />

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-relief-100">Upload Field Report</h1>
        <p className="text-relief-400 text-sm mt-1">
          Upload a handwritten or printed NGO field report to begin analysis.
        </p>
      </div>

      {/* Upload zone (hidden after done) */}
      {stage !== "done" && (
        <UploadDropzone onFile={runPipeline} disabled={busy} />
      )}

      {/* Processing banner */}
      {busy && (
        <LoadingStateCard
          title={STAGE_LABELS[stage]}
          subtitle="This usually takes 3-8 seconds"
        />
      )}

      {/* Error state */}
      {stage === "error" && (
        <InlineAlert
          title="Analysis failed"
          message={error ?? "Unexpected error"}
          actionLabel="Try again"
          onAction={handleReset}
        />
      )}

      {/* ─── Results (only shown when done) ─────────────────────────────────── */}
      {stage === "done" && upload && extracted && trust && (
        <div className="space-y-6">

          {/* Two-column: image + OCR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

            {/* Image preview */}
            {imagePreview && (
              <div className="card p-0 overflow-hidden">
                <div className="relative aspect-[4/3] w-full bg-relief-900">
                  <Image
                    src={imagePreview}
                    alt="Uploaded field report"
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-relief-700">
                  <span className="label">Field report image</span>
                  <button
                    onClick={handleReset}
                    className="text-xs text-relief-500 hover:text-accent-400 transition-colors"
                  >
                    Upload different ↑
                  </button>
                </div>
              </div>
            )}

            {/* OCR output */}
            <OcrPreview text={upload.raw_ocr_text} confidence={upload.ocr_confidence} />
          </div>

          {/* Extraction review — editable */}
          <ExtractionReview
            report={extracted}
            onUpdate={(updated) =>
              setState((s) => ({ ...s, extracted: updated }))
            }
          />

          {/* Trust badge */}
          <TrustBadge trust={trust} />

          {/* CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-relief-800">
            <p className="text-xs text-relief-500">
              Report ID: <span className="font-mono text-relief-400">{upload.report_id.slice(0, 8)}…</span>
            </p>
            <button
              onClick={handleContinue}
              className="btn-primary flex items-center gap-2"
            >
              View Risk Dashboard
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
