"use client";

import { useCallback, useRef, useState } from "react";

interface UploadDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const SAMPLE_REPORTS = [
  { label: "Rohini – High Risk",    src: "/sample-reports/report-rohini.png",    filename: "report-rohini.png"    },
  { label: "Seelampur – Medium",    src: "/sample-reports/report-seelampur.png", filename: "report-seelampur.png" },
  { label: "Hindi OCR Sample",      src: "/sample-reports/hindi.png",            filename: "hindi.png" },
];

export default function UploadDropzone({ onFile, disabled }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile, disabled]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  const loadSample = async (src: string, filename: string) => {
    if (disabled) return;
    const res  = await fetch(src);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || "image/png" });
    onFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          w-full hand-drawn-border p-16
          flex flex-col items-center justify-center gap-4 text-center
          transition-all duration-200 cursor-pointer group
          disabled:opacity-50 disabled:cursor-not-allowed
          ${dragging
            ? "border-amber-500 bg-amber-500/5 scale-[1.01]"
            : "bg-[var(--bg-surface)] hover:border-amber-500/70 hover:bg-amber-500/5"}
        `}
      >
        {/* Upload icon */}
        <div className={`
          w-20 h-20 rounded-full flex items-center justify-center
          transition-colors duration-200
          ${dragging ? "bg-amber-500/20" : "bg-[var(--bg-elevated)] group-hover:bg-amber-500/10"}
        `}>
          <svg
            className={`w-10 h-10 transition-colors ${dragging ? "text-amber-500" : "text-[var(--text-secondary)] group-hover:text-amber-500"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div>
          <p className="text-2xl font-black tracking-tight">
            {dragging ? "Drop to analyze" : "Drop a field report image"}
          </p>
          <p className="text-[var(--text-secondary)] text-lg mt-2 font-medium">
            JPEG · PNG · WEBP&nbsp;&nbsp;·&nbsp;&nbsp;click to browse
          </p>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {/* Sample reports */}
      <div className="flex items-center gap-6">
        <span className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] flex-shrink-0">Quick load</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        <div className="flex gap-4">
          {SAMPLE_REPORTS.map((s) => (
            <button
              key={s.src}
              type="button"
              disabled={disabled}
              onClick={() => loadSample(s.src, s.filename)}
              className="px-4 py-2 text-sm font-bold uppercase tracking-tighter border-b-2 border-gray-900 dark:border-white hover:text-amber-600 hover:border-amber-600 transition-colors disabled:opacity-40"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
