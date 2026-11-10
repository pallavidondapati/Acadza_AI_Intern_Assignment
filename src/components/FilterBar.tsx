/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useDashboard } from "../context/DashboardContext.tsx";
import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { VerdictKey, RepairKey } from "../triage/types.ts";
import { ReviewDecisionStatus, FilterState } from "../types/dashboard.ts";

export const FilterBar: React.FC = () => {
  const { filters, setFilters, taxonomy, filteredQuestionGroups } = useDashboard();

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      verdict: "all",
      repair: "all",
      status: "all",
      subject: "all",
      sortBy: "urgency",
    });
  };

  const isFiltered =
    filters.searchQuery !== "" ||
    filters.verdict !== "all" ||
    filters.repair !== "all" ||
    filters.status !== "all" ||
    filters.subject !== "all" ||
    filters.sortBy !== "urgency";

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 mb-5 shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search by Report ID (R001), Question ID, student comment, or keywords..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: "" }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Review Status */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value as ReviewDecisionStatus | "all" }))
            }
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Status: All</option>
            <option value="pending">Status: Pending Review</option>
            <option value="auto_applied">Status: Auto-Applied</option>
            <option value="approved">Status: Approved</option>
            <option value="edited">Status: Custom Edited</option>
            <option value="rejected">Status: Rejected</option>
          </select>

          {/* Verdict Filter */}
          <select
            value={filters.verdict}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, verdict: e.target.value as VerdictKey | "all" }))
            }
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Verdict: All</option>
            <option value="defect">defect</option>
            <option value="no_error">no_error</option>
            <option value="display_issue">display_issue</option>
            <option value="app_issue">app_issue</option>
            <option value="language_mode">language_mode</option>
            <option value="already_fixed">already_fixed</option>
            <option value="not_actionable">not_actionable</option>
          </select>

          {/* Repair Filter */}
          <select
            value={filters.repair}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, repair: e.target.value as RepairKey | "all" }))
            }
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Repair: All</option>
            {taxonomy &&
              Object.keys(taxonomy.repairs).map((rep) => (
                <option key={rep} value={rep}>
                  {rep} {taxonomy.repairs[rep as RepairKey]?.auto ? "(auto)" : "(human)"}
                </option>
              ))}
          </select>

          {/* Subject Filter */}
          <select
            value={filters.subject}
            onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value }))}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Subject: All</option>
            <option value="Physics">Physics</option>
            <option value="Zoology">Zoology</option>
            <option value="Botany">Botany</option>
          </select>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as FilterState["sortBy"],
                }))
              }
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="urgency" className="bg-slate-900">Sort: Urgency First</option>
              <option value="reportCount" className="bg-slate-900">Sort: Most Reports</option>
              <option value="confidenceAsc" className="bg-slate-900">Sort: Lowest Confidence</option>
              <option value="reportTime" className="bg-slate-900">Sort: Latest Reported</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 px-2.5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Showing matches count */}
      <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          Showing <strong className="text-white">{filteredQuestionGroups.length}</strong> questions matching criteria
        </span>
        {filters.verdict !== "all" || filters.status !== "all" ? (
          <span className="text-indigo-400 font-medium">Filter active</span>
        ) : null}
      </div>
    </div>
  );
};
