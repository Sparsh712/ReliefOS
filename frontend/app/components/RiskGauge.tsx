"use client";

import { useEffect, useState } from "react";

interface RiskGaugeProps {
  score: number; // 0-100
  label: string; // "High", "Medium", "Low"
}

export default function RiskGauge({ score, label }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 500);
    return () => clearTimeout(timer);
  }, [score]);

  // Gauge constants
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getColor = () => {
    if (score >= 70) return "text-red-500";
    if (score >= 40) return "text-amber-500";
    return "text-green-500";
  };

  const getBgColor = () => {
    if (score >= 70) return "stroke-red-500/20";
    if (score >= 40) return "stroke-amber-500/20";
    return "stroke-green-500/20";
  };

  const getActiveStroke = () => {
    if (score >= 70) return "stroke-red-500";
    if (score >= 40) return "stroke-amber-500";
    return "stroke-green-500";
  };

  return (
    <div className="card flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        {/* SVG Gauge */}
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            className={`${getBgColor()} transition-colors duration-500`}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 1.5s ease-out" }}
            className={`${getActiveStroke()} transition-colors duration-500`}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getColor()}`}>
            {Math.round(animatedScore)}
          </span>
          <span className="text-[10px] text-relief-500 uppercase tracking-widest font-bold">
            Risk Score
          </span>
        </div>
      </div>

      <div className="text-center space-y-3">
        <span className={`inline-block px-6 py-2 text-sm font-black uppercase tracking-widest border-2 shadow-[4px_4px_0px_0px] ${
          score >= 70
            ? "bg-red-500 border-red-700 text-white shadow-red-900"
            : score >= 40
            ? "bg-amber-400 border-amber-600 text-gray-900 shadow-amber-900"
            : "bg-green-500 border-green-700 text-white shadow-green-900"
        }`}>
          {label} Risk
        </span>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-[200px]">
          Hotspot detection based on fever velocity and local conditions.
        </p>
      </div>
    </div>
  );
}
