import { ImageResponse } from "next/og";

/**
 * App icons generated at build time via Next's metadata image route.
 *
 * The `id` values here map to URL slugs:
 *   id "192"            → /icon/192
 *   id "512"            → /icon/512
 *   id "512-maskable"   → /icon/512-maskable  (has generous safe-zone padding
 *                         so Android mask crops don't clip the mark)
 *
 * Keep these `id`s in sync with `src/app/manifest.ts`.
 */

interface IconSpec {
  id: string;
  size: number;
  maskable: boolean;
}

const ICONS: IconSpec[] = [
  { id: "192", size: 192, maskable: false },
  { id: "512", size: 512, maskable: false },
  { id: "512-maskable", size: 512, maskable: true },
];

export function generateImageMetadata() {
  return ICONS.map((i) => ({
    id: i.id,
    size: { width: i.size, height: i.size },
    contentType: "image/png",
    alt: "BAI Health",
  }));
}

export const contentType = "image/png";

export default async function Icon({
  id,
}: {
  id: Promise<string | number>;
}) {
  const iconId = String(await id);
  const spec = ICONS.find((i) => i.id === iconId) ?? ICONS[0];

  // Maskable icons need a "safe zone": Android mask crops can cut up to ~20%
  // off each edge, so we shrink the mark to 60% of the canvas.
  const markScale = spec.maskable ? 0.6 : 0.82;
  const ringThickness = spec.size * 0.08;
  const ringSize = spec.size * markScale;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
        }}
      >
        <div
          style={{
            width: ringSize,
            height: ringSize,
            borderRadius: "50%",
            border: `${ringThickness}px solid #34d399`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fafafa",
            fontFamily: "sans-serif",
            fontWeight: 700,
            fontSize: ringSize * 0.38,
            letterSpacing: -1,
          }}
        >
          BAI
        </div>
      </div>
    ),
    {
      width: spec.size,
      height: spec.size,
    },
  );
}
