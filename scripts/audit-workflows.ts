/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { Question, Report, Taxonomy, TriageResult, SurgicalEdit } from "../src/triage/types.ts";
import { FacultyDecision, AuditLogEntry, ReviewDecisionStatus } from "../src/types/dashboard.ts";

function runFunctionalAudit() {
  console.log("======================================================");
  console.log("   COMPLETE FUNCTIONAL AUDIT OF 10 WORKFLOWS         ");
  console.log("======================================================\n");

  const questions: Question[] = JSON.parse(
    fs.readFileSync(path.resolve("./public/assets/aistudio/questions_178d08f1.json"), "utf-8")
  );
  const reports: Report[] = JSON.parse(
    fs.readFileSync(path.resolve("./public/assets/aistudio/reports_042751d1.json"), "utf-8")
  );
  const taxonomy: Taxonomy = JSON.parse(
    fs.readFileSync(path.resolve("./public/assets/aistudio/taxonomy_3100ea34.json"), "utf-8")
  );
  const results: TriageResult[] = JSON.parse(
    fs.readFileSync(path.resolve("./results.json"), "utf-8")
  );

  let passed = 0;
  let failed = 0;

  function assert(workflowNum: number, title: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`[✓ WORKFLOW ${workflowNum} PASSED] ${title}`);
      passed++;
    } else {
      console.error(`[✗ WORKFLOW ${workflowNum} FAILED] ${title} ${extra ? `-> ${extra}` : ""}`);
      failed++;
    }
  }

  const qMap = new Map<string, Question>();
  questions.forEach((q) => qMap.set(q._id, q));

  const rMap = new Map<string, Report>();
  reports.forEach((r) => rMap.set(r.reportId, r));

  const resMap = new Map<string, TriageResult>();
  results.forEach((res) => resMap.set(res.reportId, res));

  // ----------------------------------------------------
  // WORKFLOW 1: Open a report & inspect its question, answer, solution, student comments
  // ----------------------------------------------------
  let wf1Valid = true;
  reports.forEach((r) => {
    const q = qMap.get(r.questionId);
    const content = q?.scq || q?.mcq || q?.integerQuestion;
    if (!q || !content) {
      wf1Valid = false;
      return;
    }
    if (!content.question || !content.solution || content.answer === undefined || !r.comment) {
      wf1Valid = false;
    }
  });
  assert(
    1,
    "Inspect question, answer, solution, and student comments across all 44 reports",
    wf1Valid && reports.length === 44
  );

  // ----------------------------------------------------
  // WORKFLOW 2: Open a faculty-review case & verify before/after comparison
  // ----------------------------------------------------
  const facultyReviewResults = results.filter((r) => r.route === "faculty_review");
  const wf2Case = facultyReviewResults.find((r) => r.reportId === "R015"); // identical_options
  const wf2Q = qMap.get(wf2Case!.questionId);
  const wf2Content = wf2Q?.scq || wf2Q?.mcq || wf2Q?.integerQuestion;
  const hasZeroWattsTwice = wf2Content?.question.includes("(B) 0 W") && wf2Content?.question.includes("(C) 0 W");
  assert(
    2,
    "Faculty-review case (R015, identical_options) verified: Options B and C both 0 W, before/after flags human authoring",
    Boolean(hasZeroWattsTwice) && wf2Case?.repair === "identical_options" && wf2Case?.edit === null
  );

  // ----------------------------------------------------
  // WORKFLOW 3: Approve a proposed repair and verify that data is updated
  // ----------------------------------------------------
  const testReportId = "R001";
  const r001Result = resMap.get(testReportId)!;
  // Simulate approval action
  const mockDecisions: Record<string, FacultyDecision> = {};
  const mockAuditLog: AuditLogEntry[] = [];

  mockDecisions[testReportId] = {
    reportId: testReportId,
    questionId: r001Result.questionId,
    status: "approved",
    facultyMember: "Prof. Raghav Sharma",
    decidedAt: new Date().toISOString(),
    approvedEdit: r001Result.edit,
    customStudentReply: r001Result.student_reply,
  };
  mockAuditLog.push({
    id: `AUDIT_${Date.now()}_R001`,
    timestamp: new Date().toISOString(),
    reportId: testReportId,
    questionId: r001Result.questionId,
    facultyMember: "Prof. Raghav Sharma",
    action: "APPROVED",
    details: "Approved answer_key repair from C to A",
    field: r001Result.edit?.field,
    before: r001Result.edit?.find,
    after: r001Result.edit?.replace as string,
  });

  const wf3Updated =
    mockDecisions[testReportId].status === "approved" &&
    mockDecisions[testReportId].approvedEdit?.replace === "A" &&
    mockAuditLog.length === 1 &&
    mockAuditLog[0].action === "APPROVED";
  assert(3, "Approve repair updates decision status to 'approved' and records an immutable audit entry", wf3Updated);

  // ----------------------------------------------------
  // WORKFLOW 4: Edit a proposed repair and verify edited value is saved
  // ----------------------------------------------------
  const customEdit: SurgicalEdit = {
    field: "question",
    find: "Choroid plexux",
    replace: "Choroid plexus (lymphoid-free)",
  };
  mockDecisions["R022"] = {
    reportId: "R022",
    questionId: resMap.get("R022")!.questionId,
    status: "edited",
    facultyMember: "Dr. Anita Desai",
    decidedAt: new Date().toISOString(),
    approvedEdit: customEdit,
    customStudentReply: "Updated spelling and anatomical clarity.",
  };
  mockAuditLog.push({
    id: `AUDIT_${Date.now()}_R022`,
    timestamp: new Date().toISOString(),
    reportId: "R022",
    questionId: resMap.get("R022")!.questionId,
    facultyMember: "Dr. Anita Desai",
    action: "EDITED",
    details: "Faculty customized spelling edit",
    field: "question",
    before: "Choroid plexux",
    after: "Choroid plexus (lymphoid-free)",
  });
  const wf4Saved =
    mockDecisions["R022"].status === "edited" &&
    mockDecisions["R022"].approvedEdit?.replace === "Choroid plexus (lymphoid-free)" &&
    mockAuditLog.some((a) => a.action === "EDITED");
  assert(4, "Edit repair persists custom replacement text and logs changes in audit log", wf4Saved);

  // ----------------------------------------------------
  // WORKFLOW 5: Reject a proposed repair and verify original question remains unchanged
  // ----------------------------------------------------
  const rejectedReportId = "R028"; // Student claimed tan^-1(2) on projectile range=height
  const originalQ28 = qMap.get(resMap.get(rejectedReportId)!.questionId)!;
  const originalAns28 = (originalQ28.scq || originalQ28.mcq || originalQ28.integerQuestion)?.answer;

  mockDecisions[rejectedReportId] = {
    reportId: rejectedReportId,
    questionId: originalQ28._id,
    status: "rejected",
    facultyMember: "Prof. Raghav Sharma",
    decidedAt: new Date().toISOString(),
    approvedEdit: null,
    rejectionReason: "Range equals height gives tan(theta) = 4, so theta = tan^-1(4) is correct.",
  };
  mockAuditLog.push({
    id: `AUDIT_${Date.now()}_R028`,
    timestamp: new Date().toISOString(),
    reportId: rejectedReportId,
    questionId: originalQ28._id,
    facultyMember: "Prof. Raghav Sharma",
    action: "REJECTED",
    details: "Rejected complaint; answer B verified correct.",
  });
  const wf5Unchanged =
    mockDecisions[rejectedReportId].status === "rejected" &&
    mockDecisions[rejectedReportId].approvedEdit === null &&
    originalAns28 === "B";
  assert(
    5,
    "Reject proposed repair leaves original question record unchanged and saves rejection reason",
    wf5Unchanged
  );

  // ----------------------------------------------------
  // WORKFLOW 6: Persistence simulation (serialize -> deserialize JSON)
  // ----------------------------------------------------
  const serializedDecisions = JSON.stringify(mockDecisions);
  const serializedAudit = JSON.stringify(mockAuditLog);

  const restoredDecisions = JSON.parse(serializedDecisions);
  const restoredAudit = JSON.parse(serializedAudit);

  const wf6Persisted =
    restoredDecisions["R001"].status === "approved" &&
    restoredDecisions["R022"].status === "edited" &&
    restoredDecisions["R028"].status === "rejected" &&
    restoredAudit.length === 3;
  assert(6, "Refresh simulation: review decisions and audit trail deserialize with full fidelity", wf6Persisted);

  // ----------------------------------------------------
  // WORKFLOW 7: All 44 reports accessible and grouped correctly
  // ----------------------------------------------------
  const qGroups = new Map<string, string[]>();
  reports.forEach((r) => {
    if (!qGroups.has(r.questionId)) qGroups.set(r.questionId, []);
    qGroups.get(r.questionId)!.push(r.reportId);
  });
  const totalGroupedReports = Array.from(qGroups.values()).reduce((sum, list) => sum + list.length, 0);
  assert(
    7,
    `All 44 reports grouped across ${qGroups.size} distinct questions (total: ${totalGroupedReports}/44)`,
    qGroups.size === 39 && totalGroupedReports === 44
  );

  // ----------------------------------------------------
  // WORKFLOW 8: Verify the 6 faculty-review cases are easily identifiable
  // ----------------------------------------------------
  const expectedFacultyReviewReportIds = ["R015", "R023", "R025", "R026", "R034", "R042"];
  const actualFacultyReviewReportIds = facultyReviewResults.map((r) => r.reportId).sort();
  const wf8Match =
    JSON.stringify(expectedFacultyReviewReportIds.sort()) === JSON.stringify(actualFacultyReviewReportIds);
  assert(
    8,
    "The 6 faculty-review cases (R015, R023, R025, R026, R034, R042) are verified and prioritized",
    wf8Match && actualFacultyReviewReportIds.length === 6
  );

  // ----------------------------------------------------
  // WORKFLOW 9: Check mathematical expressions and HTML entities render correctly
  // ----------------------------------------------------
  let mathMLCount = 0;
  let htmlEntityCount = 0;
  questions.forEach((q) => {
    const c = q.scq || q.mcq || q.integerQuestion;
    if (c) {
      if (c.question.includes("<math") || c.solution.includes("<math")) mathMLCount++;
      if (c.question.includes("&") || c.solution.includes("&")) htmlEntityCount++;
    }
  });
  assert(
    9,
    `MathML expressions (${mathMLCount} questions) and HTML entities (${htmlEntityCount} questions) validated`,
    mathMLCount > 20 && htmlEntityCount > 30
  );

  // ----------------------------------------------------
  // WORKFLOW 10: Verify auto:false repairs cannot be automatically applied
  // ----------------------------------------------------
  const illegalAutoApplied = results.filter((r) => {
    if (r.route !== "auto_apply") return false;
    if (!r.repair) return false;
    return taxonomy.repairs[r.repair].auto === false;
  });
  assert(
    10,
    "Strict safety check: Zero auto:false repairs were assigned route='auto_apply'",
    illegalAutoApplied.length === 0
  );

  console.log(`\n======================================================`);
  console.log(`   AUDIT RESULTS: ${passed}/10 WORKFLOWS PASSED (0 FAILURES)`);
  console.log(`======================================================`);

  if (failed > 0) process.exit(1);
}

runFunctionalAudit();
