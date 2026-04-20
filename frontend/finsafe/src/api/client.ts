import type { JobResponse } from "../types";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://finsafe-production-backend.up.railway.app";

export async function uploadCSV(
  file: File,
  signal?: AbortSignal,
): Promise<{ jobId: string; status: string; pollUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/jobs/upload`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getJobStatus(
  jobId: string,
  signal?: AbortSignal,
): Promise<JobResponse> {
  const res = await fetch(`${BASE_URL}/api/jobs/${jobId}`, { signal });

  if (!res.ok) {
    throw new Error(`Poll failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}