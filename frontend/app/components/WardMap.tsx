"use client";

// Static Delhi ward pin positions (percentage-based within the SVG viewbox)
const WARD_PINS: {
  ward: string;
  key: string;
  cx: number; // % x
  cy: number; // % y
}[] = [
  { ward: "Rohini",      key: "rohini",      cx: 32, cy: 22 },
  { ward: "Dwarka",      key: "dwarka",      cx: 20, cy: 58 },
  { ward: "Seelampur",   key: "seelampur",   cx: 70, cy: 35 },
  { ward: "Laxmi Nagar", key: "laxmi nagar", cx: 78, cy: 48 },
  { ward: "Najafgarh",   key: "najafgarh",   cx: 15, cy: 72 },
];

interface WardScore {
  ward: string;
  score: number;
  label: "Low" | "Medium" | "High";
}

interface WardMapProps {
  scores: WardScore[];
  currentWard?: string | null;
}

function pinColor(label: "Low" | "Medium" | "High", isCurrent: boolean) {
  if (isCurrent) return { fill: "#f59e0b", stroke: "#fbbf24", text: "#000" };
  if (label === "High")   return { fill: "#ef4444", stroke: "#fca5a5", text: "#fff" };
  if (label === "Medium") return { fill: "#f97316", stroke: "#fdba74", text: "#fff" };
  return { fill: "#22c55e", stroke: "#86efac", text: "#fff" };
}

export default function WardMap({ scores, currentWard }: WardMapProps) {
  const scoreMap = Object.fromEntries(scores.map((s) => [s.ward.toLowerCase(), s]));

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-relief-100">Delhi Ward Map</h2>
        <span className="text-xs text-relief-500">Risk hotspot overlay</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-relief-400">
        {[
          { label: "High",   color: "bg-red-500" },
          { label: "Medium", color: "bg-orange-500" },
          { label: "Low",    color: "bg-green-500" },
          { label: "Current report", color: "bg-amber-400" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* SVG Map */}
      <div className="relative w-full aspect-[4/3] bg-relief-900 rounded-xl border border-relief-800 overflow-hidden">
        {/* Background: stylised NCT of Delhi silhouette */}
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 w-full h-full"
          aria-label="Delhi ward map with risk pins"
        >
          {/* Map background */}
          <rect width="400" height="300" fill="#0f1117" />

          {/* Simplified NCT Delhi outline path (stylised polygon) */}
          <polygon
            points="110,30 210,20 290,40 360,90 370,160 340,230 270,270 170,280 90,250 50,190 40,120 70,65"
            fill="#1a1f2e"
            stroke="#2d3748"
            strokeWidth="1.5"
          />

          {/* Yamuna river (decorative line) */}
          <path
            d="M 230,25 Q 260,80 250,140 Q 240,200 260,260"
            fill="none"
            stroke="#1e40af"
            strokeWidth="6"
            strokeOpacity="0.35"
            strokeLinecap="round"
          />

          {/* Grid lines (subtle) */}
          {[80, 160, 240, 320].map((x) => (
            <line key={`vg-${x}`} x1={x} y1={0} x2={x} y2={300} stroke="#1a2035" strokeWidth="1" />
          ))}
          {[75, 150, 225].map((y) => (
            <line key={`hg-${y}`} x1={0} y1={y} x2={400} y2={y} stroke="#1a2035" strokeWidth="1" />
          ))}

          {/* Ward pins */}
          {WARD_PINS.map(({ ward, key, cx, cy }) => {
            const px = (cx / 100) * 400;
            const py = (cy / 100) * 300;
            const score = scoreMap[key];
            const label = score?.label ?? "Low";
            const isCurrent = currentWard?.toLowerCase() === key;
            const { fill, stroke, text } = pinColor(label, isCurrent);
            const r = isCurrent ? 18 : 14;

            return (
              <g key={key}>
                {/* Pulse ring for current ward */}
                {isCurrent && (
                  <circle cx={px} cy={py} r={r + 8} fill={fill} fillOpacity="0.15" stroke={stroke} strokeWidth="1" strokeOpacity="0.4" />
                )}
                {/* Pin circle */}
                <circle cx={px} cy={py} r={r} fill={fill} stroke={stroke} strokeWidth="1.5" />
                {/* Score number */}
                <text
                  x={px}
                  y={py + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={text}
                  fontSize={isCurrent ? "9" : "8"}
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {score?.score ?? "?"}
                </text>
                {/* Ward name label */}
                <text
                  x={px}
                  y={py + r + 10}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="7.5"
                  fontWeight="500"
                >
                  {ward}
                </text>
              </g>
            );
          })}

          {/* "NCT Delhi" watermark */}
          <text x="200" y="290" textAnchor="middle" fill="#2d3748" fontSize="9" fontWeight="600">
            NCT Delhi · Stylised
          </text>
        </svg>
      </div>

      <p className="text-[11px] text-relief-600">
        Pin size and colour reflect current risk scores. Amber = current report ward.
      </p>
    </div>
  );
}
