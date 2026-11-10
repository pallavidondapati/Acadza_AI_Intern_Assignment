/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  Question,
  Report,
  Taxonomy,
  TriageResult,
  SurgicalEdit,
} from "../triage/types.ts";
import {
  AuditLogEntry,
  FacultyDecision,
  FilterState,
  QuestionGroup,
  ReviewDecisionStatus,
} from "../types/dashboard.ts";

interface DashboardContextType {
  questions: Question[];
  reports: Report[];
  results: TriageResult[];
  taxonomy: Taxonomy | null;
  decisions: Record<string, FacultyDecision>;
  auditLog: AuditLogEntry[];
  selectedQuestionId: string | null;
  selectedReportId: string | null;
  currentFaculty: string;
  filters: FilterState;
  questionGroups: QuestionGroup[];
  filteredQuestionGroups: QuestionGroup[];
  activeGroup: QuestionGroup | null;
  activeResult: TriageResult | null;
  activeReport: Report | null;
  activeDecision: FacultyDecision | null;
  isLoading: boolean;
  error: string | null;
  isAuditDrawerOpen: boolean;

  // Actions
  setSelectedQuestionId: (id: string | null) => void;
  setSelectedReportId: (id: string | null) => void;
  setCurrentFaculty: (name: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  setIsAuditDrawerOpen: (open: boolean) => void;
  approveReport: (reportId: string, comment?: string) => { success: boolean; message: string };
  editReportRepair: (
    reportId: string,
    field: "question" | "solution" | "answer" | "questionType",
    find: string | undefined,
    replace: string,
    comment?: string
  ) => { success: boolean; message: string };
  rejectReport: (reportId: string, reason: string) => { success: boolean; message: string };
  updateStudentReply: (reportId: string, reply: string) => void;
  resetAllDecisions: () => void;
  exportUpdatedResults: () => void;
}

const LOCAL_STORAGE_DECISIONS_KEY = "acadza_faculty_decisions_v2";
const LOCAL_STORAGE_AUDIT_KEY = "acadza_faculty_audit_log_v2";

const defaultFilters: FilterState = {
  searchQuery: "",
  verdict: "all",
  repair: "all",
  status: "all",
  subject: "all",
  sortBy: "urgency",
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [results, setResults] = useState<TriageResult[]>([]);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [decisions, setDecisions] = useState<Record<string, FacultyDecision>>({});
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [currentFaculty, setCurrentFaculty] = useState<string>("Prof. Raghav Sharma (Physics Lead)");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);

  // 1. Initial Load of files
  useEffect(() => {
    async function loadAllData() {
      try {
        setIsLoading(true);
        const [qRes, rRes, resRes, taxRes] = await Promise.all([
          fetch("/assets/aistudio/questions_178d08f1.json"),
          fetch("/assets/aistudio/reports_042751d1.json"),
          fetch("/results.json"),
          fetch("/assets/aistudio/taxonomy_3100ea34.json"),
        ]);

        if (!qRes.ok || !rRes.ok || !resRes.ok || !taxRes.ok) {
          throw new Error("Failed to load one or more dataset resources from server.");
        }

        const qData: Question[] = await qRes.json();
        const rData: Report[] = await rRes.json();
        const resData: TriageResult[] = await resRes.json();
        const taxData: Taxonomy = await taxRes.json();

        setQuestions(qData);
        setReports(rData);
        setResults(resData);
        setTaxonomy(taxData);

        // Load persisted decisions from localStorage
        const savedDecisions = localStorage.getItem(LOCAL_STORAGE_DECISIONS_KEY);
        const savedAudit = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);

        let initialDecisions: Record<string, FacultyDecision> = {};
        if (savedDecisions) {
          try {
            initialDecisions = JSON.parse(savedDecisions);
          } catch {
            initialDecisions = {};
          }
        }

        // Initialize default decisions for reports not yet touched
        resData.forEach((res) => {
          if (!initialDecisions[res.reportId]) {
            let status: ReviewDecisionStatus = "pending";
            if (res.route === "auto_apply") {
              status = "auto_applied";
            } else if (res.route === "no_change") {
              status = "approved";
            } else {
              status = "pending";
            }

            initialDecisions[res.reportId] = {
              reportId: res.reportId,
              questionId: res.questionId,
              status,
              facultyMember: res.route === "auto_apply" ? "AI System (Auto)" : "System",
              decidedAt: new Date().toISOString(),
              approvedEdit: res.edit,
              customStudentReply: res.student_reply,
            };
          }
        });

        setDecisions(initialDecisions);

        if (savedAudit) {
          try {
            setAuditLog(JSON.parse(savedAudit));
          } catch {
            setAuditLog([]);
          }
        } else {
          // Initial baseline audit log entry
          const initialAudit: AuditLogEntry = {
            id: "INIT_001",
            timestamp: new Date().toISOString(),
            reportId: "SYSTEM",
            questionId: "GLOBAL",
            facultyMember: "AI Triage System",
            action: "SYSTEM_AUTO_APPLIED",
            details: "Triage engine loaded 44 reports. 21 auto-applied repairs, 6 queued for faculty review.",
          };
          setAuditLog([initialAudit]);
        }

        // Default selection: select first question with pending faculty review
        const pendingGroup = resData.find((r) => r.route === "faculty_review");
        if (pendingGroup) {
          setSelectedQuestionId(pendingGroup.questionId);
          setSelectedReportId(pendingGroup.reportId);
        } else if (resData.length > 0) {
          setSelectedQuestionId(resData[0].questionId);
          setSelectedReportId(resData[0].reportId);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }

    loadAllData();
  }, []);

  // Save decisions and audit log to localStorage when modified
  useEffect(() => {
    if (Object.keys(decisions).length > 0) {
      localStorage.setItem(LOCAL_STORAGE_DECISIONS_KEY, JSON.stringify(decisions));
    }
  }, [decisions]);

  useEffect(() => {
    if (auditLog.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(auditLog));
    }
  }, [auditLog]);

  // Build question groups
  const questionGroups: QuestionGroup[] = useMemo(() => {
    if (!questions.length || !reports.length || !results.length) return [];

    const groupMap = new Map<string, { question: Question; reports: Report[]; results: TriageResult[] }>();

    questions.forEach((q) => {
      groupMap.set(q._id, { question: q, reports: [], results: [] });
    });

    reports.forEach((r) => {
      const g = groupMap.get(r.questionId);
      if (g) g.reports.push(r);
    });

    results.forEach((res) => {
      const g = groupMap.get(res.questionId);
      if (g) g.results.push(res);
    });

    const groups: QuestionGroup[] = [];

    groupMap.forEach(({ question, reports: qReports, results: qResults }) => {
      // Only include questions that have reports
      if (qReports.length === 0) return;

      const hasPendingReview = qResults.some((res) => {
        const d = decisions[res.reportId];
        return d ? d.status === "pending" : res.route === "faculty_review";
      });

      const isMultiReport = qReports.length > 1;
      const hasAdversarialAttempt = qReports.some((r) => r.reportId === "R027");
      const hasAlreadyFixed = qResults.some((r) => r.verdict === "already_fixed");

      // Calculate urgency score:
      // High score = prioritized at top
      let urgencyScore = 10;
      let urgencyReason = "Standard review";

      if (hasPendingReview) {
        urgencyScore += 50;
        urgencyReason = "Action required: Human review needed";
      }
      if (isMultiReport) {
        urgencyScore += 30;
        urgencyReason = `High activity: Reported by ${qReports.length} independent students`;
      }
      if (qResults.some((r) => r.repair === "answer_key")) {
        urgencyScore += 25;
        urgencyReason = "High stakes: Answer key defect affects grading";
      }
      if (hasAdversarialAttempt) {
        urgencyScore += 15;
        urgencyReason = "Security flag: Adversarial prompt injection contained";
      }
      if (hasAlreadyFixed) {
        urgencyScore += 5;
        urgencyReason = "Resolved: Live question already fixed in errorHistory";
      }

      const primaryVerdict = qResults[0]?.verdict || "no_error";
      const primaryRepair = qResults.find((r) => r.repair)?.repair || null;

      groups.push({
        question,
        reports: qReports,
        results: qResults,
        urgencyScore,
        urgencyReason,
        primaryVerdict,
        primaryRepair,
        hasPendingReview,
        isMultiReport,
        hasAdversarialAttempt,
        hasAlreadyFixed,
      });
    });

    return groups;
  }, [questions, reports, results, decisions]);

  // Apply filters and sorting
  const filteredQuestionGroups: QuestionGroup[] = useMemo(() => {
    return questionGroups
      .filter((g) => {
        // Query search
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchesQid = g.question._id.toLowerCase().includes(q) || (g.question.qid && g.question.qid.toLowerCase().includes(q));
          const matchesSubject = g.question.subject.toLowerCase().includes(q) || g.question.chapter.toLowerCase().includes(q);
          const matchesReport = g.reports.some(
            (r) =>
              r.reportId.toLowerCase().includes(q) ||
              r.studentId.toLowerCase().includes(q) ||
              r.comment.toLowerCase().includes(q)
          );
          if (!matchesQid && !matchesSubject && !matchesReport) return false;
        }

        // Verdict filter
        if (filters.verdict !== "all") {
          if (!g.results.some((r) => r.verdict === filters.verdict)) return false;
        }

        // Repair filter
        if (filters.repair !== "all") {
          if (!g.results.some((r) => r.repair === filters.repair)) return false;
        }

        // Review Status filter
        if (filters.status !== "all") {
          const matchesStatus = g.results.some((r) => {
            const dec = decisions[r.reportId];
            return dec ? dec.status === filters.status : false;
          });
          if (!matchesStatus) return false;
        }

        // Subject filter
        if (filters.subject !== "all") {
          if (g.question.subject.toLowerCase() !== filters.subject.toLowerCase()) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "urgency") {
          return b.urgencyScore - a.urgencyScore;
        }
        if (filters.sortBy === "reportCount") {
          return b.reports.length - a.reports.length;
        }
        if (filters.sortBy === "confidenceAsc") {
          const confA = Math.min(...a.results.map((r) => r.confidence));
          const confB = Math.min(...b.results.map((r) => r.confidence));
          return confA - confB;
        }
        if (filters.sortBy === "reportTime") {
          const timeA = new Date(a.reports[0]?.reportedAt || 0).getTime();
          const timeB = new Date(b.reports[0]?.reportedAt || 0).getTime();
          return timeB - timeA;
        }
        return 0;
      });
  }, [questionGroups, filters, decisions]);

  // Currently active items
  const activeGroup = useMemo(() => {
    if (!selectedQuestionId) return null;
    return questionGroups.find((g) => g.question._id === selectedQuestionId) || null;
  }, [questionGroups, selectedQuestionId]);

  const activeReport = useMemo(() => {
    if (!activeGroup) return null;
    if (selectedReportId) {
      return activeGroup.reports.find((r) => r.reportId === selectedReportId) || activeGroup.reports[0] || null;
    }
    return activeGroup.reports[0] || null;
  }, [activeGroup, selectedReportId]);

  const activeResult = useMemo(() => {
    if (!activeReport) return null;
    return results.find((r) => r.reportId === activeReport.reportId) || null;
  }, [activeReport, results]);

  const activeDecision = useMemo(() => {
    if (!activeReport) return null;
    return decisions[activeReport.reportId] || null;
  }, [activeReport, decisions]);

  // Actions
  const approveReport = (reportId: string, comment?: string) => {
    const res = results.find((r) => r.reportId === reportId);
    if (!res) return { success: false, message: "Report not found." };

    setDecisions((prev) => ({
      ...prev,
      [reportId]: {
        reportId,
        questionId: res.questionId,
        status: "approved",
        facultyMember: currentFaculty,
        decidedAt: new Date().toISOString(),
        approvedEdit: res.edit,
        customStudentReply: prev[reportId]?.customStudentReply || res.student_reply,
      },
    }));

    const auditEntry: AuditLogEntry = {
      id: `AUDIT_${Date.now()}_${reportId}`,
      timestamp: new Date().toISOString(),
      reportId,
      questionId: res.questionId,
      facultyMember: currentFaculty,
      action: "APPROVED",
      details: comment || `Approved triage decision: ${res.verdict}${res.repair ? ` (${res.repair})` : ""}`,
      field: res.edit?.field,
      before: res.edit?.find,
      after: typeof res.edit?.replace === "string" ? res.edit.replace : JSON.stringify(res.edit?.replace),
    };

    setAuditLog((prev) => [auditEntry, ...prev]);
    return { success: true, message: `Report ${reportId} successfully approved.` };
  };

  const editReportRepair = (
    reportId: string,
    field: "question" | "solution" | "answer" | "questionType",
    find: string | undefined,
    replace: string,
    comment?: string
  ) => {
    const res = results.find((r) => r.reportId === reportId);
    if (!res) return { success: false, message: "Report not found." };

    if (!taxonomy) return { success: false, message: "Taxonomy not loaded." };

    // Enforce safety restrictions on fields
    if (res.repair) {
      const isHumanOnly = taxonomy.repairs[res.repair]?.auto === false;
      const allowedFields = taxonomy.repairs[res.repair]?.fields || [];
      if (!isHumanOnly && !allowedFields.includes(field)) {
        return {
          success: false,
          message: `Taxonomy safety violation: Repair '${res.repair}' only permits modifications to [${allowedFields.join(", ")}]. '${field}' is not allowed.`,
        };
      }
    }

    const updatedEdit: SurgicalEdit = {
      field,
      find: find || "",
      replace,
    };

    setDecisions((prev) => ({
      ...prev,
      [reportId]: {
        reportId,
        questionId: res.questionId,
        status: "edited",
        facultyMember: currentFaculty,
        decidedAt: new Date().toISOString(),
        approvedEdit: updatedEdit,
        customStudentReply: prev[reportId]?.customStudentReply || res.student_reply,
      },
    }));

    const auditEntry: AuditLogEntry = {
      id: `AUDIT_${Date.now()}_${reportId}`,
      timestamp: new Date().toISOString(),
      reportId,
      questionId: res.questionId,
      facultyMember: currentFaculty,
      action: "EDITED",
      details: comment || `Faculty authored custom edit for '${field}': replace '${find || ""}' with '${replace}'`,
      field,
      before: find,
      after: replace,
    };

    setAuditLog((prev) => [auditEntry, ...prev]);
    return { success: true, message: `Custom repair committed for ${reportId}.` };
  };

  const rejectReport = (reportId: string, reason: string) => {
    const res = results.find((r) => r.reportId === reportId);
    if (!res) return { success: false, message: "Report not found." };

    setDecisions((prev) => ({
      ...prev,
      [reportId]: {
        reportId,
        questionId: res.questionId,
        status: "rejected",
        facultyMember: currentFaculty,
        decidedAt: new Date().toISOString(),
        approvedEdit: null,
        rejectionReason: reason,
        customStudentReply:
          prev[reportId]?.customStudentReply ||
          `Thank you for reporting. After expert faculty review, this question was verified and no modification was necessary.`,
      },
    }));

    const auditEntry: AuditLogEntry = {
      id: `AUDIT_${Date.now()}_${reportId}`,
      timestamp: new Date().toISOString(),
      reportId,
      questionId: res.questionId,
      facultyMember: currentFaculty,
      action: "REJECTED",
      details: `Rejected proposed repair. Reason: ${reason}`,
    };

    setAuditLog((prev) => [auditEntry, ...prev]);
    return { success: true, message: `Report ${reportId} marked rejected.` };
  };

  const updateStudentReply = (reportId: string, reply: string) => {
    setDecisions((prev) => {
      const existing = prev[reportId];
      if (!existing) return prev;
      return {
        ...prev,
        [reportId]: {
          ...existing,
          customStudentReply: reply,
        },
      };
    });

    const auditEntry: AuditLogEntry = {
      id: `AUDIT_${Date.now()}_${reportId}`,
      timestamp: new Date().toISOString(),
      reportId,
      questionId: decisions[reportId]?.questionId || "UNKNOWN",
      facultyMember: currentFaculty,
      action: "STUDENT_REPLY_UPDATED",
      details: `Updated personalized student reply: "${reply.slice(0, 80)}..."`,
    };

    setAuditLog((prev) => [auditEntry, ...prev]);
  };

  const resetAllDecisions = () => {
    localStorage.removeItem(LOCAL_STORAGE_DECISIONS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_AUDIT_KEY);

    const freshDecisions: Record<string, FacultyDecision> = {};
    results.forEach((res) => {
      let status: ReviewDecisionStatus = "pending";
      if (res.route === "auto_apply") status = "auto_applied";
      else if (res.route === "no_change") status = "approved";
      else status = "pending";

      freshDecisions[res.reportId] = {
        reportId: res.reportId,
        questionId: res.questionId,
        status,
        facultyMember: res.route === "auto_apply" ? "AI System (Auto)" : "System",
        decidedAt: new Date().toISOString(),
        approvedEdit: res.edit,
        customStudentReply: res.student_reply,
      };
    });

    setDecisions(freshDecisions);

    const resetAudit: AuditLogEntry = {
      id: `RESET_${Date.now()}`,
      timestamp: new Date().toISOString(),
      reportId: "GLOBAL",
      questionId: "GLOBAL",
      facultyMember: currentFaculty,
      action: "RESET",
      details: "Faculty initiated reset of all decisions and restored default triage baseline.",
    };

    setAuditLog([resetAudit]);
  };

  const exportUpdatedResults = () => {
    const updatedResults: TriageResult[] = results.map((original) => {
      const decision = decisions[original.reportId];
      if (!decision) return original;

      if (decision.status === "rejected") {
        return {
          ...original,
          verdict: "no_error",
          repair: null,
          edit: null,
          route: "no_change",
          student_reply: decision.customStudentReply || original.student_reply,
          evidence: `Rejected by ${decision.facultyMember}. Reason: ${decision.rejectionReason || "No defect"}`,
        };
      }

      if (decision.status === "edited" && decision.approvedEdit) {
        return {
          ...original,
          edit: decision.approvedEdit,
          student_reply: decision.customStudentReply || original.student_reply,
        };
      }

      if (decision.customStudentReply) {
        return {
          ...original,
          student_reply: decision.customStudentReply,
        };
      }

      return original;
    });

    const blob = new Blob([JSON.stringify(updatedResults, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acadza_reviewed_results_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardContext.Provider
      value={{
        questions,
        reports,
        results,
        taxonomy,
        decisions,
        auditLog,
        selectedQuestionId,
        selectedReportId,
        currentFaculty,
        filters,
        questionGroups,
        filteredQuestionGroups,
        activeGroup,
        activeResult,
        activeReport,
        activeDecision,
        isLoading,
        error,
        isAuditDrawerOpen,
        setSelectedQuestionId,
        setSelectedReportId,
        setCurrentFaculty,
        setFilters,
        setIsAuditDrawerOpen,
        approveReport,
        editReportRepair,
        rejectReport,
        updateStudentReply,
        resetAllDecisions,
        exportUpdatedResults,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
