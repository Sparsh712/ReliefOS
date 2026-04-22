"use client";

import { useState } from "react";

import type { FeedbackInput } from "@/lib/types";

interface FeedbackFormProps {
  deploymentId: string;
  onSubmit: (payload: FeedbackInput) => Promise<void>;
  loading: boolean;
}

export default function FeedbackForm({ deploymentId, onSubmit, loading }: FeedbackFormProps) {
  const [peopleReached, setPeopleReached] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [remainingIssues, setRemainingIssues] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      deployment_id: deploymentId,
      people_reached: peopleReached,
      resolved,
      remaining_issues: remainingIssues,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div>
        <p className="label">Post-task Feedback</p>
        <h2 className="text-lg font-semibold text-relief-100 mt-1">Field Outcome Report</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1.5">
          <span className="text-xs text-relief-400">People reached</span>
          <input
            type="number"
            min={0}
            value={peopleReached}
            onChange={(e) => setPeopleReached(Number(e.target.value || 0))}
            className="w-full bg-relief-900 border border-relief-700 rounded-lg px-3 py-2 text-sm text-relief-100 focus:outline-none focus:border-accent-500"
            required
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs text-relief-400">Issue resolved</span>
          <button
            type="button"
            onClick={() => setResolved((v) => !v)}
            className={`w-full rounded-lg px-3 py-2 text-sm border transition-colors ${
              resolved
                ? "bg-green-900/40 border-green-700 text-green-300"
                : "bg-red-900/30 border-red-800 text-red-300"
            }`}
          >
            {resolved ? "Resolved" : "Not Resolved"}
          </button>
        </label>
      </div>

      <label className="space-y-1.5 block">
        <span className="text-xs text-relief-400">Remaining issues</span>
        <textarea
          value={remainingIssues}
          onChange={(e) => setRemainingIssues(e.target.value)}
          rows={3}
          className="w-full bg-relief-900 border border-relief-700 rounded-lg px-3 py-2 text-sm text-relief-100 focus:outline-none focus:border-accent-500"
          placeholder="Mosquito breeding still active in lane 3, low ORS stock, etc."
        />
      </label>

      <label className="space-y-1.5 block">
        <span className="text-xs text-relief-400">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-relief-900 border border-relief-700 rounded-lg px-3 py-2 text-sm text-relief-100 focus:outline-none focus:border-accent-500"
          placeholder="Add context from volunteers or residents"
        />
      </label>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-relief-500">Deployment ID: {deploymentId}</p>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </form>
  );
}
