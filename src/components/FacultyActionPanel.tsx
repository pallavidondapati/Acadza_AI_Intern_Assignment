/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useDashboard } from "../context/DashboardContext.tsx";
import { TriageResult, RepairKey } from "../triage/types.ts";
import {
  CheckCircle,
  Edit3,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Save,
  X,
  User,
  Info,
} from "lucide-react";

interface FacultyActionPanelProps {
  result: TriageResult;
  status: string;
}

export const FacultyActionPanel: React.FC<FacultyActionPanelProps> = ({ result, status }) => {
  const {
    currentFaculty,
    taxonomy,
    approveReport,
    editReportRepair,
    rejectReport,
  } = useDashboard();

  const [activeModal, setActiveModal] = useState<"approve" | "edit" | "reject" | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit form state
  const isHumanOnly = result.repair ? taxonomy?.repairs[result.repair]?.auto === false : false;
  const taxonomyFields = (result.repair && taxonomy?.repairs[result.repair]?.fields) || [];
  const allowedFields = isHumanOnly || taxonomyFields.length === 0
    ? ["question", "solution", "answer", "questionType"]
    : taxonomyFields;
  const [editField, setEditField] = useState<"question" | "solution" | "answer" | "questionType">(
    result.edit?.field || (allowedFields[0] as "question" | "solution" | "answer" | "questionType") || "question"
  );
  const [editFind, setEditFind] = useState<string>(result.edit?.find || "");
  const [editReplace, setEditReplace] = useState<string>(
    typeof result.edit?.replace === "string" ? result.edit.replace : JSON.stringify(result.edit?.replace || "")
  );
  const [editComment, setEditComment] = useState<string>("");

  // Reject form state
  const [rejectReason, setRejectReason] = useState<string>(
    "Verified question and key independently; question is conceptually sound and student complaint is inaccurate."
  );

  const handleApproveConfirm = () => {
    const res = approveReport(
      result.reportId,
      `Approved by ${currentFaculty}: Verified ${result.verdict}${result.repair ? ` (${result.repair})` : ""}`
    );
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      setActiveModal(null);
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  const handleEditConfirm = () => {
    const res = editReportRepair(result.reportId, editField, editFind, editReplace, editComment);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      setActiveModal(null);
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      setFeedback({ type: "error", message: "Please provide a valid scientific reason for rejection." });
      return;
    }
    const res = rejectReport(result.reportId, rejectReason);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      setActiveModal(null);
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" /> Faculty Review Actions
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Acting as: <strong className="text-indigo-300">{currentFaculty}</strong> • Current Decision:{" "}
            <span className="font-semibold uppercase text-slate-200">{status}</span>
          </p>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
              feedback.type === "success"
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                : "bg-rose-950/40 text-rose-300 border-rose-500/30"
            }`}
          >
            {feedback.message}
            <button onClick={() => setFeedback(null)} className="ml-1 text-slate-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Approve Button */}
        <button
          onClick={() => setActiveModal("approve")}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Approve Repair</span>
        </button>

        {/* Edit Button */}
        <button
          onClick={() => setActiveModal("edit")}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit / Author Fix</span>
        </button>

        {/* Reject Button */}
        <button
          onClick={() => setActiveModal("reject")}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <XCircle className="w-4 h-4" />
          <span>Reject Complaint</span>
        </button>
      </div>

      {/* 1. APPROVE CONFIRMATION MODAL */}
      {activeModal === "approve" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Confirm Approval for Report {result.reportId}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 text-xs space-y-2">
              <p className="text-slate-300">
                You are approving the triage decision as{" "}
                <strong className="text-white">{currentFaculty}</strong>.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-[11px] font-mono">
                <div>Verdict: <span className="text-indigo-300">{result.verdict}</span></div>
                {result.repair && <div>Repair: <span className="text-indigo-300">{result.repair}</span></div>}
                {result.edit && (
                  <div>
                    Surgical Edit: field <code className="text-amber-300">{result.edit.field}</code> → replace with{" "}
                    <code className="text-emerald-300">{JSON.stringify(result.edit.replace)}</code>
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-[11px]">
                An audit entry will be permanently logged with your name and timestamp.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT / AUTHOR REPAIR MODAL */}
      {activeModal === "edit" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" /> Custom Surgical Repair for {result.reportId}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 text-xs space-y-3">
              {/* Field selector with taxonomy enforcement */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Target Field to Modify (Taxonomy Restrained)
                </label>
                <select
                  value={editField}
                  onChange={(e) =>
                    setEditField(e.target.value as "question" | "solution" | "answer" | "questionType")
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {allowedFields.length > 0 ? (
                    allowedFields.map((f) => (
                      <option key={f} value={f}>
                        {f} (Permitted)
                      </option>
                    ))
                  ) : (
                    <option value="question">No auto fields allowed in taxonomy</option>
                  )}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Permitted by taxonomy: [{allowedFields.join(", ") || "None (human must author)"}]
                </span>
              </div>

              {/* Find Substring */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Substring to Find (in original {editField})
                </label>
                <input
                  type="text"
                  value={editFind}
                  onChange={(e) => setEditFind(e.target.value)}
                  placeholder="Exact string to replace (leave blank for answer keys)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Replace Substring */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Replacement Content
                </label>
                <textarea
                  value={editReplace}
                  onChange={(e) => setEditReplace(e.target.value)}
                  rows={3}
                  placeholder="New content to patch..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono resize-none"
                />
              </div>

              {/* Faculty Note */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Audit Rationale / Note
                </label>
                <input
                  type="text"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Why this surgical change was chosen..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditConfirm}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Save & Apply Repair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REJECT CONFIRMATION MODAL */}
      {activeModal === "reject" && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" /> Reject Student Complaint ({result.reportId})
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 text-xs space-y-3">
              <p className="text-slate-300">
                Rejecting this report will confirm the live question as valid. No modifications will be made.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Scientific Reason for Rejection (Audit Logged)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
                  placeholder="Detail the scientific derivation or why the student miscalculated..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
