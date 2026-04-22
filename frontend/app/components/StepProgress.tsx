"use client";

const STEPS = [
  { id: 1, label: "Upload",    short: "Upload"  },
  { id: 2, label: "Extract",   short: "Extract" },
  { id: 3, label: "Trust",     short: "Trust"   },
  { id: 4, label: "Risk",      short: "Risk"    },
  { id: 5, label: "Intervene", short: "Act"     },
  { id: 6, label: "Dispatch",  short: "Deploy"  },
  { id: 7, label: "Feedback",  short: "Report"  },
];

interface StepProgressProps {
  currentStep: number; // 1–7
}

export default function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <nav aria-label="Pipeline progress" className="w-full">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const done    = step.id < currentStep;
          const active  = step.id === currentStep;
          const future  = step.id > currentStep;
          const isLast  = idx === STEPS.length - 1;

          return (
            <li key={step.id} className="flex items-center flex-1 min-w-0">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    transition-colors duration-300
                    ${done   ? "bg-accent-500 text-relief-950"        : ""}
                    ${active ? "bg-accent-500/20 border-2 border-accent-500 text-accent-400" : ""}
                    ${future ? "bg-relief-800 border border-relief-600 text-relief-500"      : ""}
                  `}
                >
                  {done ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`
                    text-[10px] font-medium leading-none hidden sm:block
                    ${done   ? "text-accent-400"   : ""}
                    ${active ? "text-accent-300"   : ""}
                    ${future ? "text-relief-600"   : ""}
                  `}
                >
                  {step.short}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 h-px mx-1.5 transition-colors duration-300"
                  style={{ backgroundColor: done ? "rgb(245 158 11)" : "rgb(51 65 85)" }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
