# PRODUCT.md — Product Strategy & Philosophy

---

### 1. Who Loses the Most When a Question is Broken?

The student who was right, got marked wrong, and believed the platform over their own reasoning.

In competitive exams like JEE and NEET, where rank cutoffs differ by single marks, a student spends 20 minutes re-solving an LCR circuit (like in R001) or a Gaussian surface (like in R005), convinced they lack conceptual clarity because Acadza's key marked them negative. This destroys self-confidence during critical preparation months.

**How our design reflects this:**
- **Answer Key Priority:** Answer key mismatches are ranked at the very top of the review queue. They are flagged with high-impact badges because they actively distort student scores.
- **Empathetic, Pedagogical Student Replies:** We never reply with a cold automated dismissive response. If the student was correct, we celebrate their sharp eye and confirm the key is fixed. If the student made an arithmetic or significant-figure slip (e.g., R032, R033), we explain the exact step (e.g., converting meters to centimeters or rounding rules) with encouragement.

---

### 2. What We Would NEVER Let the AI Auto-Apply, and Why

We will **never** auto-apply changes in these five domains (`auto: false` in `taxonomy.json`):
1. **Identical Options (`identical_options`):** When two options repeat, creating a plausible fourth distractor is creative pedagogy. An AI might invent a ridiculous distractor that makes the question trivial, undermining exam validity.
2. **Missing Diagrams (`diagram`):** Fabricating a scientific schematic or circuit diagram requires verified technical drawing and syllabus adherence.
3. **Curriculum/Syllabus Removals (`syllabus`):** Retiring a question because a student claims it is "out of syllabus" risks stripping valid practice material right before exams. Only human academic directors can make curriculum scope determinations.
4. **Subject/Chapter Reclassifications (`wrong_chapter`):** Misclassifying questions corrupts adaptive testing algorithms and performance analytics.
5. **Scientifically Unsound Questions (`unsound`):** Completely invalid questions require formal retirement or textbook rewriting by subject matter experts.

---

### 3. One Metric to Watch in Week 1

**Time-to-Remediation for High-Impact Answer Key Defects (TTR-AK):**
> *The duration between the first student report of an answer key discrepancy and the automated or faculty-confirmed live database patch.*

**Why:**
A broken answer key is an active contagion: every hour it sits uncorrected, hundreds of students taking mock tests receive erroneous negative marks. Reducing TTR-AK from days to under 15 minutes prevents score contamination for thousands of aspirants.

---

### 4. One Idea Beyond This Brief: Proactive Question Defect Hunting via Dual-Model Cross-Verification

Instead of waiting for students to suffer through broken questions and tap "Report error", run an asynchronous **Content Ingestion Gatekeeper**:
- During question upload, two independent reasoning models independently solve the question from the raw stem without seeing the keyed answer or stored solution.
- If both solvers arrive at Option D, but the author keyed Option A, the question is quarantined *before* it ever reaches a student.
- Furthermore, as demonstrated in our unreported question audit, this proactively catches silent defects (such as missing units or calculation typos in solutions) that students have not yet reported.
