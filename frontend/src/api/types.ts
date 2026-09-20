// Friendly aliases over the OpenAPI-generated schema (src/api/schema.ts).
// schema.ts is regenerated from the live backend via `npm run gen:types` —
// never edit it by hand. This file is the one place that translates its
// verbose generated names into the names the rest of the app imports, so a
// backend field rename becomes a type error here instead of silent drift.
import type { components } from './schema';

export type Insight = components['schemas']['InsightOut'];
export type JobStatus = components['schemas']['JobStatus'];
export type Job = components['schemas']['JobOut'];
