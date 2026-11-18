"use client";

import React from "react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h2 id="about-modal-title" className="text-lg font-bold text-slate-900">
              About BalanceMath Tutor
            </h2>
            <p className="text-xs font-semibold text-indigo-700 mt-0.5">
              ET 617 End-Semester Exam · Roll No: 24B1292
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
            <p className="font-semibold text-slate-900 mb-1">Exam Card: P4 · T3 · L2 · C1</p>
            <ul className="space-y-1 text-xs text-slate-700">
              <li>
                <strong>P4:</strong> Adaptive tutor with automatic question generation (3 formats +
                explanation evaluation + 3-outcome decision rule).
              </li>
              <li>
                <strong>T3:</strong> Linear equations in one variable (Class 8).
              </li>
              <li>
                <strong>L2:</strong> First-generation learner in an urban low-income settlement,
                NGO after-school centre with shared tablets.
              </li>
              <li>
                <strong>C1:</strong> Low bandwidth (&lt;100 KB inline SVG bundle, 4s AI timeout,
                deterministic offline fallback).
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-indigo-50/70 p-3 border border-indigo-200">
            <p className="font-semibold text-indigo-950 mb-1">
              Explicit 3-Outcome Adaptive Decision Rules
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-indigo-950">
              <li>
                <strong>ADVANCE:</strong> <code>isCorrect &amp;&amp; hintCount === 0</code> &rarr;
                serves harder multi-step or contextual word problem.
              </li>
              <li>
                <strong>REMEDIATE_MISCONCEPTION:</strong>{" "}
                <code>!isCorrect &amp;&amp; (M1 || M2) &amp;&amp; consecutiveErrors &lt; 2</code>{" "}
                &rarr; shows targeted counter-explanation &amp; parallel item.
              </li>
              <li>
                <strong>STEP_BACK_PREREQUISITE:</strong>{" "}
                <code>consecutiveErrors &gt;= 2 || PREREQUISITE_GAP</code> &rarr; routes to
                foundational like-terms micro-card.
              </li>
            </ol>
          </div>

          <p className="text-xs text-slate-500">
            Built with Next.js, React, Tailwind CSS, and deterministic offline fallback. Identity
            Token: <strong className="text-slate-800">24B1292</strong>.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Back to Tutor
          </button>
        </div>
      </div>
    </div>
  );
}
