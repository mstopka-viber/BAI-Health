"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  deleteEntry,
  getAllEntries,
  type EntryRecord,
} from "@/lib/db";
import { tierForScore, type BaiTier } from "@/lib/indices";

type LoadState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; entries: EntryRecord[] };

type OverlayKey = "bmi" | "bri";

const TIER_COLOR: Record<BaiTier, string> = {
  Aligned: "text-emerald-600 dark:text-emerald-400",
  Centered: "text-sky-600 dark:text-sky-400",
  Building: "text-amber-600 dark:text-amber-400",
  Exploring: "text-orange-600 dark:text-orange-400",
  Awakening: "text-zinc-600 dark:text-zinc-400",
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatShortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function HistoryPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [overlays, setOverlays] = useState<Record<OverlayKey, boolean>>({
    bmi: false,
    bri: false,
  });

  const load = useCallback(async () => {
    const entries = await getAllEntries().catch(() => [] as EntryRecord[]);
    setState(
      entries.length === 0
        ? { status: "empty" }
        : { status: "ready", entries },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAllEntries()
      .then((entries) => {
        if (cancelled) return;
        setState(
          entries.length === 0
            ? { status: "empty" }
            : { status: "ready", entries },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "empty" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(entry: EntryRecord) {
    const ok = window.confirm(
      `Delete the entry from ${formatDate(entry.createdAt)}? This cannot be undone.`,
    );
    if (!ok) return;
    await deleteEntry(entry.id);
    await load();
  }

  if (state.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        Loading history…
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">No history yet</h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Once you record a measurement it will appear here, with a chart of
          your BAI over time.
        </p>
        <Link
          href="/measure"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-50 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Take a measurement
        </Link>
      </section>
    );
  }

  const entries = state.entries;
  const newestFirst = [...entries].reverse();

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <span className="text-sm text-zinc-500">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            BAI over time
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <OverlayToggle
              label="BMI"
              active={overlays.bmi}
              onClick={() =>
                setOverlays((o) => ({ ...o, bmi: !o.bmi }))
              }
              swatch="bg-violet-500"
            />
            <OverlayToggle
              label="BRI"
              active={overlays.bri}
              onClick={() =>
                setOverlays((o) => ({ ...o, bri: !o.bri }))
              }
              swatch="bg-amber-500"
            />
          </div>
        </div>
        <Chart entries={entries} overlays={overlays} />
        {(overlays.bmi || overlays.bri) && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Overlay lines are min-max normalized per series for shape comparison
            only. Raw BMI and BRI values live in the list below.
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {newestFirst.map((entry) => {
          const tier = tierForScore(entry.bai);
          return (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span
                    className={`text-base font-semibold ${TIER_COLOR[tier]}`}
                  >
                    {tier}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-zinc-500">
                    {Math.round(entry.bai)} / 100
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {formatDate(entry.createdAt)}
                  {" · "}
                  <span className="font-mono tabular-nums">
                    BMI {entry.bmi.toFixed(1)}
                  </span>
                  {" · "}
                  <span className="font-mono tabular-nums">
                    BRI {entry.bri.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(entry)}
                aria-label={`Delete entry from ${formatDate(entry.createdAt)}`}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function OverlayToggle({
  label,
  active,
  onClick,
  swatch,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  swatch: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          : "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }
    >
      <span className={`inline-block h-2 w-2 rounded-full ${swatch}`} />
      {label}
    </button>
  );
}

const CHART = {
  viewW: 600,
  viewH: 220,
  padLeft: 40,
  padRight: 16,
  padTop: 16,
  padBottom: 32,
};

function Chart({
  entries,
  overlays,
}: {
  entries: EntryRecord[];
  overlays: Record<OverlayKey, boolean>;
}) {
  const innerW = CHART.viewW - CHART.padLeft - CHART.padRight;
  const innerH = CHART.viewH - CHART.padTop - CHART.padBottom;
  const n = entries.length;

  const xAt = (i: number) =>
    n === 1
      ? CHART.padLeft + innerW / 2
      : CHART.padLeft + (i * innerW) / (n - 1);
  const yFromBai = (score: number) =>
    CHART.padTop + innerH * (1 - Math.max(0, Math.min(100, score)) / 100);

  const baiPath = linePath(entries.map((e, i) => [xAt(i), yFromBai(e.bai)]));

  const overlayPaths: { color: string; d: string }[] = [];
  if (overlays.bmi) {
    const values = entries.map((e) => e.bmi);
    const d = normalizedPath(values, xAt, innerH);
    if (d) overlayPaths.push({ color: "stroke-violet-500", d });
  }
  if (overlays.bri) {
    const values = entries.map((e) => e.bri);
    const d = normalizedPath(values, xAt, innerH);
    if (d) overlayPaths.push({ color: "stroke-amber-500", d });
  }

  const yTicks = [0, 25, 50, 75, 100];
  const firstDate = formatShortDate(entries[0].createdAt);
  const lastDate = formatShortDate(entries[entries.length - 1].createdAt);

  return (
    <svg
      viewBox={`0 0 ${CHART.viewW} ${CHART.viewH}`}
      className="h-56 w-full"
      role="img"
      aria-label={`BAI chart across ${n} ${n === 1 ? "entry" : "entries"}`}
    >
      {/* Horizontal gridlines + y-axis labels */}
      {yTicks.map((t) => {
        const y = yFromBai(t);
        return (
          <g key={t}>
            <line
              x1={CHART.padLeft}
              x2={CHART.viewW - CHART.padRight}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-zinc-200 dark:text-zinc-800"
            />
            <text
              x={CHART.padLeft - 6}
              y={y + 3}
              textAnchor="end"
              className="fill-current font-mono text-[10px] text-zinc-500"
            >
              {t}
            </text>
          </g>
        );
      })}

      {/* BMI/BRI normalized overlays */}
      {overlayPaths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${p.color} opacity-70`}
          strokeDasharray="4 3"
        />
      ))}

      {/* BAI line (primary, on real 0-100 scale) */}
      <path
        d={baiPath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-500"
      />

      {/* BAI points */}
      {entries.map((e, i) => (
        <circle
          key={e.id}
          cx={xAt(i)}
          cy={yFromBai(e.bai)}
          r={3}
          className="fill-emerald-500"
        />
      ))}

      {/* X-axis date range */}
      <text
        x={CHART.padLeft}
        y={CHART.viewH - 10}
        textAnchor="start"
        className="fill-current text-[10px] text-zinc-500"
      >
        {firstDate}
      </text>
      {n > 1 && (
        <text
          x={CHART.viewW - CHART.padRight}
          y={CHART.viewH - 10}
          textAnchor="end"
          className="fill-current text-[10px] text-zinc-500"
        >
          {lastDate}
        </text>
      )}
    </svg>
  );
}

function linePath(points: Array<[number, number]>): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const head = `M ${first[0]} ${first[1]}`;
  const tail = rest.map(([x, y]) => `L ${x} ${y}`).join(" ");
  return tail ? `${head} ${tail}` : head;
}

/**
 * Map a 1D series to a 0–innerH path using min-max normalization across
 * the series. Returns null if the series is degenerate (all equal).
 */
function normalizedPath(
  values: number[],
  xAt: (i: number) => number,
  innerH: number,
): string | null {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const yOf = (v: number) => {
    // Center a degenerate (flat) series vertically.
    const norm = range === 0 ? 0.5 : (v - min) / range;
    return CHART.padTop + innerH * (1 - norm);
  };
  const points: Array<[number, number]> = values.map((v, i) => [xAt(i), yOf(v)]);
  return linePath(points);
}
