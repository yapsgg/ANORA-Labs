import { ImageResponse } from "next/og";

export const alt = "ANORA Labs - The Open Source Flora.ai Alternative";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 9999,
              backgroundImage:
                "linear-gradient(180deg, #b8b8b8 0%, #f2f2f2 50%, #6e6e6e 100%)",
            }}
          />
          <div
            style={{
              fontSize: 30,
              letterSpacing: 8,
              fontWeight: 600,
              display: "flex",
            }}
          >
            ANORA LABS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              letterSpacing: -2,
              display: "flex",
            }}
          >
            The Open Source
          </div>
          <div
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#a1a1aa",
              display: "flex",
            }}
          >
            Flora.ai Alternative
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 3,
            color: "#a1a1aa",
          }}
        >
          anora.yaps.gg
        </div>
      </div>
    ),
    { ...size }
  );
}
