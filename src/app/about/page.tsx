import Link from "next/link";
import { allProfiles } from "@/lib/references";

export const metadata = {
  title: "About — BAI Health",
};

const LIMITATIONS: string[] = [
  "BMI and BRI are population-level signals, not diagnoses. Neither replaces a clinician.",
  "BMI does not distinguish muscle from fat. Athletes, bodybuilders, and people with high lean mass can score as \u201Coverweight\u201D while being metabolically healthy.",
  "Pregnancy, post-partum, recent amputation, and some chronic conditions make both indices unreliable.",
  "BRI is newer and based on smaller, less ethnically diverse studies than BMI. Published healthy ranges come mostly from European and East Asian adult cohorts.",
  "Standard adult BMI cutoffs do not apply to people under ~20 years old. This app does not target pediatric use.",
  "Ethnicity meaningfully affects both indices (e.g., WHO Asian-Pacific cutoffs are lower than the universal ones). The app does not currently ask for or adjust by ethnicity \u2014 this is a known limitation.",
  "\u201CPersonalized\u201D mode uses only sex and coarse age bands; it does not account for body composition, activity level, medications, or genetics.",
  "The BAI tier word is an encouragement frame, not a clinical grade. Improvement in your own BAI over time is a more meaningful signal than your absolute tier.",
];

export default function AboutPage() {
  const profiles = allProfiles();

  return (
    <section className="flex flex-1 flex-col gap-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">About</h1>
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
      </header>

      <Block title="What these numbers mean">
        <p>
          <strong>BMI</strong> (Body Mass Index) is{" "}
          <span className="font-mono">weight / height²</span>. It is a coarse
          population-level indicator of body mass relative to stature. It does
          not measure body composition.
        </p>
        <p>
          <strong>BRI</strong> (Body Roundness Index, Thomas 2013) uses waist
          circumference and height to approximate trunk shape. It tracks
          abdominal adiposity more directly than BMI does, but it is newer and
          less broadly validated.
        </p>
        <p>
          <strong>BAI</strong> (Body Awareness Index) is this app&rsquo;s
          combination of the two. Each of BMI and BRI is mapped onto a 0&ndash;100
          &ldquo;alignment&rdquo; score against a cohort midpoint; the BAI is
          their average. The score is surfaced as a tier word
          (Aligned / Centered / Building / Exploring / Awakening) and a progress
          ring. The tier word is an encouragement frame, not a diagnosis.
        </p>
      </Block>

      <Block title="How personalization works">
        <p>
          If you leave sex and age band blank in{" "}
          <Link href="/settings" className="underline underline-offset-4">
            Settings
          </Link>
          , BAI uses the universal cohort: the WHO adult BMI range centered at
          21.7 and the Thomas 2013 BRI range centered at 3.93.
        </p>
        <p>
          If you provide sex and age, BAI uses a cohort-adjusted midpoint from
          a small embedded reference table. The cohort shifts the underlying
          math so that your score reflects where you sit relative to people
          more like you demographically. The <em>tier word never changes</em>{" "}
          based on personalization settings &mdash; only the underlying
          alignment numbers do.
        </p>
        <p>
          Your own BAI trend over time is a more meaningful signal than the
          absolute tier. The dashboard shows this as an arrow next to your
          latest score.
        </p>
      </Block>

      <Block title="Limitations">
        <ul className="ml-5 list-disc space-y-2 text-zinc-700 dark:text-zinc-300">
          {LIMITATIONS.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </Block>

      <Block title="Cohort verification status">
        <p>
          Only the universal cohort is sourced from citable cutoffs (WHO for
          BMI, Thomas 2013 for BRI). Every other cohort in this v1 release is a
          conservative interpolation flagged as unverified, pending a pass
          against primary sources. Under-20 cohorts deliberately copy the
          universal numbers and raise a pediatric-fallback flag; adult cutoffs
          do not apply at that age.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-2 pr-4 font-medium">Cohort</th>
                <th className="py-2 pr-4 font-medium">Verified</th>
                <th className="py-2 font-medium">Pediatric fallback</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {profiles.map((p) => (
                <tr
                  key={p.cohortKey}
                  className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-900"
                >
                  <td className="py-2 pr-4">{p.cohortKey}</td>
                  <td
                    className={`py-2 pr-4 ${
                      p.verified
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {p.verified ? "verified" : "v1 estimate"}
                  </td>
                  <td
                    className={`py-2 ${
                      p.pediatricFallback
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {p.pediatricFallback ? "yes" : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>

      <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
        Not medical advice. Measurements are stored locally on your device.
      </p>
    </section>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 pb-8 last:border-b-0 last:pb-0 dark:border-zinc-800">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3 text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </div>
  );
}
