export type ScreenId = "welcome" | "diagnostic" | "primer" | "practice" | "report";

export type MisconceptionTag =
  | "NONE"
  | "M1"
  | "M2"
  | "PREREQUISITE_GAP"
  | "PARTIAL_STEP";

export type AdaptiveOutcome =
  | "ADVANCE"
  | "REMEDIATE_MISCONCEPTION"
  | "STEP_BACK_PREREQUISITE";

export type QuestionFormat = "MCQ" | "BALANCE_BUILDER" | "EXPLAIN";

export type QuestionTier =
  | "CORE"
  | "STRETCH"
  | "REMEDIAL_M1"
  | "REMEDIAL_M2"
  | "PREREQUISITE";

export interface McqOption {
  id: string;
  label: string;
  value: string;
  isCorrect: boolean;
  misconceptionTag: MisconceptionTag;
}

export interface BalanceScaleConfig {
  leftX: number;
  leftConst: number;
  rightX: number;
  rightConst: number;
  step1Expected: string;
  step2Expected: string;
  step1Options: { id: string; label: string }[];
  step2Options: { id: string; label: string }[];
  intermediateEquation: string;
  finalSolution: string;
}

export interface QuestionItem {
  id: string;
  tier: QuestionTier;
  format: QuestionFormat;
  badge: string;
  equation: string;
  hideEquationUpfront?: boolean;
  prompt: string;
  contextNote?: string;
  hints: string[];
  expectedNumericAnswer: number;
  requireExplanation: boolean;
  explanationPrompt?: string;
  reasoningKeywords?: string[];
  reasoningHintFeedback?: string;
  modelAnswer: string;
  options?: McqOption[];
  balanceConfig?: BalanceScaleConfig;
}

export interface DecisionTraceEntry {
  stepNumber: number;
  questionId: string;
  equation: string;
  learnerAnswer: string;
  isCorrect: boolean;
  misconceptionTag: MisconceptionTag;
  streak: number;
  hintCount: number;
  consecutiveErrors: number;
  outcome: AdaptiveOutcome;
  ruleMatched: string;
  nextQuestionId: string;
  mode: "ai" | "offline" | "fallback";
}

export interface EvaluationResult {
  isCorrect: boolean;
  misconceptionTag: MisconceptionTag;
  feedback: string;
  mode: "ai" | "offline" | "fallback";
  fallbackReason?: string;
}

export const DIAGNOSTIC_ITEMS = [
  {
    id: "D1",
    title: "Warm-Up 1: Checking Mystery Bags",
    prompt: "If one sealed mystery bag x holds 4 coins, what is the total value of 3x + 2?",
    hint: "Multiply 3 by 4 first, then add 2 loose coins.",
    options: [
      { id: "A", label: "14", isCorrect: true, misconceptionTag: "NONE" as MisconceptionTag },
      { id: "B", label: "9", isCorrect: false, misconceptionTag: "PREREQUISITE_GAP" as MisconceptionTag },
      { id: "C", label: "34 + 2 = 36", isCorrect: false, misconceptionTag: "PREREQUISITE_GAP" as MisconceptionTag },
      { id: "D", label: "18", isCorrect: false, misconceptionTag: "PREREQUISITE_GAP" as MisconceptionTag },
    ],
  },
  {
    id: "D2",
    title: "Warm-Up 2: Keeping the Scale Level",
    prompt: "Solve this one-step equation for x: x + 6 = 14",
    hint: "To undo +6 on the left pan, subtract 6 from both sides.",
    options: [
      { id: "A", label: "x = 8", isCorrect: true, misconceptionTag: "NONE" as MisconceptionTag },
      { id: "B", label: "x = 20", isCorrect: false, misconceptionTag: "M1" as MisconceptionTag },
      { id: "C", label: "7x = 14 (x = 2)", isCorrect: false, misconceptionTag: "M2" as MisconceptionTag },
      { id: "D", label: "x = 6", isCorrect: false, misconceptionTag: "PARTIAL_STEP" as MisconceptionTag },
    ],
  },
];

export const QUESTION_BANK: Record<string, QuestionItem> = {
  Q_CORE_1: {
    id: "Q_CORE_1",
    tier: "CORE",
    format: "MCQ",
    badge: "Format 1 · Quick Check",
    equation: "2x + 3 = 11",
    prompt: "Solve for x: 2x + 3 = 11",
    contextNote: "Think of 2 mystery bags and 3 loose ₹1 coins balancing 11 coins.",
    hints: [
      "Step 1: Remove 3 loose coins from both sides (11 − 3 = 8), so 2x = 8.",
      "Step 2: Share the 8 coins equally between the 2 mystery bags (8 ÷ 2).",
    ],
    expectedNumericAnswer: 4,
    requireExplanation: false,
    modelAnswer:
      "Subtract 3 from both sides to get 2x = 8, then divide both sides by 2 to get x = 4.",
    options: [
      { id: "A", label: "x = 4", value: "4", isCorrect: true, misconceptionTag: "NONE" },
      { id: "B", label: "x = 7", value: "7", isCorrect: false, misconceptionTag: "M1" },
      { id: "C", label: "5x = 11 (x = 2.2)", value: "2.2", isCorrect: false, misconceptionTag: "M2" },
      { id: "D", label: "x = 8", value: "8", isCorrect: false, misconceptionTag: "PARTIAL_STEP" },
    ],
  },

  Q_CORE_2: {
    id: "Q_CORE_2",
    tier: "CORE",
    format: "BALANCE_BUILDER",
    badge: "Format 2 · Balance-Scale Step Builder",
    equation: "3x - 4 = 11",
    prompt:
      "Solve 3x - 4 = 11 on the Balance Scale by choosing Step 1 and Step 2 inverse operations.",
    contextNote: "Watch how each operation keeps both pans level!",
    hints: [
      "Step 1: Undo −4 by adding 4 to both sides, which gives 3x = 15.",
      "Step 2: Divide both sides by 3 to find 1 mystery bag x.",
    ],
    expectedNumericAnswer: 5,
    requireExplanation: false,
    modelAnswer: "Step 1: Add 4 to both sides (3x = 15). Step 2: Divide both sides by 3 (x = 5).",
    balanceConfig: {
      leftX: 3,
      leftConst: -4,
      rightX: 0,
      rightConst: 11,
      step1Expected: "ADD_4",
      step2Expected: "DIV_3",
      step1Options: [
        { id: "ADD_4", label: "Add 4 to both sides" },
        { id: "SUB_4", label: "Subtract 4 from both sides" },
        { id: "MERGE_X", label: "Combine 3x and -4 into -1x" },
      ],
      step2Options: [
        { id: "DIV_3", label: "Divide both sides by 3" },
        { id: "MUL_3", label: "Multiply both sides by 3" },
        { id: "SUB_3", label: "Subtract 3 from both sides" },
      ],
      intermediateEquation: "3x = 15",
      finalSolution: "x = 5",
    },
  },

  Q_CORE_3: {
    id: "Q_CORE_3",
    tier: "CORE",
    format: "EXPLAIN",
    badge: "Format 3 · Spot & Explain the Mistake",
    equation: "x - 6 = 10",
    prompt:
      "Your classmate solves x - 6 = 10 and writes x = 4. Enter the correct value of x AND explain in one sentence what mistake your classmate made.",
    contextNote: "Imagine checking your friend's notebook before submitting to the teacher.",
    hints: [
      "Your classmate subtracted 6 from 10 (10 − 6 = 4) instead of undoing −6.",
      "To undo −6 on the left side, add 6 to both sides: x = 10 + 6.",
    ],
    expectedNumericAnswer: 16,
    requireExplanation: true,
    explanationPrompt: "Why did x = 4 go wrong? Explain in one clear sentence:",
    reasoningKeywords: ["add", "plus", "both sides", "undo", "opposite", "instead", "subtract"],
    reasoningHintFeedback:
      "Your number x = 16 is right! Now make sure your sentence explains the mistake—for example, that your classmate subtracted 6 instead of adding 6 to both sides.",
    modelAnswer:
      "x = 16. My classmate subtracted 6 from 10 instead of adding 6 to both sides to undo −6.",
  },

  Q_STRETCH_1: {
    id: "Q_STRETCH_1",
    tier: "STRETCH",
    format: "EXPLAIN",
    badge: "Real-World Challenge · Auto-Rickshaw Ride",
    equation: "15x + 20 = 95",
    hideEquationUpfront: true,
    prompt:
      "An auto-rickshaw ride costs ₹20 base fare plus ₹15 per km. If the total fare is ₹95, find the distance x in km and explain how you solved it.",
    contextNote: "Set up the equation from the story first! Use a hint only if you need the equation.",
    hints: [
      "Equation setup: ₹15 per km times x km plus ₹20 base fare equals ₹95 → 15x + 20 = 95.",
      "Solving step: Subtract 20 from both sides (15x = 75), then divide both sides by 15.",
    ],
    expectedNumericAnswer: 5,
    requireExplanation: true,
    explanationPrompt: "Explain your equation and steps in one or two short sentences:",
    reasoningKeywords: ["20", "15", "subtract", "minus", "divide", "both sides", "base", "fare"],
    reasoningHintFeedback:
      "Your distance x = 5 km is right! In your explanation, mention subtracting the ₹20 base fare and dividing by ₹15 per km.",
    modelAnswer:
      "x = 5 km. Subtract 20 from both sides to get 15x = 75, then divide both sides by 15 to get x = 5.",
  },

  Q_STRETCH_2: {
    id: "Q_STRETCH_2",
    tier: "STRETCH",
    format: "EXPLAIN",
    badge: "Stretch Challenge · Variables on Both Sides",
    equation: "4x + 3 = 2x + 13",
    prompt:
      "Solve 4x + 3 = 2x + 13 and explain how you collected the x-terms on one side.",
    contextNote: "Both pans have mystery x-bags! Remove 2 mystery bags from both pans first.",
    hints: [
      "Step 1: Subtract 2x from both sides so all x-bags are on the left → 2x + 3 = 13.",
      "Step 2: Subtract 3 from both sides (2x = 10), then divide both sides by 2.",
    ],
    expectedNumericAnswer: 5,
    requireExplanation: true,
    explanationPrompt: "Explain how you collected the x-terms and solved for x:",
    reasoningKeywords: ["2x", "subtract", "minus", "collect", "both sides", "divide", "remove"],
    reasoningHintFeedback:
      "Your value x = 5 is right! Now explain how you removed 2x (and 3) from both sides to isolate x.",
    modelAnswer:
      "x = 5. Subtract 2x from both sides to get 2x + 3 = 13, subtract 3 to get 2x = 10, then divide by 2.",
  },

  Q_REM_M1: {
    id: "Q_REM_M1",
    tier: "REMEDIAL_M1",
    format: "MCQ",
    badge: "Targeted Practice (M1) · Flipping Signs on Both Sides",
    equation: "3x + 2 = 14",
    prompt: "Let's practice undoing +2 on both sides! Solve for x: 3x + 2 = 14",
    contextNote:
      "Remember: to remove +2 from the left pan, subtract 2 from the right pan too (14 − 2).",
    hints: [
      "Step 1: Subtract 2 from both sides → 3x = 12.",
      "Step 2: Divide 12 by 3 to get x.",
    ],
    expectedNumericAnswer: 4,
    requireExplanation: false,
    modelAnswer: "Subtract 2 from both sides to get 3x = 12, then divide by 3 to get x = 4.",
    options: [
      { id: "A", label: "x = 4", value: "4", isCorrect: true, misconceptionTag: "NONE" },
      {
        id: "B",
        label: "x = 16 / 3 (added 2 to 14)",
        value: "5.33",
        isCorrect: false,
        misconceptionTag: "M1",
      },
      {
        id: "C",
        label: "5x = 14 (x = 2.8)",
        value: "2.8",
        isCorrect: false,
        misconceptionTag: "M2",
      },
      { id: "D", label: "x = 12", value: "12", isCorrect: false, misconceptionTag: "PARTIAL_STEP" },
    ],
  },

  Q_REM_M2: {
    id: "Q_REM_M2",
    tier: "REMEDIAL_M2",
    format: "MCQ",
    badge: "Targeted Practice (M2) · Keeping x-Bags Separate from Coins",
    equation: "4x + 5 = 21",
    prompt:
      "Keep the 4 mystery x-bags separate from the 5 loose coins! Solve: 4x + 5 = 21",
    contextNote: "Do not add 4 and 5 together. Remove the 5 loose coins from both pans first.",
    hints: [
      "Step 1: Subtract 5 from both sides → 4x = 16.",
      "Step 2: Divide 16 by 4 to get x.",
    ],
    expectedNumericAnswer: 4,
    requireExplanation: false,
    modelAnswer: "Subtract 5 from both sides to get 4x = 16, then divide by 4 to get x = 4.",
    options: [
      { id: "A", label: "x = 4", value: "4", isCorrect: true, misconceptionTag: "NONE" },
      {
        id: "B",
        label: "9x = 21 (merged 4x + 5)",
        value: "2.33",
        isCorrect: false,
        misconceptionTag: "M2",
      },
      {
        id: "C",
        label: "x = 6.5 (added 5 to 21)",
        value: "6.5",
        isCorrect: false,
        misconceptionTag: "M1",
      },
      { id: "D", label: "x = 16", value: "16", isCorrect: false, misconceptionTag: "PARTIAL_STEP" },
    ],
  },

  Q_PREREQ_1: {
    id: "Q_PREREQ_1",
    tier: "PREREQUISITE",
    format: "MCQ",
    badge: "Base Check · Mystery Bags vs. Loose Coins",
    equation: "4x + 3 vs. 7x",
    prompt:
      "Can 4x + 3 ever equal 7x for every number? Test with x = 2: 4(2) + 3 = 11, while 7(2) = 14. Choose the true rule:",
    contextNote:
      "Let's pause and build a rock-solid base before jumping back to two-step equations.",
    hints: [
      "4x means 4 mystery bags and 3 means 3 loose coins.",
      "Since bags and coins are different types (unlike terms), they cannot be merged into 7x.",
    ],
    expectedNumericAnswer: 1,
    requireExplanation: false,
    modelAnswer:
      "4x + 3 and 7x are NOT equal because 4x has x-bags and 3 is just loose coins (unlike terms).",
    options: [
      {
        id: "A",
        label: "No — 4x (bags) and 3 (loose coins) are unlike terms, so they stay 4x + 3.",
        value: "1",
        isCorrect: true,
        misconceptionTag: "NONE",
      },
      {
        id: "B",
        label: "Yes — we can always add 4 and 3 to make 7x.",
        value: "0",
        isCorrect: false,
        misconceptionTag: "M2",
      },
      {
        id: "C",
        label: "Yes — moving +3 makes it 7x.",
        value: "2",
        isCorrect: false,
        misconceptionTag: "M1",
      },
    ],
  },
};

const MASTERY_TRACK = [
  "Q_CORE_1",
  "Q_CORE_2",
  "Q_CORE_3",
  "Q_STRETCH_1",
  "Q_STRETCH_2",
];

/**
 * Explicit P4 Adaptive Decision Rule Engine:
 * 1. ADVANCE: if (isCorrect && hintCount === 0) -> next uncompleted harder/core item (or COMPLETE)
 * 2. REMEDIATE_MISCONCEPTION: else if (!isCorrect && (misconceptionTag === 'M1' || misconceptionTag === 'M2') && consecutiveErrors < 2)
 * 3. STEP_BACK_PREREQUISITE: else if (consecutiveErrors >= 2 || misconceptionTag === 'PREREQUISITE_GAP')
 */
export function decideNextStep(params: {
  currentQuestionId: string;
  isCorrect: boolean;
  misconceptionTag: MisconceptionTag;
  hintCount: number;
  consecutiveErrors: number;
  completedIds: string[];
}): { outcome: AdaptiveOutcome; ruleMatched: string; nextQuestionId: string } {
  const {
    currentQuestionId,
    isCorrect,
    misconceptionTag,
    hintCount,
    consecutiveErrors,
    completedIds,
  } = params;

  const updatedCompleted = isCorrect
    ? Array.from(new Set([...completedIds, currentQuestionId]))
    : completedIds;

  const pickNextUncompleted = (preferStretch: boolean): string => {
    const remaining = MASTERY_TRACK.filter(
      (id) => id !== currentQuestionId && !updatedCompleted.includes(id)
    );
    if (remaining.length === 0) return "COMPLETE";
    if (preferStretch) {
      const stretch = remaining.find((id) => id.startsWith("Q_STRETCH"));
      if (stretch) return stretch;
    }
    return remaining[0];
  };

  if (isCorrect && hintCount === 0) {
    // Advance without ever repeating already-completed questions
    const nextQuestionId =
      currentQuestionId === "Q_CORE_1"
        ? pickNextUncompleted(false) // moves to Q_CORE_2 (Balance Builder) so all 3 formats are seen
        : pickNextUncompleted(true);

    return {
      outcome: "ADVANCE",
      ruleMatched: "isCorrect === true && hintCount === 0",
      nextQuestionId,
    };
  }

  if (consecutiveErrors >= 2 || misconceptionTag === "PREREQUISITE_GAP") {
    return {
      outcome: "STEP_BACK_PREREQUISITE",
      ruleMatched:
        consecutiveErrors >= 2
          ? `consecutiveErrors (${consecutiveErrors}) >= 2`
          : "misconceptionTag === 'PREREQUISITE_GAP'",
      nextQuestionId: "Q_PREREQ_1",
    };
  }

  if (!isCorrect && (misconceptionTag === "M1" || misconceptionTag === "M2")) {
    return {
      outcome: "REMEDIATE_MISCONCEPTION",
      ruleMatched: `!isCorrect && misconceptionTag === '${misconceptionTag}' && consecutiveErrors < 2`,
      nextQuestionId: misconceptionTag === "M1" ? "Q_REM_M1" : "Q_REM_M2",
    };
  }

  // Correct with hint used -> continue to next uncompleted item
  if (isCorrect) {
    return {
      outcome: "ADVANCE",
      ruleMatched: "isCorrect === true (with hint) -> next uncompleted item",
      nextQuestionId: pickNextUncompleted(false),
    };
  }

  // Partial step error on first miss -> remediate gently
  return {
    outcome: "REMEDIATE_MISCONCEPTION",
    ruleMatched: `!isCorrect && misconceptionTag === '${misconceptionTag}' && consecutiveErrors < 2`,
    nextQuestionId: "Q_REM_M1",
  };
}

/**
 * Deterministic Offline / Low-Bandwidth Evaluator (C1)
 * Runs with zero external dependencies when offline, unconfigured, or timed out.
 */
export function evaluateOffline(params: {
  questionId: string;
  learnerAnswer: string;
  explanationText?: string;
  selectedOptionId?: string;
  step1Choice?: string;
  step2Choice?: string;
}): EvaluationResult {
  const q = QUESTION_BANK[params.questionId];
  if (!q) {
    return {
      isCorrect: false,
      misconceptionTag: "NONE",
      feedback: "Let's check that question again.",
      mode: "offline",
    };
  }

  // Format 1: MCQ
  if (q.format === "MCQ" && q.options) {
    const chosen = q.options.find(
      (o) => o.id === params.selectedOptionId || o.value === params.learnerAnswer
    );
    if (!chosen) {
      return {
        isCorrect: false,
        misconceptionTag: "NONE",
        feedback: "Please select one of the options before checking your answer.",
        mode: "offline",
      };
    }
    if (chosen.isCorrect) {
      return {
        isCorrect: true,
        misconceptionTag: "NONE",
        feedback:
          q.id === "Q_CORE_1"
            ? "Spot on! You subtracted 3 from both sides first to get 2x = 8, and then divided by 2 to get x = 4. Both pans stayed level!"
            : q.id === "Q_PREREQ_1"
              ? "Yes! 4x (mystery bags) and 3 (loose coins) are unlike terms—we never merge them into 7x. You're ready to jump back into solving equations!"
              : `Great work! ${q.modelAnswer}`,
        mode: "offline",
      };
    }

    if (chosen.misconceptionTag === "M1") {
      return {
        isCorrect: false,
        misconceptionTag: "M1",
        feedback:
          "Careful—when you moved the number across the equals sign, you added instead of subtracting! Remember: to keep our balance scale level, we must undo +3 by subtracting 3 from both sides. Try this parallel check next.",
        mode: "offline",
      };
    }
    if (chosen.misconceptionTag === "M2") {
      return {
        isCorrect: false,
        misconceptionTag: "M2",
        feedback:
          "Hold on! 2x means 2 mystery bags and 3 means 3 loose rupee coins—we cannot merge bags and coins into 5x! Keep 2x on the left pan and remove 3 coins from both pans first.",
        mode: "offline",
      };
    }
    return {
      isCorrect: false,
      misconceptionTag: chosen.misconceptionTag,
      feedback:
        "You are very close! You handled the constant term, so now remember to divide both sides by the number in front of x.",
      mode: "offline",
    };
  }

  // Format 2: Balance Builder
  if (q.format === "BALANCE_BUILDER" && q.balanceConfig) {
    const { step1Expected, step2Expected } = q.balanceConfig;
    const s1 = params.step1Choice || "";
    const s2 = params.step2Choice || "";

    if (s1 === "MERGE_X") {
      return {
        isCorrect: false,
        misconceptionTag: "M2",
        feedback:
          "Hold on! 3x (3 mystery bags) and -4 (4 owed coins) are unlike terms—we cannot combine them into -1x. First undo -4 by adding 4 to both sides.",
        mode: "offline",
      };
    }
    if (s1 === "SUB_4") {
      return {
        isCorrect: false,
        misconceptionTag: "M1",
        feedback:
          "Watch the sign! The equation already has -4 on the left pan. Subtracting 4 again gives -8 instead of cancelling -4. To undo -4, we must ADD 4 to both sides.",
        mode: "offline",
      };
    }
    if (s1 === step1Expected && s2 === step2Expected) {
      return {
        isCorrect: true,
        misconceptionTag: "NONE",
        feedback:
          "Awesome balancing! Step 1 added 4 to both sides (3x = 15) and Step 2 divided both sides by 3 (x = 5). Both pans stayed completely level!",
        mode: "offline",
      };
    }
    return {
      isCorrect: false,
      misconceptionTag: "PARTIAL_STEP",
      feedback:
        "Your Step 1 was right (3x = 15), but check Step 2: since 3 is multiplied by x, undo it by dividing both sides by 3.",
      mode: "offline",
    };
  }

  // Format 3 & Stretch: Numeric + Open-Ended Explanation
  const numericVal = parseFloat(params.learnerAnswer.replace(/[^0-9.-]/g, ""));
  const exp = (params.explanationText || "").toLowerCase();
  const isNumCorrect =
    !Number.isNaN(numericVal) && Math.abs(numericVal - q.expectedNumericAnswer) < 0.01;

  // Detect M1 or M2 clues in explanation or wrong numeric answer
  const hasM1Clue =
    numericVal === 4 && q.id === "Q_CORE_3"
      ? true
      : exp.includes("subtract") && q.id === "Q_CORE_3" && !exp.includes("instead") && !exp.includes("add")
        ? true
        : numericVal === 7.67 || (exp.includes("added 20") && q.id === "Q_STRETCH_1");

  const hasM2Clue =
    exp.includes("35x") ||
    exp.includes("5x") ||
    exp.includes("7x") ||
    exp.includes("combine") ||
    exp.includes("merged");

  if (isNumCorrect) {
    if (q.requireExplanation) {
      const hasMinLength = exp.trim().length >= 10;
      const keywords = q.reasoningKeywords || [];
      const matchesReasoning =
        keywords.length === 0 || keywords.some((kw) => exp.includes(kw));

      if (!hasMinLength || !matchesReasoning) {
        return {
          isCorrect: false,
          misconceptionTag: "PARTIAL_STEP",
          feedback:
            q.reasoningHintFeedback ||
            `Your number x = ${q.expectedNumericAnswer} is right! Now write one short sentence explaining how you balanced both sides.`,
          mode: "offline",
        };
      }
    }
    return {
      isCorrect: true,
      misconceptionTag: "NONE",
      feedback: `Well reasoned! ${q.modelAnswer}`,
      mode: "offline",
    };
  }

  if (hasM2Clue) {
    return {
      isCorrect: false,
      misconceptionTag: "M2",
      feedback:
        "Careful—never merge x-bags with loose rupee coins! Keep the x-terms separate from plain numbers, and undo the constant on both sides first.",
      mode: "offline",
    };
  }

  if (hasM1Clue) {
    return {
      isCorrect: false,
      misconceptionTag: "M1",
      feedback:
        "Watch the inverse sign! When undoing -6 (or +20), we must apply the opposite operation to both sides. Try checking the sign again.",
      mode: "offline",
    };
  }

  return {
    isCorrect: false,
    misconceptionTag: "M1",
    feedback: `Not quite yet—let's check the balancing step. Hint: ${q.hints[0]}`,
    mode: "offline",
  };
}
