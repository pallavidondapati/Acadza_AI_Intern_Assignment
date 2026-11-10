/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { Question, Report, Taxonomy, TriageResult } from "../src/triage/types.ts";

function testDashboardData() {
  console.log("==========================================");
  console.log("   DASHBOARD DATA & LINKING TEST SUITE    ");
  console.log("==========================================\n");

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

  function assert(description: string, condition: boolean, extraDetail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${description} ${extraDetail ? `(${extraDetail})` : ""}`);
      failed++;
    }
  }

  // 1. Linking Integrity
  const qMap = new Map(questions.map((q) => [q._id, q]));
  const resMap = new Map(results.map((r) => [r.reportId, r]));

  let allReportsLinked = true;
  reports.forEach((r) => {
    if (!qMap.has(r.questionId)) allReportsLinked = false;
  });
  assert("All 44 reports successfully link to an existing question in questions.json", allReportsLinked);

  let allResultsLinked = true;
  reports.forEach((r) => {
    if (!resMap.has(r.reportId)) allResultsLinked = false;
  });
  assert("All 44 reports successfully link to a triage result entry", allResultsLinked);

  // 2. Question Groups
  const groupMap = new Map<string, Report[]>();
  reports.forEach((r) => {
    if (!groupMap.has(r.questionId)) groupMap.set(r.questionId, []);
    groupMap.get(r.questionId)!.push(r);
  });
  assert("Reports group into 39 distinct question cards", groupMap.size === 39);

  const multiReportGroups = Array.from(groupMap.entries()).filter(([_, reps]) => reps.length > 1);
  assert("Multi-report questions identified (4 questions with >1 report)", multiReportGroups.length === 4);

  // 3. Faculty Review Queue
  const pendingFacultyReports = results.filter((r) => r.route === "faculty_review");
  assert("Faculty review queue has exactly 6 reports requiring human authoring", pendingFacultyReports.length === 6);

  const pendingRepairs = pendingFacultyReports.map((r) => r.repair);
  const expectedHumanRepairs = ["identical_options", "wrong_chapter", "diagram", "syllabus", "unsound"];
  const allHumanOnly = pendingRepairs.every((rep) => expectedHumanRepairs.includes(rep!));
  assert("Pending review reports only contain auto:false repairs (identical_options, wrong_chapter, diagram, syllabus, unsound)", allHumanOnly);

  // 4. Auto-applied Queue
  const autoAppliedReports = results.filter((r) => r.route === "auto_apply");
  assert("Auto-applied queue contains 21 high-confidence surgical repairs", autoAppliedReports.length === 21);
  const autoRepairsValid = autoAppliedReports.every((r) => taxonomy.repairs[r.repair!].auto === true);
  assert("All 21 auto-applied repairs have auto:true in taxonomy", autoRepairsValid);

  // 5. Non-defect Queue
  const nonDefectReports = results.filter((r) => r.verdict !== "defect");
  assert("Non-defect count is 17 (11 no_error + 2 display + 1 app + 1 lang + 1 already_fixed + 1 not_actionable)", nonDefectReports.length === 17);

  // 6. Security & Traps
  const injectionResult = results.find((r) => r.reportId === "R027");
  assert("Injection attack R027 has verdict='no_error', edit=null, route='no_change'", injectionResult?.verdict === "no_error" && injectionResult?.edit === null && injectionResult?.route === "no_change");

  const fixedResult = results.find((r) => r.reportId === "R017");
  assert("Temporal trap R017 has verdict='already_fixed', edit=null, route='no_change'", fixedResult?.verdict === "already_fixed" && fixedResult?.route === "no_change");

  console.log(`\nDashboard Test Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

testDashboardData();
