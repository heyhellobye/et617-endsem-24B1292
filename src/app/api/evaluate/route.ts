import { NextRequest, NextResponse } from "next/server";
import {
  evaluateOffline,
  MisconceptionTag,
  QUESTION_BANK,
} from "@/lib/adaptiveEngine";

const ALLOWED_TAGS: MisconceptionTag[] = [
  "NONE",
  "M1",
  "M2",
  "PREREQUISITE_GAP",
  "PARTIAL_STEP",
];

interface EvaluateRequestBody {
  questionId: string;
  questionPrompt?: string;
  learnerAnswer: string;
  explanationText?: string;
  selectedOptionId?: string;
  step1Choice?: string;
  step2Choice?: string;
  simulateOffline?: boolean;
}

export async function POST(req: NextRequest) {
  let body: EvaluateRequestBody;
  try {
    body = (await req.json()) as EvaluateRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const {
    questionId,
    learnerAnswer,
    explanationText = "",
    selectedOptionId,
    step1Choice,
    step2Choice,
    simulateOffline = false,
  } = body;

  const question = QUESTION_BANK[questionId];
  if (!question) {
    return NextResponse.json(
      { error: `Unknown questionId: ${questionId}` },
      { status: 400 }
    );
  }

  // Deterministic offline mode when toggle is ON or no API key is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (simulateOffline || (!geminiKey && !openaiKey)) {
    const offlineResult = evaluateOffline({
      questionId,
      learnerAnswer,
      explanationText,
      selectedOptionId,
      step1Choice,
      step2Choice,
    });
    return NextResponse.json({
      ...offlineResult,
      mode: simulateOffline ? "fallback" : "offline",
      fallbackReason: simulateOffline
        ? "Simulated AI timeout / low-bandwidth fallback active"
        : "No AI API key configured — using built-in offline engine",
    });
  }

  // Online AI evaluation with 4-second AbortController timeout (C1 Low Bandwidth)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  const compactPrompt = `You are a warm, encouraging Class 8 math tutor for a first-generation learner.
Question: ${question.prompt}
Model Answer: ${question.modelAnswer}
Learner Answer: ${learnerAnswer}
Learner Explanation: ${explanationText || "(none)"}
Misconception codes: M1 (transposing without flipping sign), M2 (combining unlike terms like 2x+3=5x), PREREQUISITE_GAP, PARTIAL_STEP, NONE.
Return ONLY valid JSON: {"isCorrect": boolean, "misconceptionTag": "NONE"|"M1"|"M2"|"PREREQUISITE_GAP"|"PARTIAL_STEP", "feedback": "1-2 short warm sentences"}`;

  try {
    let rawText = "";

    if (geminiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: compactPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 200,
              responseMimeType: "application/json",
            },
          }),
        }
      );
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = await res.json();
      rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    } else if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          max_tokens: 200,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: compactPrompt }],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      rawText = data?.choices?.[0]?.message?.content ?? "";
    }

    clearTimeout(timeoutId);

    // Output Guardrail: validate JSON structure and allowed enum values
    const parsed = JSON.parse(rawText) as {
      isCorrect?: unknown;
      misconceptionTag?: unknown;
      feedback?: unknown;
    };

    if (
      typeof parsed.isCorrect === "boolean" &&
      typeof parsed.feedback === "string" &&
      parsed.feedback.trim().length > 0 &&
      typeof parsed.misconceptionTag === "string" &&
      ALLOWED_TAGS.includes(parsed.misconceptionTag as MisconceptionTag)
    ) {
      return NextResponse.json({
        isCorrect: parsed.isCorrect,
        misconceptionTag: parsed.misconceptionTag as MisconceptionTag,
        feedback: parsed.feedback.trim(),
        mode: "ai",
      });
    }

    throw new Error("AI output failed schema validation");
  } catch (err) {
    clearTimeout(timeoutId);
    const offlineResult = evaluateOffline({
      questionId,
      learnerAnswer,
      explanationText,
      selectedOptionId,
      step1Choice,
      step2Choice,
    });
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? "AI call exceeded 4s low-bandwidth timeout"
        : "AI response unavailable — switched to deterministic offline parser";

    return NextResponse.json({
      ...offlineResult,
      mode: "fallback",
      fallbackReason: reason,
    });
  }
}
