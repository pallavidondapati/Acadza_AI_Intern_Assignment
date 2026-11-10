/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useDashboard } from "../context/DashboardContext.tsx";
import {
  FileText,
  AlertTriangle,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Filter,
} from "lucide-react";
import { VerdictKey, RouteKey } from "../triage/types.ts";
import { ReviewDecisionStatus } from "../types/dashboard.ts";

export const DashboardOverview: React.FC = () => {
  const { results, decisions, filters, setFilters } = useDashboard();

  // Metric counts
  const totalReports = results.length;
  const genuineDefects = results.filter((r) => r.verdict === "defect").length;
  const autoApplied = results.filter((r) => r.route === "auto_apply").length;

  // Pending faculty review from live decisions
  const pendingFaculty = results.filter((r) => {
    const d = decisions[r.reportId];
    return d ? d.status === "pending" : r.route === "faculty_review";
  }).length;

  const nonDefectReports = results.filter((r) => r.verdict !== "defect").length;

  // Filter setters
  const applyQuickFilter = (
    status: ReviewDecisionStatus | "all",
    verdict: VerdictKey | "all"
  ) => {
    setFilters((prev) => ({
      ...prev,
      status,
      verdict,
    }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-5">
      {/* Total Reports */}
      <div
        onClick={() => applyQuickFilter("all", "all")}
        className={`cursor-pointer rounded-xl p-3.5 border transition-all duration-200 shadow-xs ${
          filters.status === "all" && filters.verdict === "all"
            ? "bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500/30"
            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
        }`}
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Reports</span>
          <FileText className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-white tracking-tight">{totalReports}</span>
          <span className="text-[11px] text-slate-400">Across 39 Qs</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">All student flagged cases</div>
      </div>

      {/* Genuine Defects */}
      <div
        onClick={() => applyQuickFilter("all", "defect")}
        className={`cursor-pointer rounded-xl p-3.5 border transition-all duration-200 shadow-xs ${
          filters.verdict === "defect"
            ? "bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/30"
            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
        }`}
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
            Genuine Defects
          </span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-rose-400 tracking-tight">{genuineDefects}</span>
          <span className="text-[11px] font-medium text-rose-300/80">61.4% Rate</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">Verified factual & layout flaws</div>
      </div>

      {/* Auto-Applied Repairs */}
      <div
        onClick={() => applyQuickFilter("auto_applied", "defect")}
        className={`cursor-pointer rounded-xl p-3.5 border transition-all duration-200 shadow-xs ${
          filters.status === "auto_applied"
            ? "bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/30"
            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
        }`}
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Auto-Applied
          </span>
          <Zap className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-emerald-400 tracking-tight">{autoApplied}</span>
          <span className="text-[11px] font-medium text-emerald-300/80">auto: true</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">Surgical high-confidence fixes</div>
      </div>

      {/* Pending Faculty Review */}
      <div
        onClick={() => applyQuickFilter("pending", "all")}
        className={`cursor-pointer rounded-xl p-3.5 border transition-all duration-200 shadow-xs ${
          filters.status === "pending"
            ? "bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/30"
            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
        }`}
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Faculty Review
          </span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-amber-400 tracking-tight">{pendingFaculty}</span>
          <span className="text-[11px] font-medium text-amber-300/80">Needs Human</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">Diagram, Syllabus, Unsound, etc.</div>
      </div>

      {/* Non-Defect Reports */}
      <div
        onClick={() => applyQuickFilter("all", "no_error")}
        className={`cursor-pointer rounded-xl p-3.5 border transition-all duration-200 shadow-xs ${
          filters.verdict === "no_error"
            ? "bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/30"
            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
        }`}
      >
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
            Non-Defect
          </span>
          <ShieldCheck className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-blue-400 tracking-tight">{nonDefectReports}</span>
          <span className="text-[11px] font-medium text-blue-300/80">38.6% Total</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">Misreads, traps & platform bugs</div>
      </div>
    </div>
  );
};
