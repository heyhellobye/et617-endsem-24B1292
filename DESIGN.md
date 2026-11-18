# ET 617 End-Semester Examination — Design Document (`DESIGN.md`)
**Student Roll Number / Identity Token:** `24B1292`  
**GitHub Repository:** `https://github.com/heyhellobye/et617-endsem-24B1292`  
**Target Live URL:** `https://et617-24b1292.vercel.app`  

---

## 1. Exam Card & Non-Negotiables
* **Problem (`P`):** `P4 – Adaptive tutor with automatic question generation`
  * Supports **3 question formats** (Diagnostic Multiple Choice, Interactive Balance-Scale Step Builder, Open-Ended Reasoning / "Spot & Explain the Mistake"), evaluates learner explanations, diagnoses misconceptions (`M1`, `M2`), and adapts task difficulty/nature without repeating completed items.
  * **Mandatory P4 Design Challenge:** Explicitly states and demonstrates the decision rule deciding whether the learner needs:
    1. **A harder question (`ADVANCE`)**
    2. **An alternative explanation (`REMEDIATE_MISCONCEPTION`)**
    3. **Prerequisite instruction (`STEP_BACK_PREREQUISITE`)**
* **Topic (`T`):** `P4-T3 – Linear equations in one variable (Class 8)`
* **Learner Context (`L`):** `L2 – First-generation learner in an urban low-income settlement, attends an NGO after-school centre with shared tablets`
* **Design Constraint (`C`):** `C1 – Low bandwidth`
  * Lightweight inline SVGs and pure CSS/Tailwind (`~115 kB` total First Load JS, zero media > 1 MB).
  * `/api/evaluate` enforces a **4-second `AbortController` timeout** and seamlessly falls back to the built-in deterministic offline misconception parser & item bank when no API key is set or a call fails/times out—without cluttering the student's screen.
* **Identity Token (`ID`):** `24B1292` — shown visibly in the footer of every screen/state and in the About modal (`About (24B1292)`).

---

## 2. D1 — Educational Problem & Measurable Learning Outcomes
### Problem Statement
Class 8 first-generation learners attending urban NGO after-school centres often struggle to transition from arithmetic to algebraic balancing when solving linear equations in one variable. Instead of treating an equation as a balanced scale where identical operations preserve equality, learners frequently transpose terms across the equals sign without flipping signs or combine unlike terms ($2x + 3 = 5x$). Without immediate diagnosis of why a step went wrong, these procedural slips persist into multi-step word problems. This adaptive tutor diagnoses specific transposition and like-term misconceptions from both structured inputs and written reasoning, dynamically routing learners to targeted counter-explanations, prerequisite balancing practice, or stretch problems on low-bandwidth shared tablets.

### Measurable Learning Outcomes
1. **Model** one-step and two-step linear equations using an interactive balance-scale tool by applying inverse operations equally to both sides.
2. **Diagnose and correct** transposition sign errors and unlike-term combination errors by writing short step-by-step reasoning explanations.
3. **Formulate and solve** linear equations in one variable from everyday contextual word problems (such as shared auto-rickshaw fares).

### Context of Use
Used during 45-minute evening study sessions at an urban NGO after-school learning centre on shared 10-inch Android tablets over a throttled 3G/4G mobile hotspot, where every learner gets 20–25 minutes of individual practice before passing the tablet to a peer.

---

## 3. D2 — Learner Persona
* **Name & Age:** Aarav Kamble, 13 years old (Class 8).
* **Prior Knowledge:** Can solve basic arithmetic missing-number boxes ($\square + 5 = 12$), perform integer addition and subtraction, and evaluate simple expressions like $2x$ when $x = 3$, but struggles when variables appear with coefficients and constants ($2x + 3 = 11$) or on both sides ($4x + 3 = 2x + 13$).
* **Target Misconceptions:**
  * **Misconception `M1` (Transposing Without Flipping Sign):** Solves $2x + 3 = 11$ as $2x = 11 + 3 = 14 \Rightarrow x = 7$ (or $x + 6 = 14$ as $x = 20$), moving a term across `=` without applying the inverse operation.
  * **Misconception `M2` (Combining Unlike Terms / Variable-Constant Fusion):** Simplifies $2x + 3 = 11$ into $5x = 11$, merging the coefficient $2$ and constant $3$ as if both had $x$.
* **Device & Connectivity:** Shared Lenovo Tab M10 at the NGO centre on a slow shared Wi-Fi hotspot; requires lightweight text/SVG assets (<1 MB total) and uninterrupted offline/cached fallback.
* **Time & Language:** 25-minute evening slot; speaks Marathi and Hindi at home and studies in a semi-English medium school, so all copy uses warm, conversational, short active-voice sentences with relatable local examples.

---

## 4. D3 — 5 Connected Screens & Adaptive Decision Rules
### Screens / States
1. **Screen 1 – Welcome:** Introduces Aarav's 25-minute guided session using the kirana weighing-scale metaphor and links to the Self-Evaluation Guide or Scale Lab.
2. **Screen 2 – Self-Evaluation Guide Window & 2-Item Warm-Up (Diagnostic):**
   * *Self-Evaluation Guide:* Explains in 3 friendly steps how the learner can check their own thinking before any question appears.
   * *D-1 (Substitution):* If $x = 4$, what is $3x + 2$?
   * *D-2 (One-Step Balancing):* Solve $x + 6 = 14$ ($x = 20$ flags `M1`; $7x = 14$ flags `M2`). Displays immediate encouraging feedback before advancing and sets starting level (`Foundational` or `Standard`).
3. **Screen 3 – Scale Lab (Conversational Concept Primer & Interactive Balance Scale `T6`):**
   * Warm, conversational active-voice mini-lesson comparing $x$ to a **sealed mystery bag** and numbers to **1-rupee coins**.
   * **Interactive SVG Balance Scale:** Displays $2x + 3 = 11$ with $x$-bags and coins on both pans. Inverse operation buttons update the scale step-by-step to $x = 4$ (tilting when an unbalanced step is attempted).
4. **Screen 4 – Adaptive Practice & Reasoning Studio (3 Formats):**
   * **Format 1 — Quick Check (Diagnostic MCQ):** $2x + 3 = 11$ with `M1` and `M2` distractors.
   * **Format 2 — Balance-Scale Step Builder:** $3x - 4 = 11$ with Step 1 & Step 2 inverse operations + live SVG scale.
   * **Format 3 — Spot & Explain the Mistake:** Classmate solves $x - 6 = 10$ as $x = 4$; learner enters $x = 16$ and writes a one-sentence explanation.
   * **Stretch Track (`ADVANCE`):** Auto-rickshaw word problem (equation $15x + 20 = 95$ **hidden upfront** and revealed progressively in Hint 1/2) and variables on both sides ($4x + 3 = 2x + 13$).
   * **Remedial Track (`REMEDIATE_MISCONCEPTION`):** Parallel `M1` ($3x + 2 = 14$) and `M2` ($4x + 5 = 21$) items with targeted counter-explanations.
   * **Base Check (`STEP_BACK_PREREQUISITE`):** "Mystery Bags vs. Loose Coins: Can $4x + 3$ ever equal $7x$?"
   * **Collapsed Teacher & Evaluator Tools:** Houses the **Quick-Fill Demo Scenarios** and **Decision Rule Trace** table without cluttering the student's workspace.
5. **Screen 5 – Session Summary & About Modal (`24B1292`):**
   * Summarizes questions practiced, accuracy, areas checked (`M1`/`M2`), skills strengthened, practice journey, **"Clear & Pass Tablet to Next Peer"** reset, and **About / Exam Card (`Roll No: 24B1292`)**.

### Explicit Adaptive Decision Rule Engine (`P4`)
Adapts dynamically on all 3 signals (initial diagnostic profile, answer correctness & misconception tag, and interaction behavior: progressive hint usage & consecutive errors) while tracking `completedIds` so solved questions never repeat:
1. **`ADVANCE` (Harder Question / Next Track Item):** `if (isCorrect && hintCount === 0)` $\rightarrow$ advances to next uncompleted Core/Stretch item (or `"COMPLETE"` to finish to Summary).
2. **`REMEDIATE_MISCONCEPTION` (Alternative Explanation):** `else if (!isCorrect && (misconceptionTag === 'M1' || misconceptionTag === 'M2') && consecutiveErrors < 2)` $\rightarrow$ shows targeted counter-explanation & parallel item (`Q_REM_M1` or `Q_REM_M2`).
3. **`STEP_BACK_PREREQUISITE` (Prerequisite Instruction):** `else if (consecutiveErrors >= 2 || misconceptionTag === 'PREREQUISITE_GAP')` $\rightarrow$ routes to foundational like-terms micro-card (`Q_PREREQ_1`).

---

## 5. D5 — Two Contrasting Demo Scenarios
* **Scenario A (Correct Path):** Diagnostic passed $\rightarrow$ Task 1 ($2x + 3 = 11$) answered $x = 4$ with 0 hints $\rightarrow$ triggers `ADVANCE` $\rightarrow$ progresses through Balance Builder ($3x - 4 = 11$), Spot & Explain ($x - 6 = 10$), Auto-Rickshaw word problem, and $4x + 3 = 2x + 13$ $\rightarrow$ Summary.
* **Scenario B (Misconception `M1` & `M2` Path):** Task 1 ($2x + 3 = 11$) answered $x = 7$ $\rightarrow$ triggers `REMEDIATE_MISCONCEPTION (M1)` $\rightarrow$ next item missed via `M2` (2nd consecutive error) $\rightarrow$ triggers `STEP_BACK_PREREQUISITE` micro-card $\rightarrow$ learner completes prerequisite and recovers.

---

## 6. D6 & C1 — AI Architecture & Low-Bandwidth Fallback
* **`/api/evaluate`:** Accepts `{ questionId, questionPrompt, learnerAnswer, explanationText }`. Uses `process.env.GEMINI_API_KEY` or `process.env.OPENAI_API_KEY` with a **4-second `AbortController` timeout** and strict JSON schema validation (`isCorrect`, `misconceptionTag`, `feedback`).
* **Deterministic Offline / Fallback Mode:** Automatically activates when no API key is set or the 4s timeout expires. Runs the built-in algebraic + question-specific explanation keyword parser (`reasoningKeywords` + `M1`/`M2` clue detection) so all 5 screens and all 3 adaptive outcomes work 100% reliably on slow connections.
