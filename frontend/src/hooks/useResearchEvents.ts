import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { JobStatus } from '../api/types';

interface ProgressEvent {
  status: JobStatus;
  detail: string;
}

/**
 * Subscribes to the job's SSE stream and calls `onDone`/`onFailed` once the
 * job finishes, so the caller can refetch the full report. We keep the
 * report fetch (React Query) separate from the live event stream — the
 * stream is only responsible for progress, not for shipping the payload.
 */
export function useResearchEvents(jobId: number | null, onSettled: () => void) {
  const [progress, setProgress] = useState<ProgressEvent | null>(null);

  useEffect(() => {
    if (jobId == null) return;

    const source = new EventSource(api.eventsUrl(jobId));

    source.addEventListener('progress', (e) => {
      setProgress(JSON.parse((e as MessageEvent).data));
    });
    source.addEventListener('done', () => {
      source.close();
      onSettled();
    });
    source.addEventListener('failed', () => {
      source.close();
      onSettled();
    });
    source.onerror = () => {
      // EventSource retries by default; if the job already finished before
      // we connected, the server closes immediately after replaying state,
      // which browsers can also surface as an error — settle either way.
      source.close();
    };

    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return progress;
}
