# BalanceMath Tutor — ET 617 End-Semester Exam (`24B1292`)

**Student Roll Number / Identity Token:** `24B1292`  
**Live Deployment:** [https://et617-24b1292.vercel.app](https://et617-24b1292.vercel.app)  
**GitHub Repository:** [https://github.com/heyhellobye/et617-endsem-24B1292](https://github.com/heyhellobye/et617-endsem-24B1292)

---

## Exam Card (`P4 · T3 · L2 · C1`)
* **Problem (`P4`):** Adaptive tutor with automatic question generation (3 question formats, explanation evaluation, misconception diagnosis, and 3-outcome adaptive routing).
* **Topic (`T3`):** Linear equations in one variable (Class 8).
* **Learner Context (`L2`):** First-generation learner in an urban low-income settlement attending an NGO after-school centre with shared tablets.
* **Design Constraint (`C1`):** Low bandwidth (`~115 kB` First Load JS, inline SVG balance scale, zero media `> 1 MB`, 4-second `AbortController` timeout, and deterministic offline fallback).

---

## Key Features
1. **5 Connected Screens:** Welcome &rarr; Self-Evaluation Guide &amp; 2-Item Warm-Up &rarr; Scale Lab (Interactive SVG Balance Scale) &rarr; Adaptive Practice &amp; Reasoning Studio &rarr; Session Summary.
2. **3 Question Formats:**
   * Diagnostic Multiple Choice (`2x + 3 = 11`)
   * Interactive Balance-Scale Step Builder (`3x - 4 = 11`)
   * Open-Ended Reasoning / Spot &amp; Explain (`x - 6 = 10`, plus word problem `15x + 20 = 95` with equation hidden upfront and revealed in progressive hints)
3. **Explicit 3-Outcome Adaptive Engine (`src/lib/adaptiveEngine.ts`):**
   * `ADVANCE`: `isCorrect && hintCount === 0` &rarr; next uncompleted Core/Stretch item (or `COMPLETE`).
   * `REMEDIATE_MISCONCEPTION`: `!isCorrect && (M1 || M2) && consecutiveErrors < 2` &rarr; targeted counter-explanation &amp; parallel item.
   * `STEP_BACK_PREREQUISITE`: `consecutiveErrors >= 2 || PREREQUISITE_GAP` &rarr; foundational like-terms micro-card (`4x + 3` vs. `7x`).

---

## Running Locally
```bash
npm install
npm run dev
```
Optional environment variables (never commit `.env*`):
* `GEMINI_API_KEY` or `OPENAI_API_KEY` for live LLM grading in `/api/evaluate` (automatically falls back to deterministic offline evaluation when absent or on a 4-second timeout).

See [DESIGN.md](./DESIGN.md) for the full design specification.
