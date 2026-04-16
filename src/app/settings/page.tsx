"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteAllEntries,
  getEntryCount,
  getProfile,
  saveProfile,
  type ProfileRecord,
  type UnitSystem,
} from "@/lib/db";
import type { AgeBand, Sex } from "@/lib/references";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; profile: ProfileRecord | undefined; entryCount: number };

const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: "under20", label: "Under 20" },
  { value: "20-39", label: "20 – 39" },
  { value: "40-64", label: "40 – 64" },
  { value: "65plus", label: "65 +" },
];

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

export default function SettingsPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [savingMsg, setSavingMsg] = useState<string | null>(null);

  async function refresh() {
    const [profile, entryCount] = await Promise.all([
      getProfile(),
      getEntryCount(),
    ]);
    setState({ status: "ready", profile, entryCount });
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProfile(), getEntryCount()])
      .then(([profile, entryCount]) => {
        if (cancelled) return;
        setState({ status: "ready", profile, entryCount });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "ready", profile: undefined, entryCount: 0 });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  const profile = state.profile;
  const entryCount = state.entryCount;
  const unitSystem: UnitSystem = profile?.unitSystem ?? "metric";
  const sex = profile?.sex;
  const ageBand = profile?.ageBand;
  const personalized = sex !== undefined && ageBand !== undefined;

  async function onChangeUnits(next: UnitSystem) {
    await saveProfile({ unitSystem: next });
    setSavingMsg("Units saved.");
    await refresh();
  }

  async function onChangeSex(next: Sex | undefined) {
    await saveProfile({ sex: next });
    setSavingMsg("Profile saved.");
    await refresh();
  }

  async function onChangeAgeBand(next: AgeBand | undefined) {
    await saveProfile({ ageBand: next });
    setSavingMsg("Profile saved.");
    await refresh();
  }

  async function onClearHistory() {
    const ok = window.confirm(
      `Delete all ${entryCount} measurement${entryCount === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!ok) return;
    await deleteAllEntries();
    setSavingMsg("History cleared.");
    await refresh();
  }

  return (
    <section className="flex flex-1 flex-col gap-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
      </header>

      <SettingBlock
        title="Units"
        description="Choose how you enter measurements. Stored values are always metric; the toggle only changes the form."
      >
        <div className="inline-flex rounded-full border border-zinc-200 p-1 text-sm dark:border-zinc-800">
          <Segment
            label="Metric"
            active={unitSystem === "metric"}
            onClick={() => onChangeUnits("metric")}
          />
          <Segment
            label="Imperial"
            active={unitSystem === "imperial"}
            onClick={() => onChangeUnits("imperial")}
          />
        </div>
      </SettingBlock>

      <SettingBlock
        title="Personalization (optional)"
        description="If you share sex and age band, BAI uses cohort-adjusted midpoints for its alignment math. The tier word is the same either way. Leave blank to use the universal profile."
      >
        <div className="flex flex-col gap-5">
          <SelectField
            id="sex"
            label="Sex"
            value={sex ?? ""}
            onChange={(v) => onChangeSex(v === "" ? undefined : (v as Sex))}
            options={[
              { value: "", label: "Prefer not to say" },
              ...SEX_OPTIONS,
            ]}
          />
          <SelectField
            id="ageBand"
            label="Age band"
            value={ageBand ?? ""}
            onChange={(v) =>
              onChangeAgeBand(v === "" ? undefined : (v as AgeBand))
            }
            options={[
              { value: "", label: "Prefer not to say" },
              ...AGE_BANDS,
            ]}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Current cohort:{" "}
            <span className="font-mono">
              {personalized ? `${sex}_${ageBand}` : "universal"}
            </span>
            {ageBand === "under20" && personalized && (
              <>
                {" "}
                — adult BMI/BRI cutoffs do not apply under age 20; the app
                uses the universal range with a pediatric-fallback flag.
              </>
            )}
            {personalized && ageBand !== "under20" && (
              <> — adult cohort values are v1 estimates pending verification.</>
            )}
          </p>
        </div>
      </SettingBlock>

      <SettingBlock
        title="History"
        description={`You have ${entryCount} saved measurement${entryCount === 1 ? "" : "s"}. Clearing history removes every entry from this device.`}
      >
        <button
          type="button"
          onClick={onClearHistory}
          disabled={entryCount === 0}
          className="rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/60 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30"
        >
          Clear all history
        </button>
      </SettingBlock>

      {savingMsg && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{savingMsg}</p>
      )}
    </section>
  );
}

function SettingBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 pb-8 last:border-b-0 last:pb-0 dark:border-zinc-800">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <div className="pt-2">{children}</div>
    </div>
  );
}

function Segment({
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

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
