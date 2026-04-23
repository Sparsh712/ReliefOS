"use client";

import { useCallback, useRef, useState } from "react";

interface UploadDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const SAMPLE_REPORTS = [
  { label: "Rohini – High Risk",    src: "/sample-reports/report-rohini.png",    filename: "report-rohini.png"    },
  { label: "Seelampur – Medium",    src: "/sample-reports/report-seelampur.png", filename: "report-seelampur.png" },
  { label: "Najafgarh – Low-Med",   src: "/sample-reports/report-najafgarh.png", filename: "report-najafgarh.png" },
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
    <div className="space-y-4">
      {/* Drop zone */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          w-full rounded-2xl border-2 border-dashed p-12
          flex flex-col items-center justify-center gap-3 text-center
          transition-all duration-200 cursor-pointer group
          disabled:opacity-50 disabled:cursor-not-allowed
          ${dragging
            ? "border-accent-400 bg-accent-500/10 scale-[1.01]"
            : "border-relief-600 hover:border-accent-500/70 hover:bg-accent-500/5 bg-relief-900/50"}
        `}
      >
        {/* Upload icon */}
        <div className={`
          w-14 h-14 rounded-full flex items-center justify-center
          transition-colors duration-200
          ${dragging ? "bg-accent-500/20" : "bg-relief-800 group-hover:bg-relief-700"}
        `}>
          <svg
            className={`w-7 h-7 transition-colors ${dragging ? "text-accent-400" : "text-relief-400 group-hover:text-accent-400"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div>
          <p className="text-relief-200 font-medium text-sm">
            {dragging ? "Drop to analyze" : "Drop a field report image"}
          </p>
          <p className="text-relief-500 text-xs mt-1">
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
      <div className="flex items-center gap-3">
        <span className="label flex-shrink-0">Quick load</span>
        <div className="flex-1 h-px bg-relief-800" />
        <div className="flex gap-2">
          {SAMPLE_REPORTS.map((s) => (
            <button
              key={s.src}
              type="button"
              disabled={disabled}
              onClick={() => loadSample(s.src, s.filename)}
              className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
