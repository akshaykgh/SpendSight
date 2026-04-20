import { useState, useCallback } from "react";
import { UploadZone } from "./components/UploadZone";
import { StatusTracker } from "./components/StatusTracker";
import { Dashboard } from "./components/Dashboard";
import { uploadCSV } from "./api/client";
import { useJobPoller } from "./hooks/useJobPoller";
import type { JobResponse, JobResult } from "./types";

type AppState = "idle" | "uploading" | "polling" | "complete" | "error";

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [done, setDone] = useState<{ jobId: string; result: JobResult } | null>(
    null,
  );
  const [pendingDone, setPendingDone] = useState<{
    jobId: string;
    result: JobResult;
  } | null>(null);

  const { job, startPolling } = useJobPoller({
    onComplete: (j: JobResponse) => {
      if (j.result) {
        setPendingDone({ jobId: j.jobId, result: j.result });
      }
    },
    onError: () => setAppState("error"),
  });

  const handleAnimationDone = useCallback(() => {
    if (pendingDone) {
      setDone(pendingDone);
      setAppState("complete");
    }
  }, [pendingDone]);

  const handleUpload = useCallback(
    async (file: File) => {
      setAppState("uploading");
      setUploadError("");
      setPendingDone(null);
      try {
        const init = await uploadCSV(file);
        setAppState("polling");
        startPolling(init.jobId, {
          jobId: init.jobId,
          status: init.status as "queued",
          pollUrl: init.pollUrl,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploadError(msg);
        setAppState("idle");
      }
    },
    [startPolling],
  );

  const handleReset = useCallback(() => {
    setAppState("idle");
    setDone(null);
    setPendingDone(null);
    setUploadError("");
  }, []);

  if (appState === "complete" && done) {
    return (
      <Dashboard
        result={done.result}
        jobId={done.jobId}
        onReset={handleReset}
      />
    );
  }

  if ((appState === "polling" || appState === "error") && job) {
    return (
      <StatusTracker
        status={job.status}
        jobId={job.jobId}
        createdAt={job.createdAt}
        onDone={handleAnimationDone}
      />
    );
  }

  return (
    <UploadZone
      onUpload={handleUpload}
      isUploading={appState === "uploading"}
      uploadError={uploadError}
    />
  );
}
