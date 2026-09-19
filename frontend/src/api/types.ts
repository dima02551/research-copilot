// Hand-written to mirror backend/app/schemas.py.
// Run `npm run gen:types` against a running backend to generate a full
// OpenAPI-derived schema.ts instead, once the API is stable.

export interface Insight {
  id: number;
  title: string;
  summary: string;
  evidence_quote: string;
  source_url: string;
  source_title: string;
  relevance: 'relevant' | 'not_relevant' | null;
}

export type JobStatus = 'pending' | 'searching' | 'synthesizing' | 'done' | 'failed';

export interface Job {
  id: number;
  topic: string;
  status: JobStatus;
  stage_detail: string;
  error: string | null;
  demo_mode: boolean;
  insights: Insight[];
}
