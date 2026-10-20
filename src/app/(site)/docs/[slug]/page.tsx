import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { REPO, SiteNav } from "@/components/site/chrome";
import { DOCS, renderDoc } from "../content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = DOCS.find((d) => d.slug === slug);
  return { title: doc ? `${doc.title} - Docs` : "Docs" };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const html = await renderDoc(slug);
  if (!html) notFound();
  const i = DOCS.findIndex((d) => d.slug === slug);
  const prev = DOCS[i - 1];
  const next = DOCS[i + 1];

  return (
    <>
      <div className="night">
        <SiteNav />
      </div>
      <main id="main" className="paper">
        <div className="wrap docs">
          <nav aria-label="Documentation">
            <ul>
              {DOCS.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/docs/${d.slug}`}
                    aria-current={d.slug === slug ? "page" : undefined}
                  >
                    {d.title}
                  </Link>
                </li>
              ))}
              <li>
                <a href={`${REPO}/blob/main/docs/${slug}.md`}>Edit on GitHub</a>
              </li>
            </ul>
          </nav>
          <article>
            <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
            <div className="doc-pager">
              {prev ? (
                <Link className="link" href={`/docs/${prev.slug}`}>
                  Previous: {prev.title}
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link className="link" href={`/docs/${next.slug}`}>
                  Next: {next.title}
                </Link>
              )}
            </div>
          </article>
        </div>
      </main>
    </>
  );
}
