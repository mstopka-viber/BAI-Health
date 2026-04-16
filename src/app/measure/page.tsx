"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  addEntry,
  getProfile,
  saveProfile,
  type UnitSystem,
} from "@/lib/db";
import { computeBai, type BaiResult } from "@/lib/indices";
import { resolveProfile } from "@/lib/references";
import { toMetric } from "@/lib/units";

type FormState = {
  height: string;
  weight: string;
  waist: string;
  hip: string;
};

const EMPTY: FormState = { height: "", weight: "", waist: "", hip: "" };

type Submission =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "error"; message: string }
  | { status: "saved"; result: BaiResult };

export default function MeasurePage() {
  const [units, setUnits] = useState<UnitSystem>("metric");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submission, setSubmission] = useState<Submission>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (cancelled) return;
        if (profile) setUnits(profile.unitSystem);
      })
      .catch(() => {
        // No profile yet — default stays metric.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (submission.status === "error" || submission.status === "saved") {
      setSubmission({ status: "idle" });
    }
  }

  async function handleToggleUnits(next: UnitSystem) {
    if (next === units) return;
    setUnits(next);
    try {
      await saveProfile({ unitSystem: next });
    } catch {
      // Profile save is best-effort — the form still works.
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmission({ status: "saving" });

    const height = Number.parseFloat(form.height);
    const weight = Number.parseFloat(form.weight);
    const waist = Number.parseFloat(form.waist);
    const hip = form.hip.trim() === "" ? undefined : Number.parseFloat(form.hip);

    try {
      const metric =
        units === "metric"
          ? toMetric({
              system: "metric",
              heightCm: height,
              weightKg: weight,
              waistCm: waist,
              hipCm: hip,
            })
          : toMetric({
              system: "imperial",
              heightIn: height,
              weightLb: weight,
              waistIn: waist,
              hipIn: hip,
            });

      const profile = await getProfile().catch(() => undefined);
      const ref = resolveProfile({
        sex: profile?.sex,
        ageBand: profile?.ageBand,
      });

      const result = computeBai(
        metric.heightCm,
        metric.weightKg,
        metric.waistCm,
        ref,
      );

      await addEntry({
        createdAt: Date.now(),
        heightCm: metric.heightCm,
        weightKg: metric.weightKg,
        waistCm: metric.waistCm,
        hipCm: metric.hipCm,
        bmi: result.bmi,
        bri: result.bri,
        bmiAlign: result.bmiAlign,
        briAlign: result.briAlign,
        bai: result.bai,
        bmiMid: ref.bmi.mid,
        briMid: ref.bri.mid,
        cohortKey: ref.cohortKey,
        unitsAtEntry: units,
      });

      setSubmission({ status: "saved", result });
      setForm(EMPTY);
    } catch (err) {
      const message =
        err instanceof RangeError
          ? err.message
          : "Could not compute or save measurement. Check your inputs.";
      setSubmission({ status: "error", message });
    }
  }

  const heightLabel = units === "metric" ? "Height (cm)" : "Height (in)";
  const weightLabel = units === "metric" ? "Weight (kg)" : "Weight (lb)";
  const waistLabel = units === "metric" ? "Waist (cm)" : "Waist (in)";
  const hipLabel = units === "metric" ? "Hip (cm, optional)" : "Hip (in, optional)";

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">New measurement</h1>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
      </header>

      <div className="inline-flex self-start rounded-full border border-zinc-200 p-1 text-sm dark:border-zinc-800">
        <UnitToggle
          label="Metric"
          active={units === "metric"}
          onClick={() => handleToggleUnits("metric")}
        />
        <UnitToggle
          label="Imperial"
          active={units === "imperial"}
          onClick={() => handleToggleUnits("imperial")}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          id="height"
          label={heightLabel}
          value={form.height}
          onChange={(v) => update("height", v)}
          step={units === "metric" ? "0.1" : "0.25"}
          required
        />
        <Field
          id="weight"
          label={weightLabel}
          value={form.weight}
          onChange={(v) => update("weight", v)}
          step="0.1"
          required
        />
        <Field
          id="waist"
          label={waistLabel}
          value={form.waist}
          onChange={(v) => update("waist", v)}
          step={units === "metric" ? "0.1" : "0.25"}
          required
        />
        <Field
          id="hip"
          label={hipLabel}
          value={form.hip}
          onChange={(v) => update("hip", v)}
          step={units === "metric" ? "0.1" : "0.25"}
        />

        {submission.status === "error" && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300"
          >
            {submission.message}
          </p>
        )}

        <button
          type="submit"
          disabled={submission.status === "saving"}
          className="self-start rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {submission.status === "saving" ? "Saving…" : "Compute and save"}
        </button>
      </form>

      {submission.status === "saved" && <Result result={submission.result} />}
    </section>
  );
}

function UnitToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full bg-zinc-900 px-4 py-1.5 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
          : "rounded-full px-4 py-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }
    >
      {label}
    </button>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  step,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  step?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono tabular-nums text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
    </div>
  );
}

function Result({ result }: { result: BaiResult }) {
  const baiPct = Math.round(result.bai);
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/30">
      <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Saved
      </p>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
        {result.tier}
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-4 text-emerald-900 dark:text-emerald-100">
        <div>
          <dt className="text-xs uppercase tracking-wide opacity-70">BAI</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums">{baiPct} / 100</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide opacity-70">BMI</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums">
            {result.bmi.toFixed(1)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide opacity-70">BRI</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums">
            {result.bri.toFixed(2)}
          </dd>
        </div>
      </dl>
      <div className="mt-5">
        <Link
          href="/"
          className="text-sm font-medium text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-200"
        >
          View on dashboard →
        </Link>
      </div>
    </div>
  );
}
