/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { runTriagePipeline } from "../src/triage/engine.ts";
import { validateTriageResults } from "../src/triage/validator.ts";
import { Question, Report, Taxonomy } from "../src/triage/types.ts";

function main() {
  console.log("==========================================");
  console.log("   ACADZA REPORTFIX: AI TRIAGE PIPELINE   ");
  console.log("==========================================\n");

  const questionsPath = path.resolve("./public/assets/aistudio/questions_178d08f1.json");
  const reportsPath = path.resolve("./public/assets/aistudio/reports_042751d1.json");
  const taxonomyPath = path.resolve("./public/assets/aistudio/taxonomy_3100ea34.json");

  const questions: Question[] = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
  const reports: Report[] = JSON.parse(fs.readFileSync(reportsPath, "utf-8"));
  const taxonomy: Taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf-8"));

  console.log(`[+] Loaded ${questions.length} questions from dataset.`);
  console.log(`[+] Loaded ${reports.length} reports to evaluate.`);
  console.log(`[+] Loaded taxonomy with ${Object.keys(taxonomy.verdicts).length} verdicts and ${Object.keys(taxonomy.repairs).length} repair rules.\n`);

  console.log("[*] Executing triage engine...");
  const results = runTriagePipeline(reports, questions, taxonomy);

  console.log("[*] Validating results against strict taxonomy & schema constraints...");
  const validation = validateTriageResults(results, reports, taxonomy);

  if (!validation.isValid) {
    console.error("\n[!] VALIDATION FAILED! Violations detected:");
    validation.violations.forEach((v) => {
      console.error(` - [${v.reportId}] [${v.rule}]: ${v.message}`);
    });
    process.exit(1);
  }

  console.log("[✓] Validation passed with ZERO violations!\n");
  console.log("--- BREAKDOWN SUMMARY ---");
  console.log("Total Reports Evaluated:", validation.totalReports);
  console.log("\nVerdicts Distribution:");
  console.table(validation.verdictCounts);
  console.log("\nRepairs Distribution:");
  console.table(validation.repairCounts);
  console.log("\nRouting Distribution:");
  console.table(validation.routeCounts);

  // Write results.json to root and public
  const rootResultsPath = path.resolve("./results.json");
  const publicResultsPath = path.resolve("./public/results.json");

  fs.writeFileSync(rootResultsPath, JSON.stringify(results, null, 2), "utf-8");
  fs.writeFileSync(publicResultsPath, JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n[✓] Successfully exported results to:\n  - ${rootResultsPath}\n  - ${publicResultsPath}`);
}

main();
