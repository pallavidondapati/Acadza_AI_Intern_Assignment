/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext.tsx";
import {
  X,
  History,
  Download,
  Search,
  CheckCircle,
  Edit3,
  XCircle,
  MessageSquare,
  Zap,
  RotateCcw,
} from "lucide-react";

export const AuditLogDrawer: React.FC = () => {
  const { auditLog, isAuditDrawerOpen, setIsAuditDrawerOpen } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");

  if (!isAuditDrawerOpen) return null;

  const filteredLogs = auditLog.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.reportId.toLowerCase().includes(term) ||
      log.questionId.toLowerCase().includes(term) ||
      log.facultyMember.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  });

  const exportAuditLogJson = () => {
    const blob = new Blob([JSON.stringify(auditLog, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acadza_audit_log_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "APPROVED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> APPROVED
          </span>
        );
      case "EDITED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Edit3 className="w-2.5 h-2.5" /> EDITED
          </span>
        );
      case "REJECTED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" /> REJECTED
          </span>
        );
      case "STUDENT_REPLY_UPDATED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <MessageSquare className="w-2.5 h-2.5" /> REPLY UPDATED
          </span>
        );
      case "SYSTEM_AUTO_APPLIED":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" /> SYSTEM AUTO
          </span>
        );
      case "RESET":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5" /> RESET
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-slate-700 text-slate-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50">
      <div className="bg-slate-900 border-l border-slate-700 w-full max-w-xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Audit Trail & Compliance Log</h2>
              <p className="text-[11px] text-slate-400">
                Immutable ledger of all faculty approvals, edits, and rejections
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportAuditLogJson}
              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
              title="Download audit log JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsAuditDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search inside audit log */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/90">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail by Report ID, faculty member, or action..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Audit entries list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No audit records matching search criteria.
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getActionBadge(entry.action)}
                    {entry.reportId !== "SYSTEM" && entry.reportId !== "GLOBAL" && (
                      <span className="font-mono text-[11px] font-semibold text-indigo-300">
                        {entry.reportId}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">{entry.details}</p>

                {/* Diff summary if present */}
                {entry.before !== undefined && entry.after !== undefined && (
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] space-y-1">
                    {entry.field && <div className="text-slate-400 font-semibold">field: {entry.field}</div>}
                    <div className="text-rose-400 line-through truncate">- {entry.before || "(empty)"}</div>
                    <div className="text-emerald-400 truncate">+ {entry.after}</div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-700/40">
                  <span>
                    Faculty: <strong className="text-slate-300">{entry.facultyMember}</strong>
                  </span>
                  <span className="font-mono">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
