"use client";

import type { Volunteer } from "@/lib/types";

interface DispatchPanelProps {
  team: Volunteer[];
}

export default function DispatchPanel({ team }: DispatchPanelProps) {
  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-relief-100">Assigned Volunteer Team</h2>
        <p className="text-xs text-relief-500">{team.length} members</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {team.map((volunteer) => (
          <article key={volunteer.name} className="bg-relief-900 border border-relief-700 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-relief-100">{volunteer.name}</h3>
              <span className="text-[10px] uppercase tracking-wider text-relief-500">{volunteer.language}</span>
            </div>

            <div className="text-xs text-relief-400 space-y-1">
              <p>
                <span className="text-relief-200">Home location:</span> {volunteer.home_location}
              </p>
              <p>
                <span className="text-relief-200">Load:</span> {volunteer.current_load}/{volunteer.max_task_load}
              </p>
              <p>
                <span className="text-relief-200">Availability:</span> {volunteer.availability ? "Available" : "Busy"}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {volunteer.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-full border border-relief-600 text-[11px] text-relief-300 capitalize"
                >
                  {skill.replace("_", " ")}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
