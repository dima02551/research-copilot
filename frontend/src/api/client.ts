import type { Job } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  startResearch: (topic: string) => request<Job>('/api/research', { method: 'POST', body: JSON.stringify({ topic }) }),

  getJob: (jobId: number) => request<Job>(`/api/research/${jobId}`),

  setRelevance: (insightId: number, relevance: 'relevant' | 'not_relevant' | null) =>
    request<{ ok: boolean }>(`/api/research/insights/${insightId}`, {
      method: 'PATCH',
      body: JSON.stringify({ relevance }),
    }),

  exportUrl: (jobId: number, format: 'md' | 'pdf') => `${BASE_URL}/api/research/${jobId}/export?format=${format}`,

  eventsUrl: (jobId: number) => `${BASE_URL}/api/research/${jobId}/events`,
};
