import { useEffect, useState } from "react";
import clsx from "clsx";
import type { JobStatus } from "../types";

interface Props {
  status: JobStatus;
  jobId: string;
  createdAt?: string;
  onDone?: () => void; // ✅ new
}

const STEPS = [
  { key: "queued", label: "Queued", desc: "Job accepted and waiting in queue" },
  {
    key: "processing",
    label: "Processing",
    desc: "ML model analyzing transactions",
  },
  { key: "completed", label: "Complete", desc: "Results ready" },
];

export function StatusTracker({ status, jobId, createdAt, onDone }: Props) {
  const failed = status === "failed";
  const [displayStep, setDisplayStep] = useState(0);

  useEffect(() => {
    // Always show Queued for at least 800ms
    const t1 = setTimeout(() => setDisplayStep(1), 800);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (status === "completed" || status === "failed") {
      // Wait until we're at least on step 1, then advance to step 2 after 1.2s
      const t2 = setTimeout(
        () => {
          setDisplayStep(2);
          // ✅ After step 2 is visible for 800ms, notify parent to show Dashboard
          const t3 = setTimeout(() => onDone?.(), 800);
          return () => clearTimeout(t3);
        },
        displayStep >= 1 ? 1200 : 800 + 1200,
      );
      return () => clearTimeout(t2);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = failed ? 2 : displayStep;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1117] p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div
            className={clsx(
              "relative w-24 h-24 rounded-full flex items-center justify-center",
              failed ? "bg-red-500/10" : "bg-indigo-500/10",
            )}
          >
            {!failed && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-4 border-indigo-500/10 animate-ping"
                  style={{ animationDuration: "2.5s" }}
                />
                <div
                  className="absolute inset-3 rounded-full border-2 border-indigo-500/30 animate-spin"
                  style={{ animationDuration: "2s" }}
                />
              </>
            )}
            <svg
              className={clsx(
                "w-9 h-9",
                failed ? "text-red-400" : "text-indigo-400",
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {failed ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
                />
              )}
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            {failed ? "Processing Failed" : "Analyzing Transactions…"}
          </h2>
          <p className="text-gray-500 font-mono text-sm">Job: {jobId}</p>
          {createdAt && (
            <p className="text-gray-600 text-xs mt-1">
              Started {new Date(createdAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="bg-[#1a1d27] rounded-2xl border border-gray-800 p-6">
          {STEPS.map((step, idx) => {
            const done = !failed && idx < current;
            const active = !failed && idx === current;
            const pending = failed || idx > current;

            return (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                      done && "border-green-500 bg-green-500/10",
                      active && "border-indigo-500 bg-indigo-500/10",
                      pending && "border-gray-700 bg-gray-800",
                    )}
                  >
                    {done ? (
                      <svg
                        className="w-4 h-4 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : active ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                    )}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={clsx(
                        "w-px h-10 my-1 transition-colors duration-500",
                        done ? "bg-green-500/30" : "bg-gray-700",
                      )}
                    />
                  )}
                </div>
                <div className="pt-1 pb-10">
                  <p
                    className={clsx(
                      "font-medium text-sm flex items-center gap-2 transition-colors duration-300",
                      done
                        ? "text-green-400"
                        : active
                          ? "text-white"
                          : "text-gray-600",
                    )}
                  >
                    {step.label}
                    {active && (
                      <span className="text-indigo-400 text-xs animate-pulse">
                        In progress…
                      </span>
                    )}
                  </p>
                  <p
                    className={clsx(
                      "text-xs mt-0.5",
                      pending ? "text-gray-700" : "text-gray-500",
                    )}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
