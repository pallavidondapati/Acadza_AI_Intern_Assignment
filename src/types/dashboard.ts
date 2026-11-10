/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Question,
  Report,
  Taxonomy,
  TriageResult,
  SurgicalEdit,
  VerdictKey,
  RepairKey,
  RouteKey,
} from "../triage/types.ts";

export type ReviewDecisionStatus = "pending" | "approved" | "edited" | "rejected" | "auto_applied";

export interface FacultyDecision {
  reportId: string;
  questionId: string;
  status: ReviewDecisionStatus;
  facultyMember: string;
  decidedAt: string;
  approvedEdit?: SurgicalEdit | null;
  customStudentReply?: string;
  rejectionReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  reportId: string;
  questionId: string;
  facultyMember: string;
  action: "APPROVED" | "EDITED" | "REJECTED" | "STUDENT_REPLY_UPDATED" | "SYSTEM_AUTO_APPLIED" | "RESET";
  details: string;
  field?: string;
  before?: string;
  after?: string;
}

export interface QuestionGroup {
  question: Question;
  reports: Report[];
  results: TriageResult[];
  urgencyScore: number;
  urgencyReason: string;
  primaryVerdict: VerdictKey;
  primaryRepair: RepairKey | null;
  hasPendingReview: boolean;
  isMultiReport: boolean;
  hasAdversarialAttempt: boolean;
  hasAlreadyFixed: boolean;
}

export interface FilterState {
  searchQuery: string;
  verdict: VerdictKey | "all";
  repair: RepairKey | "all";
  status: ReviewDecisionStatus | "all";
  subject: string | "all";
  sortBy: "urgency" | "reportCount" | "confidenceAsc" | "reportTime";
}
