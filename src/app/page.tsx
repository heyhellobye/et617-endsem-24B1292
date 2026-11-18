"use client";

import React, { useState } from "react";
import BalanceScale from "@/components/BalanceScale";
import AboutModal from "@/components/AboutModal";
import {
  AdaptiveOutcome,
  DIAGNOSTIC_ITEMS,
  DecisionTraceEntry,
  MisconceptionTag,
  QUESTION_BANK,
  ScreenId,
  decideNextStep,
} from "@/lib/adaptiveEngine";

const SCREEN_STEPS: { id: ScreenId; label: string }[] = [
  { id: "welcome", label: "1. Welcome" },
  { id: "diagnostic", label: "2. Warm-Up" },
  { id: "primer", label: "3. Scale Lab" },
  { id: "practice", label: "4. Practice" },
  { id: "report", label: "5. Summary" },
];

export default function HomePage() {
  const [screen, setScreen] = useState<ScreenId>("welcome");
  const [showAbout, setShowAbout] = useState<boolean>(false);

  // Screen 2: Self-Evaluation Guide + Diagnostic state
  const [diagReady, setDiagReady] = useState<boolean>(false);
  const [diagIndex, setDiagIndex] = useState<number>(0);
  const [diagAnswers, setDiagAnswers] = useState<
    Record<string, { optionId: string; isCorrect: boolean; tag: MisconceptionTag }>
  >({});
  const [diagFeedback, setDiagFeedback] = useState<{
    optionId: string;
    isCorrect: boolean;
    tag: MisconceptionTag;
    message: string;
  } | null>(null);
  const [startingLevel, setStartingLevel] = useState<"Foundational" | "Standard">("Standard");

  // Screen 3: Interactive Balance Scale Primer state (2x + 3 = 11)
  const [primerStep, setPrimerStep] = useState<0 | 1 | 2>(0);
  const [primerTilt, setPrimerTilt] = useState<number>(0);
  const [primerMessage, setPrimerMessage] = useState<string>(
    "Let's keep the kirana weighing scale level! Start by removing the 3 loose coins from both sides."
  );

  // Screen 4: Adaptive Practice & Reasoning Studio state
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("Q_CORE_1");
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [numericInput, setNumericInput] = useState<string>("");
  const [explanationInput, setExplanationInput] = useState<string>("");
  const [step1Choice, setStep1Choice] = useState<string>("");
  const [step2Choice, setStep2Choice] = useState<string>("");
  const [hintCount, setHintCount] = useState<number>(0);
  const [inputError, setInputError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Adaptive tracking signals
  const [streak, setStreak] = useState<number>(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [detectedMisconceptions, setDetectedMisconceptions] = useState<MisconceptionTag[]>([]);
  const [resolvedMisconceptions, setResolvedMisconceptions] = useState<MisconceptionTag[]>([]);
  const [traceLog, setTraceLog] = useState<DecisionTraceEntry[]>([]);
  const [toolsOpen, setToolsOpen] = useState<boolean>(false);

  // Last evaluation banner in Screen 4
  const [lastFeedback, setLastFeedback] = useState<{
    isCorrect: boolean;
    misconceptionTag: MisconceptionTag;
    feedback: string;
    outcome: AdaptiveOutcome;
    nextQuestionId: string;
  } | null>(null);

  const currentQuestion = QUESTION_BANK[currentQuestionId] ?? QUESTION_BANK.Q_CORE_1;

  // --- Screen 2 Handlers ---
  const handleDiagSelect = (optionId: string, isCorrect: boolean, tag: MisconceptionTag) => {
    const item = DIAGNOSTIC_ITEMS[diagIndex];
    const updated = {
      ...diagAnswers,
      [item.id]: { optionId, isCorrect, tag },
    };
    setDiagAnswers(updated);

    let message = "";
    if (isCorrect) {
      message =
        item.id === "D1"
          ? "Spot on! 3(4) + 2 = 12 + 2 = 14. You know how to evaluate mystery x-bags!"
          : "Nice! Subtracting 6 from both sides gives x = 14 − 6 = 8.";
    } else if (tag === "M1") {
      message =
        "Watch the sign! You added 6 to 14 (14 + 6 = 20) instead of subtracting 6 from both sides (14 − 6 = 8). We'll practice this on the Balance Scale next!";
    } else if (tag === "M2") {
      message =
        "Careful! You merged x and 6 into 7x. Remember: x is a mystery bag and 6 is loose coins—keep them separate and subtract 6 from both sides (x = 8).";
    } else if (item.id === "D1") {
      message =
        "Not quite—3x means 3 times x. First multiply 3 × 4 = 12, then add 2 loose coins to get 14.";
    } else {
      message =
        "Almost! To undo +6 on the left side, subtract 6 from 14 to get x = 8.";
    }

    setDiagFeedback({ optionId, isCorrect, tag, message });
  };

  const handleDiagContinue = () => {
    if (!diagFeedback) return;
    if (diagIndex < DIAGNOSTIC_ITEMS.length - 1) {
      setDiagIndex(diagIndex + 1);
      setDiagFeedback(null);
    } else {
      const anyWrong = Object.values(diagAnswers).some((a) => !a.isCorrect);
      const tags = Object.values(diagAnswers)
        .map((a) => a.tag)
        .filter((t): t is MisconceptionTag => t === "M1" || t === "M2");
      setStartingLevel(anyWrong ? "Foundational" : "Standard");
      if (tags.length > 0) {
        setDetectedMisconceptions((prev) => Array.from(new Set([...prev, ...tags])));
      }
      setDiagFeedback(null);
      setScreen("primer");
    }
  };

  // --- Screen 3 Interactive Balance Scale Handlers ---
  const handlePrimerAction = (action: "SUB_3" | "ADD_3" | "DIV_2") => {
    if (primerStep === 0) {
      if (action === "SUB_3") {
        setPrimerStep(1);
        setPrimerTilt(0);
        setPrimerMessage(
          "Nice! We subtracted 3 coins from both pans, so 2x = 8 stays perfectly level. Now share the 8 coins equally between the 2 mystery bags!"
        );
      } else if (action === "ADD_3") {
        setPrimerTilt(-6);
        setPrimerMessage(
          "Careful! Adding 3 only makes 2x + 6 = 14—it doesn't remove +3. Try clicking 'Subtract 3 from both sides' to undo +3."
        );
      } else {
        setPrimerTilt(6);
        setPrimerMessage(
          "Wait! Remove the 3 loose coins first before dividing by 2 so both pans stay neat and whole."
        );
      }
    } else if (primerStep === 1) {
      if (action === "DIV_2") {
        setPrimerStep(2);
        setPrimerTilt(0);
        setPrimerMessage(
          "Spot on! Dividing both pans by 2 leaves 1 mystery bag balancing 4 coins: x = 4. You're ready for Practice!"
        );
      } else {
        setPrimerTilt(-5);
        setPrimerMessage(
          "We already have 2x = 8. Now undo 'times 2' by clicking 'Divide both sides by 2'."
        );
      }
    }
  };

  // --- Screen 4 Practice Submission ---
  const resetQuestionInputs = () => {
    setSelectedOptionId("");
    setNumericInput("");
    setExplanationInput("");
    setStep1Choice("");
    setStep2Choice("");
    setHintCount(0);
    setInputError("");
  };

  const submitPracticeAnswer = async (override?: {
    selectedOptionId?: string;
    numericInput?: string;
    explanationInput?: string;
    step1Choice?: string;
    step2Choice?: string;
    questionIdOverride?: string;
  }) => {
    const targetQId = override?.questionIdOverride ?? currentQuestion.id;
    const targetQ = QUESTION_BANK[targetQId] ?? currentQuestion;

    const optId = override?.selectedOptionId ?? selectedOptionId;
    const numVal = override?.numericInput ?? numericInput;
    const expVal = override?.explanationInput ?? explanationInput;
    const s1 = override?.step1Choice ?? step1Choice;
    const s2 = override?.step2Choice ?? step2Choice;

    let learnerAnswer = numVal;
    if (targetQ.format === "MCQ" && targetQ.options) {
      const opt = targetQ.options.find((o) => o.id === optId);
      learnerAnswer = opt ? opt.label : "";
    } else if (targetQ.format === "BALANCE_BUILDER") {
      learnerAnswer = `Step1:${s1}, Step2:${s2}`;
    }

    if (!learnerAnswer.trim()) {
      setInputError("Please choose or enter an answer first.");
      return;
    }
    if (targetQ.requireExplanation && !override && !expVal.trim()) {
      setInputError("Please write one short sentence explaining your steps so we can check your reasoning.");
      return;
    }
    setInputError("");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: targetQ.id,
          questionPrompt: targetQ.prompt,
          learnerAnswer,
          explanationText: expVal,
          selectedOptionId: optId,
          step1Choice: s1,
          step2Choice: s2,
        }),
      });
      const data = await res.json();

      const isCorrect = Boolean(data.isCorrect);
      const tag = (data.misconceptionTag || "NONE") as MisconceptionTag;

      const newStreak = isCorrect ? streak + 1 : 0;
      const newConsecErrors = isCorrect ? 0 : consecutiveErrors + 1;
      const newCompleted = isCorrect
        ? Array.from(new Set([...completedIds, targetQ.id]))
        : completedIds;

      if (!isCorrect && (tag === "M1" || tag === "M2")) {
        setDetectedMisconceptions((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
      }
      if (isCorrect) {
        if (targetQ.id === "Q_REM_M1") {
          setResolvedMisconceptions((prev) => (prev.includes("M1") ? prev : [...prev, "M1"]));
        }
        if (targetQ.id === "Q_REM_M2" || targetQ.id === "Q_PREREQ_1") {
          setResolvedMisconceptions((prev) => (prev.includes("M2") ? prev : [...prev, "M2"]));
        }
      }

      const decision = decideNextStep({
        currentQuestionId: targetQ.id,
        isCorrect,
        misconceptionTag: tag,
        hintCount,
        consecutiveErrors: newConsecErrors,
        completedIds: newCompleted,
      });

      const entry: DecisionTraceEntry = {
        stepNumber: traceLog.length + 1,
        questionId: targetQ.id,
        equation: targetQ.equation,
        learnerAnswer,
        isCorrect,
        misconceptionTag: tag,
        streak: newStreak,
        hintCount,
        consecutiveErrors: newConsecErrors,
        outcome: decision.outcome,
        ruleMatched: decision.ruleMatched,
        nextQuestionId: decision.nextQuestionId,
        mode: data.mode || "offline",
      };

      setStreak(newStreak);
      setConsecutiveErrors(newConsecErrors);
      setCompletedIds(newCompleted);
      setTraceLog((prev) => [...prev, entry]);
      setLastFeedback({
        isCorrect,
        misconceptionTag: tag,
        feedback: data.feedback,
        outcome: decision.outcome,
        nextQuestionId: decision.nextQuestionId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceToNextQuestion = () => {
    if (!lastFeedback) return;
    if (lastFeedback.nextQuestionId === "COMPLETE") {
      setLastFeedback(null);
      resetQuestionInputs();
      setScreen("report");
      return;
    }
    setCurrentQuestionId(lastFeedback.nextQuestionId);
    setLastFeedback(null);
    resetQuestionInputs();
  };

  // --- Evaluator Demo Quick-Fill Helpers ---
  const runDemoQuickFill = (scenario: "A_CORRECT" | "B_M1" | "B_M2") => {
    if (scenario === "A_CORRECT") {
      setCurrentQuestionId("Q_CORE_1");
      setLastFeedback(null);
      setSelectedOptionId("A");
      setHintCount(0);
      submitPracticeAnswer({ questionIdOverride: "Q_CORE_1", selectedOptionId: "A" });
    } else if (scenario === "B_M1") {
      setCurrentQuestionId("Q_CORE_1");
      setLastFeedback(null);
      setSelectedOptionId("B");
      setHintCount(0);
      submitPracticeAnswer({ questionIdOverride: "Q_CORE_1", selectedOptionId: "B" });
    } else {
      setCurrentQuestionId("Q_REM_M1");
      setLastFeedback(null);
      setSelectedOptionId("C");
      setHintCount(0);
      submitPracticeAnswer({ questionIdOverride: "Q_REM_M1", selectedOptionId: "C" });
    }
  };

  const restartSession = () => {
    setScreen("welcome");
    setDiagReady(false);
    setDiagIndex(0);
    setDiagAnswers({});
    setDiagFeedback(null);
    setStartingLevel("Standard");
    setPrimerStep(0);
    setPrimerTilt(0);
    setCurrentQuestionId("Q_CORE_1");
    setStreak(0);
    setConsecutiveErrors(0);
    setCompletedIds([]);
    setDetectedMisconceptions([]);
    setResolvedMisconceptions([]);
    setTraceLog([]);
    setLastFeedback(null);
    resetQuestionInputs();
  };

  // Helper for Screen 4 Balance Builder live preview
  const getBuilderScaleValues = () => {
    if (step1Choice === "ADD_4" && step2Choice === "DIV_3") {
      return { leftX: 1, leftConst: 0, rightX: 0, rightConst: 5, tilt: 0 };
    }
    if (step1Choice === "ADD_4") {
      return { leftX: 3, leftConst: 0, rightX: 0, rightConst: 15, tilt: 0 };
    }
    if (step1Choice === "SUB_4") {
      return { leftX: 3, leftConst: -8, rightX: 0, rightConst: 7, tilt: -5 };
    }
    if (step1Choice === "MERGE_X") {
      return { leftX: -1, leftConst: 0, rightX: 0, rightConst: 11, tilt: 6 };
    }
    return { leftX: 3, leftConst: -4, rightX: 0, rightConst: 11, tilt: 0 };
  };

  const totalAttempts = traceLog.length;
  const correctAttempts = traceLog.filter((t) => t.isCorrect).length;
  const accuracyPct =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Clean, Accessible Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm"
              aria-hidden="true"
            >
              =
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                BalanceMath Tutor
              </h1>
              <p className="text-xs text-slate-500">
                Class 8 Linear Equations · Easy &amp; Step-by-Step
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAbout(true)}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-800 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            About (24B1292)
          </button>
        </div>

        {/* 5-Screen Progress Bar */}
        <nav
          aria-label="Lesson steps"
          className="mx-auto max-w-4xl px-4 pb-2.5 flex items-center gap-2 overflow-x-auto"
        >
          {SCREEN_STEPS.map((s) => {
            const active = screen === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScreen(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        {/* SCREEN 1: WELCOME */}
        {screen === "welcome" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-3">
              <span className="inline-block rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800">
                Class 8 Algebra · 25-Minute Guided Session
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                Hi Aarav! Let&apos;s Solve Equations Without Guesswork.
              </h2>
              <p className="text-base text-slate-700 leading-relaxed">
                Think of every equation like a{" "}
                <strong className="text-indigo-700">kirana weighing scale</strong>. Whatever you
                do to one side, just do the{" "}
                <strong className="text-emerald-700">exact same thing to the other side</strong>,
                and the scale stays level!
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3.5">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-indigo-700">1. Quick Check</p>
                <p className="text-sm font-bold text-slate-900 mt-1">2 Warm-Up Questions</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  No pressure—just helps us pick the right starting level for you.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-indigo-700">2. Scale Lab</p>
                <p className="text-sm font-bold text-slate-900 mt-1">See Bags &amp; Coins</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Play with an interactive balance scale before solving on your own.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-indigo-700">3. Practice</p>
                <p className="text-sm font-bold text-slate-900 mt-1">Check Your Thinking</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Get instant hints and everyday auto-fare problems at your own pace.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDiagReady(false);
                  setScreen("diagnostic");
                }}
                className="rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Let&apos;s Begin &rarr;
              </button>
              <button
                type="button"
                onClick={() => setScreen("primer")}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Explore Balance Scale First
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 2: SELF-EVALUATION GUIDE WINDOW -> DIAGNOSTIC WARM-UP */}
        {screen === "diagnostic" && !diagReady && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                Before We Start · How to Check Yourself
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                This is Your Space to Practice—Not a Test!
              </h2>
              <p className="text-base text-slate-700 leading-relaxed">
                Here is how you can use this tutor to check your own understanding:
              </p>
            </div>

            <ol className="space-y-3 text-sm sm:text-base text-slate-800">
              <li className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  1
                </span>
                <div>
                  <strong>Try your best first:</strong> Pick an answer or type what you think. If
                  you make a slip, the tutor will show you <em>why</em> without judging.
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  2
                </span>
                <div>
                  <strong>Use the Hint &amp; Balance Scale anytime:</strong> If you feel stuck, tap{" "}
                  <strong>Show Hint</strong> to get a gentle clue on what to do next.
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  3
                </span>
                <div>
                  <strong>Explain in one short sentence:</strong> When asked &ldquo;why&rdquo;,
                  write how you balanced both sides in your own simple words—that&apos;s the best
                  way to check yourself!
                </div>
              </li>
            </ol>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setScreen("welcome")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={() => setDiagReady(true)}
                className="rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Start 2-Question Warm-Up &rarr;
              </button>
            </div>
          </section>
        )}

        {screen === "diagnostic" && diagReady && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                Warm-Up · Question {diagIndex + 1} of {DIAGNOSTIC_ITEMS.length}
              </span>
              <span className="text-xs text-slate-500">Helps us pick your starting level</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {DIAGNOSTIC_ITEMS[diagIndex].title}
            </h2>
            <p className="text-base sm:text-lg text-slate-800 font-medium">
              {DIAGNOSTIC_ITEMS[diagIndex].prompt}
            </p>
            <p className="text-sm text-slate-700 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
              <strong>Friendly Tip:</strong> {DIAGNOSTIC_ITEMS[diagIndex].hint}
            </p>

            <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
              {DIAGNOSTIC_ITEMS[diagIndex].options.map((opt) => {
                const isSelected = diagFeedback?.optionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={Boolean(diagFeedback)}
                    onClick={() => handleDiagSelect(opt.id, opt.isCorrect, opt.misconceptionTag)}
                    className={`text-left rounded-xl border-2 p-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isSelected
                        ? opt.isCorrect
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-amber-500 bg-amber-50"
                        : "border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/40"
                    }`}
                  >
                    <span className="inline-block font-bold text-indigo-700 mr-2">{opt.id})</span>
                    <span className="font-semibold text-slate-900">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {diagFeedback && (
              <div
                className={`rounded-xl border p-4 space-y-3 ${
                  diagFeedback.isCorrect
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-amber-50 border-amber-300 text-amber-950"
                }`}
              >
                <p className="text-sm sm:text-base font-bold">
                  {diagFeedback.isCorrect ? "Nice work!" : "Not quite — here's why:"}
                </p>
                <p className="text-sm sm:text-base">{diagFeedback.message}</p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDiagContinue}
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    {diagIndex < DIAGNOSTIC_ITEMS.length - 1
                      ? "Next Warm-Up Question →"
                      : "Continue to Scale Lab →"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* SCREEN 3: CONVERSATIONAL CONCEPT PRIMER & INTERACTIVE BALANCE SCALE */}
        {screen === "primer" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                Scale Lab · See How Balancing Works
              </span>
              <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800">
                Your Path: {startingLevel}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Notice how we keep the weighing scale level!
              </h2>
              <p className="text-base text-slate-700 leading-relaxed">
                Think of <strong className="text-indigo-700">x</strong> as a{" "}
                <strong>sealed mystery bag</strong> and plain numbers as{" "}
                <strong className="text-amber-700">loose ₹1 coins</strong>. Never merge bags and
                coins together! Instead, apply the{" "}
                <strong className="text-emerald-700">same opposite operation to both pans</strong>.
              </p>
            </div>

            <BalanceScale
              leftX={primerStep === 2 ? 1 : 2}
              leftConst={primerStep === 0 ? 3 : 0}
              rightX={0}
              rightConst={primerStep === 0 ? 11 : primerStep === 1 ? 8 : 4}
              tiltDegrees={primerTilt}
              caption={
                primerStep === 0
                  ? "Current equation: 2x + 3 = 11"
                  : primerStep === 1
                    ? "After subtracting 3 from both sides: 2x = 8"
                    : "After dividing both sides by 2: x = 4"
              }
            />

            <div
              className={`rounded-xl border p-4 text-sm sm:text-base font-medium ${
                primerTilt !== 0
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : primerStep === 2
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-indigo-50 border-indigo-200 text-indigo-900"
              }`}
            >
              {primerMessage}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={primerStep !== 0}
                onClick={() => handlePrimerAction("SUB_3")}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                Subtract 3 from both sides
              </button>
              <button
                type="button"
                disabled={primerStep !== 0}
                onClick={() => handlePrimerAction("ADD_3")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Add 3 to both sides
              </button>
              <button
                type="button"
                disabled={primerStep === 2}
                onClick={() => handlePrimerAction("DIV_2")}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                Divide both sides by 2
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setScreen("practice")}
                className="rounded-xl bg-slate-900 px-6 py-3.5 text-base font-bold text-white hover:bg-slate-800"
              >
                Start Practice &rarr;
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 4: ADAPTIVE PRACTICE & REASONING STUDIO */}
        {screen === "practice" && (
          <div className="space-y-5">
            {/* Active Question Card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                  {currentQuestion.badge}
                </span>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-600">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1">
                    In a row: {streak}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1">
                    Hints used: {hintCount}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {!currentQuestion.hideEquationUpfront ? (
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 inline-block">
                    {currentQuestion.equation}
                  </div>
                ) : (
                  <div className="inline-block rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-bold text-amber-900">
                    Word Problem · Try setting up the equation yourself (or use Hint 1!)
                  </div>
                )}
                <p className="text-base sm:text-lg font-semibold text-slate-900 pt-1">
                  {currentQuestion.prompt}
                </p>
                {currentQuestion.contextNote && (
                  <p className="text-sm text-slate-600">{currentQuestion.contextNote}</p>
                )}
              </div>

              {/* Format 1: Diagnostic Multiple Choice */}
              {currentQuestion.format === "MCQ" && currentQuestion.options && (
                <div className="grid sm:grid-cols-2 gap-3.5">
                  {currentQuestion.options.map((opt) => {
                    const selected = selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={Boolean(lastFeedback)}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`text-left rounded-xl border-2 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          selected
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className="font-bold text-indigo-700 mr-2">{opt.id})</span>
                        <span className="font-semibold text-slate-900 text-base">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Format 2: Interactive Balance-Scale Step Builder */}
              {currentQuestion.format === "BALANCE_BUILDER" &&
                currentQuestion.balanceConfig && (
                  <div className="space-y-4">
                    <BalanceScale
                      leftX={getBuilderScaleValues().leftX}
                      leftConst={getBuilderScaleValues().leftConst}
                      rightX={getBuilderScaleValues().rightX}
                      rightConst={getBuilderScaleValues().rightConst}
                      tiltDegrees={getBuilderScaleValues().tilt}
                      caption={
                        step1Choice === "ADD_4" && step2Choice === "DIV_3"
                          ? "Solved! x = 5"
                          : step1Choice === "ADD_4"
                            ? "Step 1 complete: 3x = 15. Now pick Step 2!"
                            : "Select Step 1 and Step 2 to balance 3x - 4 = 11"
                      }
                    />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="step1-select"
                          className="block text-sm font-bold text-slate-700 mb-1.5"
                        >
                          Step 1: Undo −4
                        </label>
                        <select
                          id="step1-select"
                          value={step1Choice}
                          disabled={Boolean(lastFeedback)}
                          onChange={(e) => setStep1Choice(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base font-medium text-slate-900"
                        >
                          <option value="">-- Choose Step 1 --</option>
                          {currentQuestion.balanceConfig.step1Options.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="step2-select"
                          className="block text-sm font-bold text-slate-700 mb-1.5"
                        >
                          Step 2: Isolate x
                        </label>
                        <select
                          id="step2-select"
                          value={step2Choice}
                          disabled={Boolean(lastFeedback)}
                          onChange={(e) => setStep2Choice(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base font-medium text-slate-900"
                        >
                          <option value="">-- Choose Step 2 --</option>
                          {currentQuestion.balanceConfig.step2Options.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

              {/* Format 3: Open-Ended Reasoning / Stretch */}
              {currentQuestion.format === "EXPLAIN" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="numeric-answer"
                      className="block text-sm font-bold text-slate-700 mb-1.5"
                    >
                      Value of x (number only):
                    </label>
                    <input
                      id="numeric-answer"
                      type="text"
                      value={numericInput}
                      disabled={Boolean(lastFeedback)}
                      onChange={(e) => setNumericInput(e.target.value)}
                      placeholder="e.g., 16 or 5"
                      className="w-full sm:w-56 rounded-xl border border-slate-300 px-4 py-3 text-base font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="explanation-answer"
                      className="block text-sm font-bold text-slate-700 mb-1.5"
                    >
                      {currentQuestion.explanationPrompt || "Explain your steps:"}
                    </label>
                    <textarea
                      id="explanation-answer"
                      rows={3}
                      value={explanationInput}
                      disabled={Boolean(lastFeedback)}
                      onChange={(e) => setExplanationInput(e.target.value)}
                      placeholder="Write one or two short sentences in your own words..."
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Progressive Hints Box */}
              {hintCount > 0 && (
                <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 space-y-1.5 text-sm text-sky-950">
                  {currentQuestion.hints.slice(0, hintCount).map((h, idx) => (
                    <p key={idx}>
                      <strong>Hint {idx + 1}:</strong> {h}
                    </p>
                  ))}
                </div>
              )}

              {inputError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-800">
                  {inputError}
                </div>
              )}

              {/* Action Buttons */}
              {!lastFeedback && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={hintCount >= currentQuestion.hints.length}
                    onClick={() => {
                      if (hintCount < currentQuestion.hints.length) {
                        setHintCount((c) => c + 1);
                      }
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {hintCount >= currentQuestion.hints.length
                      ? `All Hints Shown (${hintCount}/${currentQuestion.hints.length})`
                      : `Show Hint (${hintCount + 1}/${currentQuestion.hints.length})`}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => submitPracticeAnswer()}
                    className="rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Checking..." : "Check My Answer"}
                  </button>
                </div>
              )}

              {/* Warm, Encouraging Feedback Banner */}
              {lastFeedback && (
                <div
                  className={`rounded-xl border p-5 space-y-4 ${
                    lastFeedback.isCorrect
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-base font-bold">
                      {lastFeedback.isCorrect
                        ? "Great job! That's right."
                        : "Good try — let's check this step together:"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold border border-slate-200 text-slate-700">
                      {lastFeedback.outcome === "ADVANCE"
                        ? "Next: Level Up"
                        : lastFeedback.outcome === "REMEDIATE_MISCONCEPTION"
                          ? "Next: Targeted Practice"
                          : "Next: Quick Base Check"}
                    </span>
                  </div>
                  <p className="text-base leading-relaxed">{lastFeedback.feedback}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleAdvanceToNextQuestion}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      {lastFeedback.nextQuestionId === "COMPLETE"
                        ? "All Done! View Your Summary →"
                        : "Continue to Next Question →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScreen("report")}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Finish &amp; See Summary
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Discreet Collapsible Teacher / Evaluator Tools (Demo Quick-Fill + Decision Trace) */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={() => setToolsOpen((o) => !o)}
                className="w-full flex items-center justify-between text-left py-1"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Teacher &amp; Evaluator Tools (Decision Rule Trace &amp; Demo Scenarios ·{" "}
                  {traceLog.length} logged)
                </span>
                <span className="text-xs font-semibold text-indigo-700">
                  {toolsOpen ? "Hide" : "Expand"}
                </span>
              </button>

              {toolsOpen && (
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-50/70 border border-indigo-200 p-3">
                    <span className="text-xs font-bold text-indigo-950">
                      Quick-Fill Demo Scenarios:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => runDemoQuickFill("A_CORRECT")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Scenario A: Correct (ADVANCE)
                      </button>
                      <button
                        type="button"
                        onClick={() => runDemoQuickFill("B_M1")}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Scenario B1: M1 Error (REMEDIATE)
                      </button>
                      <button
                        type="button"
                        onClick={() => runDemoQuickFill("B_M2")}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Scenario B2: 2nd Error (PREREQUISITE)
                      </button>
                    </div>
                  </div>

                  {traceLog.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Submit an answer or click a demo scenario above to inspect live adaptive
                      decision-rule routing.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-1.5 pr-3">#</th>
                            <th className="py-1.5 pr-3">Item</th>
                            <th className="py-1.5 pr-3">Answer</th>
                            <th className="py-1.5 pr-3">Tag</th>
                            <th className="py-1.5 pr-3">Signals (streak/hint/err)</th>
                            <th className="py-1.5 pr-3">Outcome</th>
                            <th className="py-1.5">Next</th>
                          </tr>
                        </thead>
                        <tbody>
                          {traceLog.map((t) => (
                            <tr key={t.stepNumber} className="border-b border-slate-100">
                              <td className="py-1.5 pr-3 font-semibold">{t.stepNumber}</td>
                              <td className="py-1.5 pr-3 font-mono">{t.equation}</td>
                              <td className="py-1.5 pr-3">{t.learnerAnswer}</td>
                              <td className="py-1.5 pr-3 font-semibold">{t.misconceptionTag}</td>
                              <td className="py-1.5 pr-3 font-mono">
                                {t.streak}/{t.hintCount}/{t.consecutiveErrors}
                              </td>
                              <td className="py-1.5 pr-3 font-bold text-indigo-700">{t.outcome}</td>
                              <td className="py-1.5 font-mono">{t.nextQuestionId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* SCREEN 5: SESSION MASTERY REPORT */}
        {screen === "report" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Great Effort Today, Aarav!
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Topic: Linear Equations in One Variable · Starting Level: {startingLevel}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3.5 py-1.5 text-sm font-bold text-emerald-800">
                Accuracy: {accuracyPct}% ({correctAttempts}/{totalAttempts})
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3.5">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500">Questions Practiced</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalAttempts}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500">Areas Checked</p>
                <p className="text-sm font-bold text-amber-800 mt-1">
                  {detectedMisconceptions.length > 0
                    ? detectedMisconceptions.join(", ")
                    : "All clear!"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500">Skills Strengthened</p>
                <p className="text-sm font-bold text-emerald-800 mt-1">
                  {resolvedMisconceptions.length > 0
                    ? resolvedMisconceptions.join(", ")
                    : "Keep practicing to unlock"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">Your Practice Journey</h3>
              {traceLog.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No practice items submitted yet. Go to Practice to try a few questions!
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {traceLog.map((t) => (
                    <li
                      key={t.stepNumber}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2"
                    >
                      <span>
                        <strong>Step {t.stepNumber}:</strong> {t.equation} &rarr;{" "}
                        <code>{t.learnerAnswer}</code>
                      </span>
                      <span
                        className={`font-semibold ${
                          t.isCorrect ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {t.isCorrect ? "Solved" : `Guided (${t.misconceptionTag})`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setScreen("practice")}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Continue Practicing
              </button>
              <button
                type="button"
                onClick={restartSession}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear &amp; Pass Tablet to Next Peer
              </button>
              <button
                type="button"
                onClick={() => setShowAbout(true)}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-100"
              >
                About &amp; Exam Card (24B1292)
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Mandatory Persistent Footer on Every Single Screen/State */}
      <footer className="border-t border-slate-200 bg-white py-3.5 px-4 text-center text-xs text-slate-600">
        <span className="font-bold text-slate-900">Roll No: 24B1292</span> · ET617 End-Semester
        Examination (P4-T3-L2-C1) · BalanceMath Tutor
      </footer>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
