/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useDashboard } from "../context/DashboardContext.tsx";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Zap,
  Users,
  Check,
  XCircle,
  Edit3,
} from "lucide-react";
import { QuestionGroup, ReviewDecisionStatus } from "../types/dashboard.ts";

export const QuestionQueue: React.FC = () => {
  const {
    filteredQuestionGroups,
    selectedQuestionId,
    setSelectedQuestionId,
    setSelectedReportId,
    decisions,
  } = useDashboard();

  if (filteredQuestionGroups.length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-8 text-center text-slate-400">
        <p className="text-sm font-medium">No questions match the current filters.</p>
        <p className="text-xs text-slate-500 mt-1">Try resetting search or filter options.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
      {filteredQuestionGroups.map((group) => {
        const isSelected = group.question._id === selectedQuestionId;

        // Determine aggregated status for group
        let overallStatus: ReviewDecisionStatus = "approved";
        const groupDecisions = group.reports.map((r) => decisions[r.reportId]?.status || "pending");

        if (groupDecisions.includes("pending")) {
          overallStatus = "pending";
        } else if (groupDecisions.includes("edited")) {
          overallStatus = "edited";
        } else if (groupDecisions.includes("rejected")) {
          overallStatus = "rejected";
        } else if (groupDecisions.includes("auto_applied")) {
          overallStatus = "auto_applied";
        } else {
          overallStatus = "approved";
        }

        // Snippet of question text
        const content = group.question.scq || group.question.mcq || group.question.integerQuestion;
        const plainText = content?.question
          ? content.question.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
          : "Question content";

        return (
          <div
            key={group.question._id}
            onClick={() => {
              setSelectedQuestionId(group.question._id);
              if (group.reports.length > 0) {
                setSelectedReportId(group.reports[0].reportId);
              }
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative ${
              isSelected
                ? "bg-slate-800 border-indigo-500 shadow-lg ring-1 ring-indigo-500/50"
                : "bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
            }`}
          >
            {/* Top row: Subject, Chapter & Urgency Badges */}
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-200">
                  {group.question.subject}
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
                  {group.question.chapter}
                </span>
              </div>

              {/* Status Badge */}
              {overallStatus === "pending" && (
                <span className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3 h-3" /> Needs Review
                </span>
              )}
              {overallStatus === "auto_applied" && (
                <span className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Zap className="w-3 h-3" /> Auto-Applied
                </span>
              )}
              {overallStatus === "approved" && (
                <span className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Check className="w-3 h-3" /> Approved
                </span>
              )}
              {overallStatus === "edited" && (
                <span className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Edit3 className="w-3 h-3" /> Custom Edit
                </span>
              )}
              {overallStatus === "rejected" && (
                <span className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <XCircle className="w-3 h-3" /> Rejected
                </span>
              )}
            </div>

            {/* Question Text Snippet */}
            <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed mb-2.5">
              {plainText}
            </p>

            {/* Chips row: Report IDs, Verdict, Repair */}
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-700/50">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Report chips */}
                {group.reports.map((r) => (
                  <span
                    key={r.reportId}
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-900 border border-slate-700 text-slate-300 font-semibold"
                  >
                    {r.reportId}
                  </span>
                ))}

                {/* Multi-report counter */}
                {group.isMultiReport && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 font-medium">
                    <Users className="w-2.5 h-2.5" /> {group.reports.length}
                  </span>
                )}

                {/* Trap badges */}
                {group.hasAdversarialAttempt && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-rose-950/60 text-rose-300 border border-rose-800 flex items-center gap-0.5 font-medium">
                    <ShieldAlert className="w-2.5 h-2.5 text-rose-400" /> Injection
                  </span>
                )}
                {group.hasAlreadyFixed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-0.5 font-medium">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Already Fixed
                  </span>
                )}
              </div>

              {/* Verdict & Repair Indicator */}
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${
                    group.primaryVerdict === "defect"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : group.primaryVerdict === "no_error"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {group.primaryVerdict}
                </span>

                {group.primaryRepair && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {group.primaryRepair}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
