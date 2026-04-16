"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllEntries, type EntryRecord } from "@/lib/db";
import type { BaiTier } from "@/lib/indices";

type LoadState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; entry: EntryRecord; previous?: EntryRecord };

/** Minimum BAI-point delta to treat as a direction change instead of flat. */
const TREND_FLAT_THRESHOLD = 1;
type TrendDirection = "up" | "flat" | "down";

function trendFor(
  latest: EntryRecord,
  previous: EntryRecord | undefined,
): { direction: TrendDirection; delta: number } | null {
  if (!previous) return null;
  const delta = latest.bai - previous.bai;
  if (Math.abs(delta) < TREND_FLAT_THRESHOLD) return { direction: "flat", delta };
  return { direction: delta > 0 ? "up" : "down", delta };
}

const TIER_BLURB: Record<BaiTier, string> = {
  Aligned: "You are sitting near the center of your healthy range.",
  Centered: "You are close to your healthy range — small shifts matter.",
  Building: "You are building toward your healthy range. One step at a time.",
  Exploring: "You are exploring the path. Every measurement is signal, not verdict.",
  Awakening: "You are just becoming aware. Awareness is where every change starts.",
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Dashboard() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getAllEntries()
      .then((entries) => {
        if (cancelled) return;
        if (entries.length === 0) {
          setState({ status: "empty" });
          return;
        }
        // getAllEntries returns ascending by createdAt, so latest is last.
        const entry = entries[entries.length - 1];
        const previous =
          entries.length >= 2 ? entries[entries.length - 2] : undefined;
        setState({ status: "ready", entry, previous });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "empty" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        Loading your history…
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome to BAI Health
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Take your first measurement to see your BMI, BRI, and a combined
          Body Awareness Index framed around your own progress.
        </p>
        <Link
          href="/measure"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Take first measurement
        </Link>
      </section>
    );
  }

  const { entry, previous } = state;
  const baiPct = Math.round(entry.bai);
  const trend = trendFor(entry, previous);

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Latest</h1>
        <span className="text-sm text-zinc-500">{formatDate(entry.createdAt)}</span>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-6">
          <TierRing score={baiPct} />
          <div>
            <div className="text-4xl font-semibold tracking-tight">
              {tierFromBai(entry.bai)}
            </div>
            <p className="mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
              {TIER_BLURB[tierFromBai(entry.bai)]}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <Stat
            label="BAI"
            value={`${baiPct} / 100`}
            trailing={trend ? <TrendArrow trend={trend} /> : undefined}
          />
          <Stat label="BMI" value={entry.bmi.toFixed(1)} />
          <Stat label="BRI" value={entry.bri.toFixed(2)} />
        </dl>
      </div>

      <div className="flex gap-3">
        <Link
          href="/measure"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-50 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Record another
        </Link>
        <Link
          href="/settings"
          className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Settings
        </Link>
      </div>
    </section>
  );
}

function tierFromBai(bai: number): BaiTier {
  if (bai >= 85) return "Aligned";
  if (bai >= 65) return "Centered";
  if (bai >= 45) return "Building";
  if (bai >= 25) return "Exploring";
  return "Awakening";
}

function Stat({
  label,
  value,
  trailing,
}: {
  label: string;
  value: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 font-mono text-lg tabular-nums">
        <span>{value}</span>
        {trailing}
      </dd>
    </div>
  );
}

function TrendArrow({
  trend,
}: {
  trend: { direction: TrendDirection; delta: number };
}) {
  const rounded = Math.round(Math.abs(trend.delta));
  const label =
    trend.direction === "flat"
      ? "Unchanged from previous entry"
      : trend.direction === "up"
        ? `Up ${rounded} point${rounded === 1 ? "" : "s"} from previous entry`
        : `Down ${rounded} point${rounded === 1 ? "" : "s"} from previous entry`;
  const color =
    trend.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend.direction === "down"
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-500";

  return (
    <span
      aria-label={label}
      title={label}
      className={`inline-flex items-center ${color}`}
    >
      {trend.direction === "up" && (
        <svg
          viewBox="0 0 12 12"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 10V2" />
          <path d="M2 6l4-4 4 4" />
        </svg>
      )}
      {trend.direction === "down" && (
        <svg
          viewBox="0 0 12 12"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 2v8" />
          <path d="M2 6l4 4 4-4" />
        </svg>
      )}
      {trend.direction === "flat" && (
        <svg
          viewBox="0 0 12 12"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 6h8" />
        </svg>
      )}
    </span>
  );
}

function TierRing({ score }: { score: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * circumference;
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-24 w-24 -rotate-90"
      aria-label={`Progress ring at ${score} of 100`}
      role="img"
    >
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        className="text-zinc-200 dark:text-zinc-800"
      />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        className="text-emerald-500"
      />
    </svg>
  );
}
