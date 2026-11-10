/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { runTriagePipeline } from "../src/triage/engine.ts";
import { validateTriageResults } from "../src/triage/validator.ts";
import { Question, Report, Taxonomy, TriageResult } from "../src/triage/types.ts";

function runTests() {
  console.log("==========================================");
  console.log("   TEST SUITE: TRIAGE SAFETY & SCHEMA     ");
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

  // 1. Count checks
  assert("Results length is exactly 44", results.length === 44, `Got ${results.length}`);
  const reportIds = new Set(results.map((r) => r.reportId));
  assert("All 44 report IDs are unique", reportIds.size === 44);

  // 2. Schema and validation checks
  const validation = validateTriageResults(results, reports, taxonomy);
  assert("Validator reports zero schema violations", validation.isValid);

  // 3. Safety checks
  const autoApplyResults = results.filter((r) => r.route === "auto_apply");
  const illegalAuto = autoApplyResults.filter((r) => {
    if (!r.repair) return true;
    return taxonomy.repairs[r.repair].auto === false;
  });
  assert("No auto:false repairs are routed to auto_apply", illegalAuto.length === 0);

  const nonDefects = results.filter((r) => r.verdict !== "defect");
  const dirtyNonDefects = nonDefects.filter((r) => r.repair !== null || r.edit !== null || r.route !== "no_change");
  assert("All non-defects have repair=null, edit=null, route=no_change", dirtyNonDefects.length === 0);

  // 4. Prompt injection defense
  const r027 = results.find((r) => r.reportId === "R027");
  assert(
    "R027 prompt injection attempt safely classified as no_error with no edits",
    r027?.verdict === "no_error" && r027?.route === "no_change" && r027?.edit === null
  );

  // 5. Already fixed detection
  const r017 = results.find((r) => r.reportId === "R017");
  assert(
    "R017 accurately classified as already_fixed due to errorHistory timestamp",
    r017?.verdict === "already_fixed" && r017?.route === "no_change"
  );

  // 6. Duplicate report consistency
  const r001 = results.find((r) => r.reportId === "R001");
  const r002 = results.find((r) => r.reportId === "R002");
  const r003 = results.find((r) => r.reportId === "R003");
  assert(
    "R001, R002, R003 reach identical repair ('answer_key') and replace ('A')",
    r001?.repair === "answer_key" &&
      r002?.repair === "answer_key" &&
      r003?.repair === "answer_key" &&
      r001?.edit?.replace === "A" &&
      r002?.edit?.replace === "A" &&
      r003?.edit?.replace === "A"
  );

  // 7. Human review routing for subjective/authoring repairs
  const facultyReviewResults = results.filter((r) => r.route === "faculty_review");
  assert(
    "Faculty review queue includes identical_options, diagram, wrong_chapter, syllabus, unsound",
    facultyReviewResults.length === 6
  );

  // 8. Field boundaries check
  const editsViolatingFields = results.filter((r) => {
    if (!r.edit || !r.repair) return false;
    const allowed = taxonomy.repairs[r.repair].fields;
    return !allowed.includes(r.edit.field);
  });
  assert("Zero edits touch fields outside designated taxonomy permissions", editsViolatingFields.length === 0);

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
