"use client";

interface OcrPreviewProps {
  text: string;
  confidence: number;
}

export default function OcrPreview({ text, confidence }: OcrPreviewProps) {
  const pct = Math.round(confidence * 100);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="label">OCR Output</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-relief-500">OCR confidence</span>
          <span className={`text-xs font-bold ${pct >= 75 ? "text-green-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {pct}%
          </span>
          {/* Mini bar */}
          <div className="w-16 h-1.5 bg-relief-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct >= 75 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <pre className="mono-block text-[13px] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin">
        {text}
      </pre>
    </div>
  );
}
