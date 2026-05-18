// Shared TypeScript types for Examino

export type Role = "student" | "teacher" | "admin";
export type Course = "JEE" | "NEET";
export type TestStatus = "draft" | "published" | "unlocked" | "closed";
export type QuestionType = "mcq_single" | "mcq_multi" | "integer";
export type BloomLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
export type AttemptStatus = "in_progress" | "submitted" | "graded";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  school: string | null;
  course: Course | null;
  class_year: string | null;
  rating: number;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  test_id: string;
  type: QuestionType;
  stem: string;
  options: QuestionOption[];
  correct_answer: number | number[] | string; // index(es) or numeric value
  difficulty: number; // 1-5
  bloom_level: BloomLevel;
  tags: string[];
  est_time_seconds: number;
  explanation: string;
  points: number;
}

export interface DifficultyMix {
  easy: number;
  medium: number;
  hard: number;
}

export interface ScoringScheme {
  per_question: number;
}

export interface GradingRules {
  mcq_single: {
    correct: number;
    wrong: number;
  };
  mcq_multi: {
    formula: string;
    penalty_per_incorrect: number;
  };
  integer: {
    correct: number;
    wrong: number;
    tolerance: number;
  };
}

export interface AnalyticsTemplate {
  metrics: string[];
  rating_formula: string;
  k_factor: number;
  suspicious_threshold: number;
}

export interface Test {
  id: string;
  course: Course;
  subject: string;
  chapter: string;
  class_year: string;
  duration_minutes: number;
  num_questions: number;
  difficulty_mix: DifficultyMix;
  allow_negative_marking: boolean;
  negative_per_wrong: number;
  question_types: QuestionType[];
  seed: string;
  scoring_scheme: ScoringScheme;
  learning_objectives: string[];
  scheduled_unix: number | null;
  status: TestStatus;
  teacher_otp: string | null;
  otp_expires_at: string | null;
  generated_json: GeneratedTestJSON | null;
  expected_max_score: number | null;
  grading_rules: GradingRules | null;
  analytics_template: AnalyticsTemplate | null;
  deterministic_hash: string | null;
  created_by: string | null;
  created_at: string;
}

export interface GeneratedTestJSON {
  test_metadata: {
    test_id: string;
    course: string;
    subject: string;
    chapter: string;
    scheduled_unix: number;
    duration_minutes: number;
    seed: string;
    deterministic_question_hash: string;
  };
  questions: Question[];
  grading_rules: GradingRules;
  expected_max_score: number;
  analytics_template: AnalyticsTemplate;
  notes: string;
  error: string | null;
}

export interface Attempt {
  id: string;
  test_id: string;
  user_id: string;
  answers: Record<string, number | number[] | string>;
  score: number | null;
  max_score: number | null;
  focus_loss_count: number;
  suspicious_score: number;
  time_per_question: Record<string, number>;
  started_at: string;
  submitted_at: string | null;
  status: AttemptStatus;
  rating_delta: number | null;
  analytics: Record<string, unknown> | null;
}

export interface CreateTestPayload {
  course: Course;
  subject: string;
  chapter: string;
  class_year: string;
  duration_minutes: number;
  num_questions: number;
  difficulty_mix: DifficultyMix;
  allow_negative_marking?: boolean;
  negative_per_wrong?: number;
  question_types?: QuestionType[];
  seed?: string;
  scoring_scheme?: ScoringScheme;
  learning_objectives: string[];
  scheduled_unix?: number;
  produce_explanations?: boolean;
  max_explanation_words?: number;
}

export interface SubmitAnswersPayload {
  answers: Record<string, number | number[] | string>;
  time_per_question: Record<string, number>;
  focus_loss_count: number;
}
