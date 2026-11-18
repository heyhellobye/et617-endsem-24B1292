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
  { id: "welcome", label: "1. Setup" },
  { id: "diagnostic", label: "2. Warm-Up" },
  { id: "primer", label: "3. Scale Lab" },
  { id: "practice", label: "4. Practice" },
  { id: "report", label: "5. Mastery" },
];

export default function HomePage() {
  const [screen, setScreen] = useState<ScreenId>("welcome");
  const [simulateOffline, setSimulateOffline] = useState<boolean>(true);
  const [fallbackReason, setFallbackReason] = useState<string>(
    "Low-Bandwidth Fallback Active: Running built-in offline misconception parser & adaptive item bank (<100 KB)"
  );
  const [showAbout, setShowAbout] = useState<boolean>(false);

  // Screen 2: Diagnostic state
  const [diagIndex, setDiagIndex] = useState<number>(0);
  const [diagAnswers, setDiagAnswers] = useState<
    Record<string, { optionId: string; isCorrect: boolean; tag: MisconceptionTag }>
  >({});
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
  const [hintVisible, setHintVisible] = useState<boolean>(false);
  const [hintCount, setHintCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Adaptive tracking signals
  const [streak, setStreak] = useState<number>(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [detectedMisconceptions, setDetectedMisconceptions] = useState<MisconceptionTag[]>([]);
  const [resolvedMisconceptions, setResolvedMisconceptions] = useState<MisconceptionTag[]>([]);
  const [traceLog, setTraceLog] = useState<DecisionTraceEntry[]>([]);
  const [traceOpen, setTraceOpen] = useState<boolean>(true);

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

    if (diagIndex < DIAGNOSTIC_ITEMS.length - 1) {
      setDiagIndex(diagIndex + 1);
    } else {
      const anyWrong = Object.values(updated).some((a) => !a.isCorrect);
      const anyM1 = Object.values(updated).some((a) => a.tag === "M1");
      setStartingLevel(anyWrong ? "Foundational" : "Standard");
      if (anyM1) {
        setDetectedMisconceptions((prev) => (prev.includes("M1") ? prev : [...prev, "M1"]));
      }
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
    setHintVisible(false);
    setHintCount(0);
  };

  const submitPracticeAnswer = async (override?: {
    selectedOptionId?: string;
    numericInput?: string;
    explanationInput?: string;
    step1Choice?: string;
    step2Choice?: string;
  }) => {
    const optId = override?.selectedOptionId ?? selectedOptionId;
    const numVal = override?.numericInput ?? numericInput;
    const expVal = override?.explanationInput ?? explanationInput;
    const s1 = override?.step1Choice ?? step1Choice;
    const s2 = override?.step2Choice ?? step2Choice;

    let learnerAnswer = numVal;
    if (currentQuestion.format === "MCQ" && currentQuestion.options) {
      const opt = currentQuestion.options.find((o) => o.id === optId);
      learnerAnswer = opt ? opt.label : "";
    } else if (currentQuestion.format === "BALANCE_BUILDER") {
      learnerAnswer = `Step1:${s1}, Step2:${s2}`;
    }

    if (!learnerAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          questionPrompt: currentQuestion.prompt,
          learnerAnswer,
          explanationText: expVal,
          selectedOptionId: optId,
          step1Choice: s1,
          step2Choice: s2,
          simulateOffline,
        }),
      });
      const data = await res.json();

      if (data.mode === "fallback" || data.mode === "offline") {
        setFallbackReason(
          data.fallbackReason ||
            "Low-Bandwidth Fallback Active: Running built-in offline misconception parser & adaptive item bank (<100 KB)"
        );
      }

      const isCorrect = Boolean(data.isCorrect);
      const tag = (data.misconceptionTag || "NONE") as MisconceptionTag;

      const newStreak = isCorrect ? streak + 1 : 0;
      const newConsecErrors = isCorrect ? 0 : consecutiveErrors + 1;
      const newCompleted = isCorrect
        ? Array.from(new Set([...completedIds, currentQuestion.id]))
        : completedIds;

      if (!isCorrect && (tag === "M1" || tag === "M2")) {
        setDetectedMisconceptions((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
      }
      if (isCorrect) {
        if (currentQuestion.id === "Q_REM_M1") {
          setResolvedMisconceptions((prev) => (prev.includes("M1") ? prev : [...prev, "M1"]));
        }
        if (currentQuestion.id === "Q_REM_M2" || currentQuestion.id === "Q_PREREQ_1") {
          setResolvedMisconceptions((prev) => (prev.includes("M2") ? prev : [...prev, "M2"]));
        }
      }

      const decision = decideNextStep({
        currentQuestionId: currentQuestion.id,
        isCorrect,
        misconceptionTag: tag,
        hintCount,
        consecutiveErrors: newConsecErrors,
        completedIds: newCompleted,
      });

      const entry: DecisionTraceEntry = {
        stepNumber: traceLog.length + 1,
        questionId: currentQuestion.id,
        equation: currentQuestion.equation,
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
      submitPracticeAnswer({ selectedOptionId: "A" });
    } else if (scenario === "B_M1") {
      setCurrentQuestionId("Q_CORE_1");
      setLastFeedback(null);
      setSelectedOptionId("B");
      setHintCount(0);
      submitPracticeAnswer({ selectedOptionId: "B" });
    } else {
      // Trigger M2 on Q_REM_M1 (option C: 5x = 14) to demonstrate 2nd consecutive error -> STEP_BACK_PREREQUISITE
      setCurrentQuestionId("Q_REM_M1");
      setLastFeedback(null);
      setSelectedOptionId("C");
      setHintCount(0);
      submitPracticeAnswer({ selectedOptionId: "C" });
    }
  };

  const restartSession = () => {
    setScreen("welcome");
    setDiagIndex(0);
    setDiagAnswers({});
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
      {/* Persistent Top Navigation & Low-Bandwidth Controls */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              =
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                BalanceMath Tutor
              </h1>
              <p className="text-[11px] text-slate-500">
                Class 8 Linear Equations · NGO Tablet Edition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
              <input
                type="checkbox"
                checked={simulateOffline}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSimulateOffline(checked);
                  if (checked) {
                    setFallbackReason(
                      "Low-Bandwidth Fallback Active: Running built-in offline misconception parser & adaptive item bank (<100 KB)"
                    );
                  }
                }}
                className="accent-amber-600"
              />
              <span>Simulate AI Timeout / Offline Fallback</span>
            </label>

            <button
              type="button"
              onClick={() => setShowAbout(true)}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
            >
              About (24B1292)
            </button>
          </div>
        </div>

        {/* 5-Screen Progress Bar */}
        <nav
          aria-label="Lesson progress"
          className="mx-auto max-w-5xl px-4 pb-2 flex items-center gap-1.5 overflow-x-auto"
        >
          {SCREEN_STEPS.map((s) => {
            const active = screen === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScreen(s.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Low-Bandwidth Fallback Banner (C1) */}
        {simulateOffline && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2 align-middle" />
            {fallbackReason}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6">
        {/* SCREEN 1: WELCOME & LOW-BANDWIDTH SETUP */}
        {screen === "welcome" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                Low-Bandwidth Ready · &lt;100 KB Inline SVG Bundle
              </span>
              <span className="text-xs font-semibold text-slate-500">
                25-Minute NGO Tablet Session
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Welcome, Aarav! Let&apos;s Master Linear Equations Together.
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Today we&apos;ll treat every equation like a{" "}
                <strong className="text-indigo-700">kirana weighing scale</strong>. As long as you
                do the exact same operation to{" "}
                <strong className="text-emerald-700">both sides</strong>, the scale stays level!
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-indigo-700">Step 1 · 3 mins</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">Quick Warm-Up</p>
                <p className="text-xs text-slate-600 mt-1">
                  2 short questions to find your best starting level.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-indigo-700">Step 2 · 5 mins</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">Balance Scale Lab</p>
                <p className="text-xs text-slate-600 mt-1">
                  Move mystery x-bags and ₹1 coins on an interactive scale.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-indigo-700">Step 3 · 15 mins</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">Adaptive Practice</p>
                <p className="text-xs text-slate-600 mt-1">
                  3 question formats with instant hints and real-life auto-fare problems.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setScreen("diagnostic")}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Start 2-Question Warm-Up &rarr;
              </button>
              <button
                type="button"
                onClick={() => setScreen("practice")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Jump Directly to Practice Studio
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 2: DIAGNOSTIC WARM-UP (2 ITEMS) */}
        {screen === "diagnostic" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                Diagnostic Warm-Up · Question {diagIndex + 1} of {DIAGNOSTIC_ITEMS.length}
              </span>
              <span className="text-xs text-slate-500">Sets your starting path</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {DIAGNOSTIC_ITEMS[diagIndex].title}
            </h2>
            <p className="text-base text-slate-800 font-medium">
              {DIAGNOSTIC_ITEMS[diagIndex].prompt}
            </p>
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              Tip: {DIAGNOSTIC_ITEMS[diagIndex].hint}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              {DIAGNOSTIC_ITEMS[diagIndex].options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleDiagSelect(opt.id, opt.isCorrect, opt.misconceptionTag)}
                  className="text-left rounded-xl border-2 border-slate-200 bg-white p-4 hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors"
                >
                  <span className="inline-block font-bold text-indigo-700 mr-2">{opt.id})</span>
                  <span className="font-semibold text-slate-900">{opt.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* SCREEN 3: CONVERSATIONAL CONCEPT PRIMER & INTERACTIVE BALANCE SCALE */}
        {screen === "primer" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                Concept Primer · Interactive Balance Scale
              </span>
              <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-xs font-semibold text-indigo-800">
                Diagnostic Level: {startingLevel}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">
                Notice how we keep the weighing scale level!
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
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
              className={`rounded-xl border p-3.5 text-sm font-medium ${
                primerTilt !== 0
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : primerStep === 2
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-indigo-50 border-indigo-200 text-indigo-900"
              }`}
            >
              {primerMessage}
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={primerStep !== 0}
                onClick={() => handlePrimerAction("SUB_3")}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                Subtract 3 from both sides
              </button>
              <button
                type="button"
                disabled={primerStep !== 0}
                onClick={() => handlePrimerAction("ADD_3")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Add 3 to both sides
              </button>
              <button
                type="button"
                disabled={primerStep === 2}
                onClick={() => handlePrimerAction("DIV_2")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                Divide both sides by 2
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setScreen("practice")}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                Go to Adaptive Practice Studio &rarr;
              </button>
            </div>
          </section>
        )}

        {/* SCREEN 4: ADAPTIVE PRACTICE & REASONING STUDIO */}
        {screen === "practice" && (
          <div className="space-y-4">
            {/* Evaluator Demo Quick-Fill Bar */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-950">
                Evaluator Demo Quick-Fill:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runDemoQuickFill("A_CORRECT")}
                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Scenario A: Correct (ADVANCE)
                </button>
                <button
                  type="button"
                  onClick={() => runDemoQuickFill("B_M1")}
                  className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  Scenario B1: M1 Error (REMEDIATE)
                </button>
                <button
                  type="button"
                  onClick={() => runDemoQuickFill("B_M2")}
                  className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Scenario B2: 2nd Error (PREREQUISITE)
                </button>
              </div>
            </div>

            {/* Active Question Card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                  {currentQuestion.badge}
                </span>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <span>Streak: {streak}</span>
                  <span>Consecutive Errors: {consecutiveErrors}</span>
                  <span>Hints: {hintCount}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-2xl font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 inline-block">
                  {currentQuestion.equation}
                </div>
                <p className="text-base font-semibold text-slate-900 pt-1">
                  {currentQuestion.prompt}
                </p>
                {currentQuestion.contextNote && (
                  <p className="text-xs text-slate-600">{currentQuestion.contextNote}</p>
                )}
              </div>

              {/* Format 1: Diagnostic Multiple Choice */}
              {currentQuestion.format === "MCQ" && currentQuestion.options && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt) => {
                    const selected = selectedOptionId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={Boolean(lastFeedback)}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`text-left rounded-xl border-2 p-3.5 transition-colors ${
                          selected
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className="font-bold text-indigo-700 mr-2">{opt.id})</span>
                        <span className="font-semibold text-slate-900 text-sm">{opt.label}</span>
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
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Step 1: Undo −4
                        </label>
                        <select
                          value={step1Choice}
                          disabled={Boolean(lastFeedback)}
                          onChange={(e) => setStep1Choice(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
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
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Step 2: Isolate x
                        </label>
                        <select
                          value={step2Choice}
                          disabled={Boolean(lastFeedback)}
                          onChange={(e) => setStep2Choice(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
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
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Value of x (number only):
                    </label>
                    <input
                      type="text"
                      value={numericInput}
                      disabled={Boolean(lastFeedback)}
                      onChange={(e) => setNumericInput(e.target.value)}
                      placeholder="e.g., 16 or 5"
                      className="w-full sm:w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {currentQuestion.explanationPrompt || "Explain your steps:"}
                    </label>
                    <textarea
                      rows={3}
                      value={explanationInput}
                      disabled={Boolean(lastFeedback)}
                      onChange={(e) => setExplanationInput(e.target.value)}
                      placeholder="Write one or two short sentences..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Hint Box */}
              {hintVisible && (
                <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-2.5 text-xs text-sky-950">
                  <strong>Hint:</strong> {currentQuestion.hint}
                </div>
              )}

              {/* Action Buttons */}
              {!lastFeedback && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!hintVisible) {
                        setHintVisible(true);
                        setHintCount((c) => c + 1);
                      }
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {hintVisible ? "Hint Shown" : "Show Hint"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => submitPracticeAnswer()}
                      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Checking..." : "Check Answer"}
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback & Adaptive Routing Banner */}
              {lastFeedback && (
                <div
                  className={`rounded-xl border p-4 space-y-3 ${
                    lastFeedback.isCorrect
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold">
                      {lastFeedback.isCorrect
                        ? "Correct!"
                        : `Misconception Detected: ${lastFeedback.misconceptionTag}`}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold border border-slate-200 text-slate-800">
                      Decision: {lastFeedback.outcome}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{lastFeedback.feedback}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAdvanceToNextQuestion}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      Continue to Next Adaptive Item ({lastFeedback.nextQuestionId}) &rarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => setScreen("report")}
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Finish & View Mastery Report
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Collapsible Tutor Decision Rule Trace Panel */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={() => setTraceOpen((o) => !o)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Tutor Decision Rule Trace ({traceLog.length} steps logged)
                </span>
                <span className="text-xs font-semibold text-indigo-700">
                  {traceOpen ? "Hide" : "Show"}
                </span>
              </button>

              {traceOpen && (
                <div className="mt-3 space-y-2">
                  {traceLog.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Submit an answer (or use the Evaluator Demo Quick-Fill above) to inspect live
                      decision-rule routing across ADVANCE, REMEDIATE_MISCONCEPTION, and
                      STEP_BACK_PREREQUISITE.
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
                  Session Mastery Report — Aarav Kamble
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Topic: P4-T3 Linear Equations in One Variable · Starting Level: {startingLevel}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                Accuracy: {accuracyPct}% ({correctAttempts}/{totalAttempts})
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500">Questions Completed</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalAttempts}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500">Misconceptions Detected</p>
                <p className="text-sm font-bold text-amber-800 mt-1">
                  {detectedMisconceptions.length > 0
                    ? detectedMisconceptions.join(", ")
                    : "None detected"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500">Misconceptions Resolved</p>
                <p className="text-sm font-bold text-emerald-800 mt-1">
                  {resolvedMisconceptions.length > 0
                    ? resolvedMisconceptions.join(", ")
                    : "Keep practicing to resolve"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">
                Adaptive Decision Rule History
              </h3>
              {traceLog.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No practice items submitted yet. Visit Screen 4 (Practice) to log adaptive steps.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {traceLog.map((t) => (
                    <li
                      key={t.stepNumber}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 flex flex-wrap items-center justify-between gap-2"
                    >
                      <span>
                        <strong>Step {t.stepNumber}:</strong> {t.equation} &rarr;{" "}
                        <code>{t.learnerAnswer}</code> ({t.misconceptionTag})
                      </span>
                      <span className="font-bold text-indigo-700">
                        {t.outcome} &rarr; {t.nextQuestionId}
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
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Continue Practicing
              </button>
              <button
                type="button"
                onClick={restartSession}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset Session for Next Student
              </button>
              <button
                type="button"
                onClick={() => setShowAbout(true)}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-100"
              >
                View About &amp; Exam Card (24B1292)
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Mandatory Persistent Footer on Every Single Screen/State */}
      <footer className="border-t border-slate-200 bg-white py-3 px-4 text-center text-xs text-slate-600">
        <span className="font-bold text-slate-900">Roll No: 24B1292</span> · ET617 End-Semester
        Examination (P4-T3-L2-C1) · Low-Bandwidth Adaptive Tutor
      </footer>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
