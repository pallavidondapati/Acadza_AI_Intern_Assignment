/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext.tsx";
import {
  ShieldAlert,
  Download,
  History,
  RotateCcw,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

const FACULTY_MEMBERS = [
  "Prof. Raghav Sharma (Physics Lead)",
  "Dr. Anita Desai (Biology Lead)",
  "Er. Sameer Kulkarni (Academic Director)",
  "Dr. Meenakshi Sundaram (Curriculum Head)",
];

export const Header: React.FC = () => {
  const {
    currentFaculty,
    setCurrentFaculty,
    auditLog,
    setIsAuditDrawerOpen,
    exportUpdatedResults,
    resetAllDecisions,
    results,
    decisions,
  } = useDashboard();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Calculate review progress
  const pendingCount = results.filter((r) => {
    const d = decisions[r.reportId];
    return d ? d.status === "pending" : r.route === "faculty_review";
  }).length;

  const resolvedCount = results.length - pendingCount;
  const progressPercent = Math.round((resolvedCount / (results.length || 1)) * 100);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Acadza ReportFix</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Faculty Console
                </span>
                <span className="text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 44 Live Reports
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated triage & surgical repair workflow for 8 Lakh+ JEE/NEET questions
              </p>
            </div>
          </div>

          {/* Controls: Faculty Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Review Progress pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs">
              <span className="text-slate-400">Review Progress:</span>
              <div className="w-16 bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-bold text-emerald-400">{resolvedCount}/{results.length}</span>
            </div>

            {/* Faculty Switcher */}
            <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={currentFaculty}
                onChange={(e) => setCurrentFaculty(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none focus:ring-0 cursor-pointer font-medium pr-1"
                aria-label="Active Faculty Reviewer"
              >
                {FACULTY_MEMBERS.map((fac) => (
                  <option key={fac} value={fac} className="bg-slate-900 text-white">
                    {fac}
                  </option>
                ))}
              </select>
            </div>

            {/* Audit Log Drawer Toggle */}
            <button
              onClick={() => setIsAuditDrawerOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              title="View full audit trail"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Audit Log</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[10px]">
                {auditLog.length}
              </span>
            </button>

            {/* Export results.json */}
            <button
              onClick={exportUpdatedResults}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
              title="Download results.json with faculty decisions"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export results.json</span>
            </button>

            {/* Reset decisions */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset all review decisions to triage default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Reset All Decisions?</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  This will reset all approved, edited, and rejected decisions back to the baseline triage output.
                  Audit logs will record this reset action.
                </p>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      resetAllDecisions();
                      setShowResetConfirm(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer shadow-sm"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
