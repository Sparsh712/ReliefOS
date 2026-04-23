"use client";

interface WardEntry {
  ward: string;
  score: number;
  label: "Low" | "Medium" | "High";
  escalation: string;
  isCurrent?: boolean;
}

interface WardLeaderboardProps {
  wards: WardEntry[];
}

function badgeClass(label: "Low" | "Medium" | "High") {
  if (label === "High") return "badge-high";
  if (label === "Medium") return "badge-medium";
  return "badge-low";
}

function BarFill({ score, label }: { score: number; label: "Low" | "Medium" | "High" }) {
  const color =
    label === "High"
      ? "bg-red-500"
      : label === "Medium"
      ? "bg-amber-400"
      : "bg-green-500";

  return (
    <div className="w-full h-1.5 bg-relief-800 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function WardLeaderboard({ wards }: WardLeaderboardProps) {
  if (wards.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-relief-100">Ward Priority Leaderboard</h2>
          <p className="text-xs text-relief-500 mt-0.5">Sorted highest-to-lowest risk · nearby wards projected</p>
        </div>
        <span className="text-xs text-relief-500 bg-relief-900 border border-relief-700 rounded px-2 py-0.5">
          {wards.length} ward{wards.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-relief-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-relief-800 bg-relief-900">
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-widest text-relief-500 font-semibold w-6">#</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-widest text-relief-500 font-semibold">Ward</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-widest text-relief-500 font-semibold">Risk</th>
              <th className="text-right px-4 py-2 text-[10px] uppercase tracking-widest text-relief-500 font-semibold">Score</th>
              <th className="text-left px-4 py-2 text-[10px] uppercase tracking-widest text-relief-500 font-semibold hidden sm:table-cell">Escalation</th>
            </tr>
          </thead>
          <tbody>
            {wards.map((item, i) => (
              <tr
                key={item.ward}
                className={`border-b border-relief-800 last:border-0 transition-colors ${
                  item.isCurrent
                    ? "bg-amber-950/30"
                    : "hover:bg-relief-900/60"
                }`}
              >
                <td className="px-4 py-3 text-relief-600 font-mono text-xs">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-relief-100">{item.ward}</span>
                    {item.isCurrent && (
                      <span className="text-[9px] uppercase tracking-wider text-amber-400 border border-amber-700 rounded px-1 py-0.5">
                        current
                      </span>
                    )}
                  </div>
                  <BarFill score={item.score} label={item.label} />
                </td>
                <td className="px-4 py-3">
                  <span className={badgeClass(item.label)}>{item.label}</span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-relief-100 tabular-nums">
                  {item.score}<span className="text-relief-600 font-normal text-xs">/100</span>
                </td>
                <td className="px-4 py-3 text-xs text-relief-400 hidden sm:table-cell max-w-[200px]">
                  {item.escalation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
