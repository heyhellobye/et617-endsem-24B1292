# ET 617 End-Semester Examination — Design Document (`DESIGN.md`)
**Student Roll Number / Identity Token:** `24B1292`  
**GitHub Repository:** `https://github.com/heyhellobye/et617-endsem-24B1292`  
**Target Live URL:** `https://et617-24b1292.vercel.app`  

---

## 1. Exam Card & Non-Negotiables
* **Problem (`P`):** `P4 – Adaptive tutor with automatic question generation`
  * Supports **3+ question formats** (Diagnostic Multiple Choice, Interactive Balance-Scale Step Builder, Open-Ended Reasoning / "Diagnose & Explain"), evaluates learner explanations, diagnoses specific misconceptions, and adapts task difficulty/nature.
  * **Mandatory P4 Design Challenge:** Explicitly states and demonstrates the decision rule deciding whether the learner needs:
    1. **A harder question (`ADVANCE`)**
    2. **An alternative explanation (`REMEDIATE_MISCONCEPTION`)**
    3. **Prerequisite instruction (`STEP_BACK_PREREQUISITE`)**
* **Topic (`T`):** `P4-T3 – Linear equations in one variable (Class 8)`
* **Learner Context (`L`):** `L2 – First-generation learner in an urban low-income settlement, attends an NGO after-school centre with shared tablets`
* **Design Constraint (`C`):** `C1 – Low bandwidth`
  * Lightweight inline SVGs and pure CSS/Tailwind (`<100 KB` core bundle, zero media > 1 MB).
  * Clear fallback banner and deterministic offline adaptive engine when AI calls fail, time out (4s `AbortController`), or no API key is configured.
* **Identity Token (`ID`):** `24B1292` — shown visibly in the footer of every screen/state and in the About modal/screen.

---

## 2. D1 — Educational Problem & Measurable Learning Outcomes
### Problem Statement
Class 8 first-generation learners attending urban NGO after-school centres often struggle to transition from arithmetic to algebraic balancing when solving linear equations in one variable. Instead of treating an equation as a balanced scale where identical operations preserve equality, learners frequently transpose terms across the equals sign without flipping signs or combine unlike terms ($2x + 3 = 5x$). Without immediate diagnosis of why a step went wrong, these procedural slips persist into multi-step word problems. This adaptive tutor diagnoses specific transposition and like-term misconceptions from both structured inputs and written reasoning, dynamically routing learners to targeted counter-explanations, prerequisite balancing practice, or stretch problems on low-bandwidth shared tablets.

### Measurable Learning Outcomes
1. **Model** one-step and two-step linear equations using an interactive balance-scale tool by applying inverse operations equally to both sides.
2. **Diagnose and correct** transposition sign errors and unlike-term combination errors by writing short step-by-step reasoning explanations.
3. **Formulate and solve** linear equations in one variable from everyday contextual word problems (shared auto-rickshaw fares, kirana grocery bills, mobile recharge budgets).

### Context of Use
Used during 45-minute evening study sessions at an urban NGO after-school learning centre on shared 10-inch Android tablets over a throttled 3G/4G mobile hotspot, where every learner gets 20–25 minutes of individual practice before passing the tablet to a peer.

---

## 3. D2 — Learner Persona
* **Name & Age:** Aarav Kamble, 13 years old (Class 8).
* **Prior Knowledge:** Can solve basic arithmetic missing-number boxes ($\square + 5 = 12$), perform integer addition and subtraction, and evaluate simple expressions like $2x$ when $x = 3$, but struggles when variables appear with coefficients and constants ($2x + 3 = 11$) or on both sides ($3x + 2 = x + 10$).
* **Target Misconceptions:**
  * **Misconception `M1` (Transposing Without Flipping Sign):** Solves $2x + 3 = 11$ as $2x = 11 + 3 = 14 \Rightarrow x = 7$, moving a term across `=` without applying the inverse operation.
  * **Misconception `M2` (Combining Unlike Terms / Variable-Constant Fusion):** Simplifies $2x + 3 = 11$ into $5x = 11$, merging the coefficient $2$ and constant $3$ as if both had $x$.
* **Device & Connectivity:** Shared Lenovo Tab M10 at the NGO centre on a slow shared Wi-Fi hotspot; requires lightweight text/SVG assets (<1 MB total) and uninterrupted offline/cached fallback.
* **Time & Language:** 25-minute evening slot; speaks Marathi and Hindi at home and studies in a semi-English medium school, so all copy uses warm, conversational, short active-voice sentences with relatable local examples.

---

## 4. D3 — 5 Connected Screens & Adaptive Decision Rules
### Screens / States
1. **Screen 1 – Welcome & Low-Bandwidth Setup:** Introduces Aarav's NGO tablet session, shows the Low-Bandwidth readiness badge (`<100 KB` inline SVG bundle), provides a top-bar **`Simulate AI Timeout / Offline Fallback`** toggle, and starts the session.
2. **Screen 2 – Diagnostic Warm-Up (2 Items):**
   * *D-1 (Substitution):* If $x = 4$, what is $3x + 2$?
   * *D-2 (One-Step Balancing):* Solve $x + 6 = 14$ (distractor $x = 20$ flags `M1` early; sets starting level to `Foundational` or `Standard`).
3. **Screen 3 – Conversational Concept Primer & Interactive Balance Scale (`T6`):**
   * Warm, conversational active-voice mini-lesson comparing $x$ to a **sealed mystery bag** and numbers to **1-rupee coins**.
   * **Interactive SVG Balance Scale:** Displays $2x + 3 = 11$ with $x$-bags and coins on the left pan and coins on the right pan. Inverse operation buttons update the scale step-by-step to $x = 4$.
4. **Screen 4 – Adaptive Practice & Reasoning Studio (3 Formats):**
   * **Format 1 — Diagnostic Multiple Choice** ($2x + 3 = 11$ with `M1` and `M2` distractors).
   * **Format 2 — Interactive Balance-Scale Step Builder** ($3x - 4 = 11$ with Step 1 & Step 2 inverse operations + live SVG scale).
   * **Format 3 — Open-Ended Reasoning / "Diagnose & Explain"** (classmate solves $x - 6 = 10$ as $x = 4$; learner enters correct $x = 16$ and explains the mistake).
   * **Stretch Bank (`ADVANCE`):** Auto-rickshaw fare ($15x + 20 = 95$) and variables on both sides ($4x + 3 = 2x + 13$).
   * **Remedial Bank (`REMEDIATE_MISCONCEPTION`):** Parallel `M1` ($3x + 2 = 14$) and `M2` ($4x + 5 = 21$) items with targeted counter-explanations.
   * **Prerequisite Micro-Card (`STEP_BACK_PREREQUISITE`):** "Mystery Bags vs. Loose Coins: Can $4x + 3$ ever equal $7x$?"
5. **Screen 5 – Session Mastery Report & About Screen (`24B1292`):**
   * Summarizes accuracy, misconceptions detected & resolved, full **Decision Rule History Log**, and complete **About / Exam Card Identity** (`Roll No: 24B1292`).

### Explicit Adaptive Decision Rule Engine (`P4`)
Adapts dynamically on all 3 signals (initial diagnostic profile, answer correctness & misconception tag, and interaction behavior: hint usage & consecutive errors):
1. **`ADVANCE` (Harder Question):** `if (isCorrect && hintCount === 0)`
2. **`REMEDIATE_MISCONCEPTION` (Alternative Explanation):** `else if (!isCorrect && (misconceptionTag === 'M1' || misconceptionTag === 'M2') && consecutiveErrors < 2)`
3. **`STEP_BACK_PREREQUISITE` (Prerequisite Instruction):** `else if (consecutiveErrors >= 2 || misconceptionTag === 'PREREQUISITE_GAP')`
*(Fallback when `!isCorrect` with no specific tag and `consecutiveErrors < 2`: gentle guided hint + retry or `REMEDIATE_MISCONCEPTION` depending on error pattern.)*

---

## 5. D5 — Two Contrasting Demo Scenarios
* **Scenario A (Mastery Path):** Diagnostic passed $\rightarrow$ Task 1 ($2x + 3 = 11$) answered $x = 4$ with 0 hints $\rightarrow$ triggers `ADVANCE` $\rightarrow$ serves $15x + 20 = 95$ $\rightarrow$ solved $x = 5$ with explanation $\rightarrow$ Session Mastery Report.
* **Scenario B (Misconception `M1` & `M2` Path):** Task 1 ($2x + 3 = 11$) answered $x = 7$ $\rightarrow$ triggers `REMEDIATE_MISCONCEPTION (M1)` $\rightarrow$ next item missed via `M2` (2nd consecutive error) $\rightarrow$ triggers `STEP_BACK_PREREQUISITE` micro-card $\rightarrow$ learner completes prerequisite and recovers.

---

## 6. D6 & C1 — AI Architecture & Low-Bandwidth Fallback
* **`/api/evaluate`:** Accepts `{ questionId, questionPrompt, learnerAnswer, explanationText, history }`. Uses `process.env.GEMINI_API_KEY` or `process.env.OPENAI_API_KEY` with a **4-second `AbortController` timeout** and strict JSON schema validation (`isCorrect`, `misconceptionTag`, `feedback`, `nextQuestion`).
* **Deterministic Offline / Fallback Mode:** Automatically activates when no key is set, timeout expires, or the user toggles **`Simulate AI Timeout / Offline Fallback`**. Displays a clear amber banner and runs the built-in algebraic + explanation keyword parser so all 5 screens and all 3 adaptive outcomes work 100% offline.
