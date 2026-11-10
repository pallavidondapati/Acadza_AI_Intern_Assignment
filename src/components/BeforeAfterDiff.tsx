/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { SurgicalEdit, RepairKey } from "../triage/types.ts";
import { useDashboard } from "../context/DashboardContext.tsx";
import { ArrowRight, AlertCircle, ShieldCheck, Check, Edit2, UserCheck } from "lucide-react";

interface BeforeAfterDiffProps {
  edit: SurgicalEdit | null;
  repair: RepairKey | null;
  status: string;
}

export const BeforeAfterDiff: React.FC<BeforeAfterDiffProps> = ({ edit, repair, status }) => {
  const { taxonomy } = useDashboard();

  if (!repair) {
    return (
      <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-400 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <span className="font-semibold text-slate-200">No Diff Required</span>
          <p className="mt-0.5 text-slate-400">
            This case was evaluated as a non-defect (or platform/display issue). The live stored question record is intact and no modifications are proposed.
          </p>
        </div>
      </div>
    );
  }

  const repairDef = taxonomy?.repairs[repair];
  const isHumanOnly = repairDef ? repairDef.auto === false : false;

  // If no edit is present yet (standard for auto:false triage)
  if (!edit) {
    return (
      <div className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-4 text-xs text-amber-200/90">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300">Human Faculty Authoring Required</span>
              <span className="px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px]">
                auto: false
              </span>
            </div>
            <p className="mt-1 text-slate-300 leading-relaxed">
              Per taxonomy policy, <strong>{repair}</strong> has empty permitted auto-fields (<code className="text-amber-300">fields: []</code>).
              {repair === "identical_options" && " Both options B and C currently display '0 W'. Authoring a new valid distractor requires human subject knowledge."}
              {repair === "diagram" && " Missing or corrupted figures require faculty authoring/upload."}
              {repair === "wrong_chapter" && " Re-tagging subjects/chapters requires curriculum faculty confirmation."}
              {repair === "syllabus" && " Determining syllabus inclusion requires academic committee review."}
              {repair === "unsound" && " Retiring or rewriting unsound questions requires senior faculty."}
            </p>
            <div className="mt-2 text-[11px] text-amber-400 font-medium">
              Action: Use the 'Approve Repair' button to confirm escalation, or 'Edit / Author Fix' to author a replacement.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allowedFields = repairDef?.fields || [];
  const fieldIsAllowed = isHumanOnly || allowedFields.includes(edit.field);

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
      {/* Header bar of Diff */}
      <div className="bg-slate-800/90 px-4 py-2.5 border-b border-slate-700/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Proposed Surgical Diff
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            field: {edit.field}
          </span>
          {isHumanOnly && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Faculty-Authored Fix
            </span>
          )}
        </div>

        {/* Safety restriction badge */}
        <div className="flex items-center gap-1.5">
          {fieldIsAllowed ? (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Check className="w-3 h-3" />{" "}
              {isHumanOnly ? "Human Verified Override" : `Taxonomy Permitted: [${allowedFields.join(", ")}]`}
            </span>
          ) : (
            <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Field Violation Warning
            </span>
          )}
        </div>
      </div>

      {/* Side-by-side diff view */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* BEFORE CHUNK */}
        <div className="bg-rose-950/20 border border-rose-800/40 rounded-lg p-3">
          <div className="flex items-center justify-between text-rose-400 font-semibold mb-2 pb-1.5 border-b border-rose-800/30">
            <span>ORIGINAL (BEFORE)</span>
            <span className="text-[10px] bg-rose-900/60 px-1.5 py-0.5 rounded-sm">Current Database</span>
          </div>
          <div className="text-rose-200/90 whitespace-pre-wrap break-words leading-relaxed font-sans text-xs bg-black/20 p-2.5 rounded-md border border-rose-900/40">
            {edit.find !== undefined && edit.find !== "" ? (
              <span className="bg-rose-500/30 text-rose-100 px-1 py-0.5 rounded-xs font-semibold">
                {edit.find}
              </span>
            ) : edit.field === "answer" ? (
              <span className="bg-rose-500/30 text-rose-100 px-2 py-1 rounded-md text-sm font-bold">
                Answer Key: {JSON.stringify(edit.find || "Original Key")}
              </span>
            ) : (
              <span className="italic text-slate-400">(Field content)</span>
            )}
          </div>
        </div>

        {/* AFTER CHUNK */}
        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-lg p-3">
          <div className="flex items-center justify-between text-emerald-400 font-semibold mb-2 pb-1.5 border-b border-emerald-800/30">
            <span>PROPOSED FIX (AFTER)</span>
            <span className="text-[10px] bg-emerald-900/60 px-1.5 py-0.5 rounded-sm">Surgical Patch</span>
          </div>
          <div className="text-emerald-200/90 whitespace-pre-wrap break-words leading-relaxed font-sans text-xs bg-black/20 p-2.5 rounded-md border border-emerald-900/40">
            {typeof edit.replace === "string" && edit.replace !== "" ? (
              <span className="bg-emerald-500/30 text-emerald-100 px-1 py-0.5 rounded-xs font-semibold">
                {edit.replace}
              </span>
            ) : edit.field === "answer" ? (
              <span className="bg-emerald-500/30 text-emerald-100 px-2 py-1 rounded-md text-sm font-bold">
                Answer Key: {JSON.stringify(edit.replace)}
              </span>
            ) : (
              <span className="italic text-slate-400">(No replacement text)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
