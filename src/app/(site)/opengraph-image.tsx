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
        padding: "56px 72px 0",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 28,
        }}
      >
        <svg width="72" height="72" viewBox="0 0 64 64">
          <rect x="4" y="19.5" width="56" height="5" rx="2.5" fill="#ff7a1f" />
          <rect x="4" y="29.5" width="56" height="5" rx="2.5" fill="#ff7a1f" />
          <rect x="4" y="39.5" width="56" height="5" rx="2.5" fill="#ff7a1f" />
          <path
            d="M32 5 C51.5 14.7 51.5 49.3 32 59 C12.5 49.3 12.5 14.7 32 5Z"
            fill="#050f16"
          />
          <path
            fillRule="evenodd"
            d="M32 9 C47 23.7 47 40.3 32 55 C17 40.3 17 23.7 32 9Z M32 14 C42.5 25.5 42.5 38.5 32 50 C21.5 38.5 21.5 25.5 32 14Z"
            fill="#ff7a1f"
          />
          <circle cx="32" cy="32" r="5.5" fill="#ff7a1f" />
        </svg>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -2 }}>
          Kalki
        </div>
      </div>
      <div
        style={{
          fontSize: 112,
          fontWeight: 800,
          letterSpacing: -6,
          lineHeight: 1,
        }}
      >
        Idea to Short
      </div>
      <div
        style={{ fontSize: 30, marginTop: 20, color: "#b9c2c8", maxWidth: 900 }}
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
                padding: "4px 20px",
                background: t.c,
                color: t.t,
                fontSize: 18,
                fontWeight: 700,
                width: 180,
              }}
            >
              {t.name}
            </div>
            <div style={{ height: i === 4 ? 28 : 8, background: t.c }} />
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
