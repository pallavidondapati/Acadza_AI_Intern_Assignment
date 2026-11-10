/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Report,
  Taxonomy,
  TriageResult,
  ValidationSummary,
  ValidationViolation,
} from "./types.ts";

export function validateTriageResults(
  results: TriageResult[],
  reports: Report[],
  taxonomy: Taxonomy
): ValidationSummary {
  const violations: ValidationViolation[] = [];
  const validVerdicts = new Set(Object.keys(taxonomy.verdicts));
  const validRepairs = new Set(Object.keys(taxonomy.repairs));
  const reportIdsInInput = new Set(reports.map((r) => r.reportId));
  const seenReportIds = new Set<string>();

  const verdictCounts: Record<string, number> = {};
  const repairCounts: Record<string, number> = {};
  const routeCounts: Record<string, number> = {};

  if (results.length !== reports.length) {
    violations.push({
      reportId: "GLOBAL",
      rule: "REPORT_COUNT_MATCH",
      message: `Expected ${reports.length} results, but got ${results.length}`,
    });
  }

  results.forEach((res, index) => {
    const reportId = res.reportId || `INDEX_${index}`;

    // Check duplicate or missing report IDs
    if (!reportIdsInInput.has(res.reportId)) {
      violations.push({
        reportId,
        rule: "UNKNOWN_REPORT_ID",
        message: `Report ID ${res.reportId} does not exist in input reports.`,
      });
    }

    if (seenReportIds.has(res.reportId)) {
      violations.push({
        reportId,
        rule: "DUPLICATE_REPORT_RESULT",
        message: `Duplicate result entry for report ID ${res.reportId}.`,
      });
    }
    seenReportIds.add(res.reportId);

    // Track counts
    verdictCounts[res.verdict] = (verdictCounts[res.verdict] || 0) + 1;
    if (res.repair) {
      repairCounts[res.repair] = (repairCounts[res.repair] || 0) + 1;
    }
    routeCounts[res.route] = (routeCounts[res.route] || 0) + 1;

    // Validate verdict
    if (!validVerdicts.has(res.verdict)) {
      violations.push({
        reportId,
        rule: "INVALID_VERDICT",
        message: `Verdict '${res.verdict}' is not in allowed taxonomy verdicts.`,
      });
    }

    // Validate repair requirement
    if (res.verdict === "defect") {
      if (!res.repair) {
        violations.push({
          reportId,
          rule: "MISSING_REPAIR",
          message: "A defect verdict must have a designated repair key.",
        });
      } else if (!validRepairs.has(res.repair)) {
        violations.push({
          reportId,
          rule: "INVALID_REPAIR",
          message: `Repair '${res.repair}' is not in allowed taxonomy repairs.`,
        });
      }
    } else {
      if (res.repair !== null) {
        violations.push({
          reportId,
          rule: "REPAIR_ON_NON_DEFECT",
          message: `Verdict '${res.verdict}' must have repair = null, but got '${res.repair}'.`,
        });
      }
      if (res.route !== "no_change") {
        violations.push({
          reportId,
          rule: "ROUTE_ON_NON_DEFECT",
          message: `Verdict '${res.verdict}' must route to 'no_change', but got '${res.route}'.`,
        });
      }
      if (res.edit !== null) {
        violations.push({
          reportId,
          rule: "EDIT_ON_NON_DEFECT",
          message: `Verdict '${res.verdict}' must have edit = null.`,
        });
      }
    }

    // Validate edit & field safety restrictions
    if (res.repair) {
      const repairDef = taxonomy.repairs[res.repair];
      if (repairDef) {
        // Check auto flag safety
        if (!repairDef.auto && res.route === "auto_apply") {
          violations.push({
            reportId,
            rule: "AUTO_APPLY_PROHIBITED",
            message: `Repair '${res.repair}' is marked auto:false. Route must not be auto_apply.`,
          });
        }

        // Check allowed fields
        if (res.edit) {
          if (!repairDef.fields.includes(res.edit.field)) {
            violations.push({
              reportId,
              rule: "FIELD_PERMISSION_VIOLATION",
              message: `Repair '${res.repair}' only permits fields [${repairDef.fields.join(", ")}], but edit modified '${res.edit.field}'.`,
            });
          }
          if (repairDef.fields.length === 0) {
            violations.push({
              reportId,
              rule: "EDIT_FORBIDDEN_FOR_REPAIR",
              message: `Repair '${res.repair}' has empty allowed fields (human must author). System may not write edits.`,
            });
          }
        }
      }
    }

    // Confidence check
    if (typeof res.confidence !== "number" || res.confidence < 0 || res.confidence > 1) {
      violations.push({
        reportId,
        rule: "INVALID_CONFIDENCE",
        message: `Confidence must be a float between 0.0 and 1.0, got ${res.confidence}.`,
      });
    }

    // Evidence & reply check
    if (!res.evidence || res.evidence.trim().length === 0) {
      violations.push({
        reportId,
        rule: "EMPTY_EVIDENCE",
        message: "Evidence string must be non-empty.",
      });
    }
    if (!res.student_reply || res.student_reply.trim().length === 0) {
      violations.push({
        reportId,
        rule: "EMPTY_STUDENT_REPLY",
        message: "Student reply must be non-empty.",
      });
    }
  });

  return {
    isValid: violations.length === 0,
    totalReports: results.length,
    violations,
    verdictCounts,
    repairCounts,
    routeCounts,
  };
}
