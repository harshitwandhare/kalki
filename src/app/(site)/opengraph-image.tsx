import { ImageResponse } from "next/og";

export const alt = "Kalki, the open-source AI short-video studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const tabs = [
  { name: "Director", c: "#ffffff", t: "#050f16" },
  { name: "Screenwriter", c: "#ffb27a", t: "#050f16" },
  { name: "Artist", c: "#eef0f1", t: "#050f16" },
  { name: "Animator", c: "#13232e", t: "#f2f4f5" },
  { name: "Producer", c: "#ff7a1f", t: "#050f16" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#050f16",
        color: "#f2f4f5",
        padding: "64px 72px 0",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 132,
          fontWeight: 800,
          letterSpacing: -6,
          lineHeight: 1,
        }}
      >
        Idea to Short
      </div>
      <div
        style={{ fontSize: 34, marginTop: 24, color: "#b9c2c8", maxWidth: 900 }}
      >
        Kalki: five AI agents turn one line of text into a finished vertical
        video. Open source, self-hosted.
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}
      >
        {tabs.map((t, i) => (
          <div
            key={t.name}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                marginLeft: 40 + i * 190,
                padding: "6px 22px",
                background: t.c,
                color: t.t,
                fontSize: 22,
                fontWeight: 700,
                width: 180,
              }}
            >
              {t.name}
            </div>
            <div style={{ height: i === 4 ? 40 : 12, background: t.c }} />
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
