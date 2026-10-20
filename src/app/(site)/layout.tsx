import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/site/chrome";
import { Reveal } from "@/components/site/interactive";
import "./site.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-schibsted",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.SITE_URL ?? "https://kalki-studio.vercel.app",
  ),
  title: {
    default: "Kalki, the open-source AI short-video studio",
    template: "%s | Kalki",
  },
  description:
    "Five AI agents write, illustrate, voice, animate and cut a vertical video from one line of text. Self-hosted, MIT licensed, your own API keys.",
  openGraph: {
    type: "website",
    siteName: "Kalki",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#050f16" };

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`ks ${schibsted.variable}`}>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <Reveal />
      {children}
      <SiteFooter />
    </div>
  );
}
