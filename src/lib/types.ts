// src/lib/types.ts
// Derived from sessions-openapi.json, payments-openapi.json, mentors-openapi.json

// ── Sessions ───────────────────────────────────────────────────────────────
export type SessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'no_show';
export type ReviewStatus = 'published' | 'flagged' | 'hidden';

export interface SessionCreate {
  mentor_id: string;
  mentee_id: string;
  scheduled_start: string;   // ISO 8601
  scheduled_end: string;
  topic: string;
  agenda?: string | null;
  price_eur: string;         // decimal string e.g. "25.00"
}

export interface SessionRead {
  id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: SessionStatus;
  topic: string;
  agenda: string | null;
  price_eur: string;
  is_paid: boolean;
  idempotency_key: string | null;
  started_at: string | null;
  ended_at: string | null;
  recording_url: string | null;
  created_at: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export interface SessionCancel {
  cancel_reason?: string | null;
}

export interface ReviewCreate {
  rating: number;   // 1–5
  body: string;
}

export interface ReviewRead {
  id: string;
  session_id: string;
  mentor_id: string;
  mentee_id: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  flagged_by: string | null;
  flag_reason: string | null;
  flagged_at: string | null;
  hidden_at: string | null;
  hidden_by: string | null;
  created_at: string;
}

// ── Mentors ─────────────────────────────────────────────────────────────────
export type MentorStatus = 'active' | 'paused' | 'suspended';
export type Visibility = 'public' | 'private';

export interface MentorProfileRead {
  id: string;
  user_id: string;
  status: MentorStatus;
  headline: string;
  about: string;
  topics: string[];
  languages: string[];
  hourly_price_eur: string;
  links: Record<string, unknown>;
  stripe_account_id: string | null;
  total_sessions: number;
  avg_rating: number | null;
  since: string;
  full_name: string;   // NOTE: backend prerequisite — must be added to MentorProfile model
}

export interface MentorProfileUpdate {
  headline?: string | null;
  about?: string | null;
  topics?: string[] | null;
  languages?: string[] | null;
  hourly_price_eur?: string | null;
  links?: Record<string, unknown> | null;
}

export interface SlotRead {
  start: string;   // ISO 8601
  end: string;
}

export interface AvailabilityTemplateRead {
  id: string;
  weekday: number;   // 0 = Monday … 6 = Sunday
  start_time: string;  // "HH:MM:SS"
  end_time: string;
  timezone: string;
}

export interface AvailabilityBlockRead {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

export interface SessionSettingsRead {
  length_minutes: number;
  buffer_minutes: number;
  min_notice_hours: number;
  max_per_day: number;
  visibility: Visibility;
}

export interface ScheduleRead {
  templates: AvailabilityTemplateRead[];
  blocks: AvailabilityBlockRead[];
  session_settings: SessionSettingsRead | null;
}

export interface ScheduleUpdate {
  templates?: Array<Omit<AvailabilityTemplateRead, 'id'>> | null;
  blocks?: Array<Omit<AvailabilityBlockRead, 'id'>> | null;
  session_settings?: Partial<SessionSettingsRead> | null;
}

export interface MentorListParams {
  topic?: string;
  lang?: string;
  min_price?: string;
  max_price?: string;
  q?: string;
  page?: number;
}

// ── Payments ─────────────────────────────────────────────────────────────────
export interface PaymentIntentResponse {
  client_secret: string;
  payment_id: string;
}

// ── Auth (users-ms — inferred, no OpenAPI available) ─────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  remaining_attempts?: number;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  scopes: string[];
}
