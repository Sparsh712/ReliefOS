"use client";

interface InlineAlertProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function InlineAlert({ title, message, actionLabel, onAction }: InlineAlertProps) {
  return (
    <div className="card border-red-900/60 bg-red-950/30 space-y-3">
      <p className="text-red-400 font-semibold text-sm">{title}</p>
      <p className="text-relief-400 text-xs font-mono">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-ghost text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
