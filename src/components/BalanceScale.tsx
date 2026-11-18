"use client";

import React from "react";

interface BalanceScaleProps {
  leftX: number;
  leftConst: number;
  rightX: number;
  rightConst: number;
  tiltDegrees?: number;
  caption?: string;
}

/**
 * Lightweight inline SVG Balance Scale (<5 KB) for C1 Low Bandwidth.
 * Visualizes mystery x-bags and ₹1 coins (or owed -1 markers) on both pans.
 */
export default function BalanceScale({
  leftX,
  leftConst,
  rightX,
  rightConst,
  tiltDegrees = 0,
  caption,
}: BalanceScaleProps) {
  const renderPanItems = (xCount: number, constVal: number, side: "left" | "right") => {
    const bags = Array.from({ length: Math.min(Math.abs(xCount), 4) });
    const coins = Math.min(Math.abs(constVal), 15);
    const isNegativeConst = constVal < 0;

    return (
      <div className="flex flex-col items-center gap-1 min-h-[56px] justify-end">
        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[140px]">
          {bags.map((_, idx) => (
            <span
              key={`${side}-bag-${idx}`}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600 text-white text-xs font-bold shadow-sm border border-indigo-800"
              title="Mystery bag (x)"
            >
              x
            </span>
          ))}
          {coins > 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                isNegativeConst
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-amber-100 text-amber-900 border-amber-300"
              }`}
            >
              {isNegativeConst ? `−${coins} coins` : `+${coins} coins`}
            </span>
          )}
          {xCount === 0 && constVal === 0 && (
            <span className="text-xs text-slate-400 italic">empty</span>
          )}
        </div>
        <div className="text-[11px] font-mono font-semibold text-slate-700 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
          {formatSide(xCount, constVal)}
        </div>
      </div>
    );
  };

  const isBalanced = tiltDegrees === 0;

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Kirana Balance Scale Tool
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isBalanced
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {isBalanced ? "Balanced (=)" : "Tilted (Unbalanced!)"}
        </span>
      </div>

      {/* Pan visual */}
      <div className="relative flex flex-col items-center py-2">
        <div
          className="w-full max-w-md transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${tiltDegrees}deg)` }}
        >
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex flex-col items-center">
              {renderPanItems(leftX, leftConst, "left")}
              <div className="w-32 h-2 bg-slate-700 rounded-b-full mt-1" />
            </div>
            <div className="flex flex-col items-center">
              {renderPanItems(rightX, rightConst, "right")}
              <div className="w-32 h-2 bg-slate-700 rounded-b-full mt-1" />
            </div>
          </div>

          {/* Beam */}
          <div className="mx-auto w-[84%] h-2.5 bg-slate-800 rounded-full mt-1 relative">
            <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-white absolute left-1/2 -translate-x-1/2 -top-0.5" />
          </div>
        </div>

        {/* Fulcrum */}
        <svg
          width="48"
          height="28"
          viewBox="0 0 48 28"
          className="text-slate-700 -mt-0.5"
          aria-hidden="true"
        >
          <polygon points="24,2 44,26 4,26" fill="currentColor" />
        </svg>
        <div className="w-28 h-2 bg-slate-800 rounded-full" />
      </div>

      {caption && (
        <p className="mt-2 text-center text-xs text-slate-600">{caption}</p>
      )}
    </div>
  );
}

function formatSide(xCount: number, constVal: number): string {
  const parts: string[] = [];
  if (xCount !== 0) {
    parts.push(xCount === 1 ? "x" : `${xCount}x`);
  }
  if (constVal > 0) {
    parts.push(parts.length > 0 ? `+ ${constVal}` : `${constVal}`);
  } else if (constVal < 0) {
    parts.push(parts.length > 0 ? `- ${Math.abs(constVal)}` : `${constVal}`);
  }
  return parts.length > 0 ? parts.join(" ") : "0";
}
