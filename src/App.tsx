/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DashboardProvider, useDashboard } from "./context/DashboardContext.tsx";
import { Header } from "./components/Header.tsx";
import { DashboardOverview } from "./components/DashboardOverview.tsx";
import { FilterBar } from "./components/FilterBar.tsx";
import { QuestionQueue } from "./components/QuestionQueue.tsx";
import { QuestionDetailView } from "./components/QuestionDetailView.tsx";
import { AuditLogDrawer } from "./components/AuditLogDrawer.tsx";
import { Loader2, AlertCircle } from "lucide-react";

const DashboardMain: React.FC = () => {
  const { isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
        <h2 className="text-base font-semibold text-white">Loading Acadza ReportFix Dashboard...</h2>
        <p className="text-xs text-slate-400 mt-1">
          Loading 44 student reports, live questions, and taxonomy definitions.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-6 max-w-md w-full text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-white">Failed to Initialize Dashboard</h2>
          <p className="text-xs text-rose-200 mt-2 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Metric Cards Overview */}
        <DashboardOverview />

        {/* Search & Filter Bar */}
        <FilterBar />

        {/* 2-Column Split: Queue (Left) & Detailed Workspace (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Review Queue Column */}
          <section className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1 pb-1">
              <span>PRIORITIZED REVIEW QUEUE</span>
              <span>Sorted by Urgency</span>
            </div>
            <QuestionQueue />
          </section>

          {/* Question Detail & Actions Column */}
          <section className="lg:col-span-7">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1 pb-1">
              <span>QUESTION INSPECTION & ACTIONS</span>
              <span>Live MathML</span>
            </div>
            <QuestionDetailView />
          </section>
        </div>
      </main>

      {/* Slide-out Audit Trail Drawer */}
      <AuditLogDrawer />
    </div>
  );
};

export default function App() {
  return (
    <DashboardProvider>
      <DashboardMain />
    </DashboardProvider>
  );
}
