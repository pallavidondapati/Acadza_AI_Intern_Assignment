/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VerdictKey =
  | "defect"
  | "no_error"
  | "display_issue"
  | "app_issue"
  | "language_mode"
  | "already_fixed"
  | "not_actionable";

export type RepairKey =
  | "spelling"
  | "noise"
  | "exam_reference"
  | "markup_leak"
  | "answer_form"
  | "notation"
  | "stem_data"
  | "option_repair"
  | "solution_fix"
  | "solution_missing"
  | "answer_key"
  | "type_mismatch"
  | "identical_options"
  | "diagram"
  | "wrong_question"
  | "unsound"
  | "wrong_chapter"
  | "syllabus";

export type RouteKey = "auto_apply" | "faculty_review" | "no_change";

export interface SurgicalEdit {
  field: "question" | "solution" | "answer" | "questionType";
  find?: string;
  replace: string | string[];
}

export interface TriageResult {
  reportId: string;
  questionId: string;
  verdict: VerdictKey;
  repair: RepairKey | null;
  edit: SurgicalEdit | null;
  route: RouteKey;
  confidence: number;
  evidence: string;
  student_reply: string;
}

export interface QuestionContent {
  question: string;
  solution: string;
  answer: string | string[];
  quesImages?: string[];
  solutionImages?: string[];
}

export interface ErrorHistoryEntry {
  type: string;
  actor: "faculty" | "system" | string;
  at: string;
  note: string;
}

export interface Question {
  _id: string;
  qid: string | null;
  questionType: "scq" | "mcq" | "integerQuestion";
  subject: string;
  chapter: string;
  concept: string | null;
  subConcept: string | null;
  level: "EASY" | "MEDIUM" | "HARD" | null;
  error: number;
  updatedAt: string;
  scq?: QuestionContent;
  mcq?: QuestionContent;
  integerQuestion?: QuestionContent;
  errorHistory: ErrorHistoryEntry[];
}

export interface Report {
  reportId: string;
  questionId: string;
  studentId: string;
  source: "web" | "android" | "ios" | string;
  reportedAt: string;
  comment: string;
}

export interface RepairDefinition {
  fields: Array<"question" | "solution" | "answer" | "questionType">;
  auto: boolean;
  label: string;
}

export interface Taxonomy {
  _about: string;
  verdicts: Record<VerdictKey, string>;
  repairs: Record<RepairKey, RepairDefinition>;
}

export interface ValidationViolation {
  reportId: string;
  rule: string;
  message: string;
}

export interface ValidationSummary {
  isValid: boolean;
  totalReports: number;
  violations: ValidationViolation[];
  verdictCounts: Record<string, number>;
  repairCounts: Record<string, number>;
  routeCounts: Record<string, number>;
}
