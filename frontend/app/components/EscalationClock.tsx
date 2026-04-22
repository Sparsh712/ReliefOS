"use client";

interface EscalationClockProps {
  escalationWindow: string;
  label: "Low" | "Medium" | "High";
}

function extractDays(windowText: string): number | null {
  const match = windowText.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

export default function EscalationClock({ escalationWindow, label }: EscalationClockProps) {
  const days = extractDays(escalationWindow);

  const ringClass =
    label === "High"
      ? "border-red-500/40 text-red-400"
      : label === "Medium"
        ? "border-amber-500/40 text-amber-400"
        : "border-green-500/40 text-green-400";

  return (
    <div className="card flex flex-col gap-4">
      <p className="label">Escalation Clock</p>

      <div className="flex items-center gap-4">
        <div
          className={`w-20 h-20 rounded-full border-4 ${ringClass} flex items-center justify-center bg-relief-900`}
          aria-label="Estimated days to escalation"
        >
          <div className="text-center leading-none">
            <p className="text-2xl font-bold">{days ?? "--"}</p>
            <p className="text-[10px] uppercase tracking-widest text-relief-500 mt-1">days</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-relief-300">{escalationWindow}</p>
          <p className="text-xs text-relief-500 mt-1">
            Countdown estimates how quickly this zone can move to the next severity band.
          </p>
        </div>
      </div>
    </div>
  );
}
