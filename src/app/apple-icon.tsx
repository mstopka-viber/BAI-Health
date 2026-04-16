import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon. iOS does not apply a mask, so this is the un-padded
 * version of the mark. Served at /apple-icon.
 */
export default function AppleIcon() {
  const ringSize = size.width * 0.82;
  const ringThickness = size.width * 0.08;

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
    size,
  );
}
