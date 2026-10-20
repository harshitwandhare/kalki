import { readFile } from "fs/promises";
import path from "path";
import { marked } from "marked";

export const DOCS = [
  { slug: "getting-started", title: "Getting started" },
  { slug: "configuration", title: "Configuration" },
  { slug: "pipeline", title: "The pipeline" },
  { slug: "architecture", title: "Architecture" },
  { slug: "api", title: "API" },
  { slug: "deployment", title: "Deployment" },
  { slug: "publishing", title: "Publishing everywhere" },
  { slug: "earning", title: "Earning with Kalki" },
  { slug: "responsible-use", title: "Responsible use" },
] as const;

/** Renders docs/<slug>.md. The files are ours, so the HTML is trusted. */
export async function renderDoc(slug: string): Promise<string | null> {
  if (!DOCS.some((d) => d.slug === slug)) return null;
  const md = await readFile(
    path.join(process.cwd(), "docs", `${slug}.md`),
    "utf8",
  );
  return marked.parse(md, { async: false });
}
