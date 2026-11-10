/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { MessageSquare, Check, Sparkles, AlertCircle } from "lucide-react";
import { useDashboard } from "../context/DashboardContext.tsx";

interface StudentReplyEditorProps {
  reportId: string;
  initialReply: string;
  studentId: string;
}

export const StudentReplyEditor: React.FC<StudentReplyEditorProps> = ({
  reportId,
  initialReply,
  studentId,
}) => {
  const { decisions, updateStudentReply } = useDashboard();
  const currentReply = decisions[reportId]?.customStudentReply || initialReply;

  const [text, setText] = useState(currentReply);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setText(currentReply);
    setIsSaved(false);
  }, [currentReply, reportId]);

  const handleSave = () => {
    updateStudentReply(reportId, text);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const isModified = text.trim() !== currentReply.trim();

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-xs">
      <div className="bg-slate-800/80 px-4 py-2.5 border-b border-slate-700/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold text-white">Student Response Preview</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
            to {studentId}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">1-3 sentences • Encouraging & Pedagogical</span>
      </div>

      <div className="p-4">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setIsSaved(false);
          }}
          rows={3}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans resize-none"
          placeholder="Craft a supportive, factual response explaining the physics or thanking them for catching a defect..."
        />

        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Tone guide: Respect student effort, cite scientific facts without condescension.</span>
          </div>

          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!text.trim() || (!isModified && !isSaved)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isModified
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              }`}
            >
              Update Student Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
