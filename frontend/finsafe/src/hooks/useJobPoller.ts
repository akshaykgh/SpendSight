import { useState, useEffect, useRef, useCallback } from 'react';
import { getJobStatus } from '../api/client';
import type { JobResponse } from '../types';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 150; // 5-min hard timeout

interface Options {
  onComplete?: (job: JobResponse) => void;
  onError?: (err: Error) => void;
}

export function useJobPoller({ onComplete, onError }: Options = {}) {
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCount = useRef(0);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const startPolling = useCallback(
    (jobId: string, initial: JobResponse) => {
      // Cancel any in-flight request or timer from a previous job
      stopPolling();

      setJob(initial);
      setError(null);
      setIsPolling(true);
      pollCount.current = 0;

      const poll = async () => {
        if (pollCount.current >= MAX_POLLS) {
          stopPolling();
          const e = new Error('Timed out after 5 minutes');
          setError(e);
          onError?.(e);
          return;
        }

        abortRef.current = new AbortController();

        try {
          const result = await getJobStatus(jobId, abortRef.current.signal);
          pollCount.current++;
          setJob(result);

          if (result.status === 'completed') {
            setIsPolling(false);
            onComplete?.(result);
            return;
          }

          if (result.status === 'failed') {
            setIsPolling(false);
            const e = new Error(result.error ?? 'Job failed');
            setError(e);
            onError?.(e);
            return;
          }

          // Still queued/processing — schedule next poll
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
          const e = err instanceof Error ? err : new Error('Unknown error');
          setError(e);
          setIsPolling(false);
          onError?.(e);
        }
      };

      timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    },
    [stopPolling, onComplete, onError]
  );

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  return { job, isPolling, error, startPolling, stopPolling };
}
