import Link from "next/link";
import { REPO, SiteNav } from "@/components/site/chrome";
import { parts, quickstart, stages } from "@/components/site/content";
import { PLATFORMS } from "@/lib/platforms";
import {
  ChannelSwitch,
  CopyButton,
  HeroVideo,
  Tour,
} from "@/components/site/interactive";

const css = (v: Record<string, string | number>) => v as React.CSSProperties;

export default function Landing() {
  return (
    <main id="main">
      <section className="night hero" aria-labelledby="hero-h">
        <SiteNav />
        <div className="wrap hero-copy">
          <h1 id="hero-h" className="rise">
            Idea to Short
          </h1>
          <p className="hero-sub rise" style={css({ "--i": 1 })}>
            <strong>Kalki is an open-source studio</strong> where five AI agents
            write, illustrate, voice, animate and cut a vertical video from one
            line of text. Self-hosted, with your own keys.
          </p>
        </div>

        <div className="stack" aria-label="The five agents">
          {stages.slice(0, 4).map((s, n) => (
            <Link
              key={s.name}
              href="/#pipeline"
              className="folder"
              style={css({ "--c": s.c, "--t": s.t, zIndex: n })}
            >
              <span className="tab" style={{ marginLeft: `${4 + n * 19}%` }}>
                {s.name}
              </span>
              <span className="body" aria-hidden="true" />
            </Link>
          ))}
          <div
            className="folder open"
            style={css({ "--c": "#050f16", "--t": "#f2f4f5", zIndex: 5 })}
          >
            <span
              className="tab"
              style={css({
                marginLeft: "80%",
                "--c": "#ff7a1f",
                "--t": "#050f16",
              })}
            >
              Producer
            </span>
            <div
              className="body"
              style={css({ background: "#ff7a1f", color: "#050f16" })}
            >
              <div>
                <p>
                  A finished 9:16 video, labelled as AI-generated, with title,
                  description and tags ready for review.
                </p>
                <div className="actions">
                  <Link href="/#start" className="btn">
                    Self-host Kalki
                  </Link>
                  <a className="link" href={REPO}>
                    Read the source
                  </a>
                </div>
              </div>
              <HeroVideo />
            </div>
          </div>
        </div>
      </section>

      <ChannelSwitch />

      <section id="pipeline" className="sec" aria-labelledby="pipe-h">
        <div className="wrap">
          <h2 id="pipe-h" className="rise">
            Five agents, one hand-off
          </h2>
          <p className="lede rise" style={css({ "--i": 1 })}>
            A LangGraph director passes one state object down the line. Each bar
            is sized by what that stage makes.
          </p>
          <div className="bar" data-ui>
            {stages.map((s, n) => (
              <div
                key={s.name}
                className="seg rise"
                style={css({ "--w": s.w, "--i": n })}
              >
                <div className="fill" style={css({ "--c": s.c, "--t": s.t })}>
                  {s.name}
                  <small>{s.out}</small>
                </div>
                <p>{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tour" className="sec paper" aria-labelledby="tour-h">
        <div className="wrap">
          <h2 id="tour-h" className="rise">
            Inside the studio
          </h2>
          <p className="lede rise" style={css({ "--i": 1 })}>
            Real screens from a local install, seeded with the three demo
            channels. Point at a row to see it.
          </p>
          <Tour />
        </div>
      </section>

      <section className="sec" aria-labelledby="board-h">
        <div className="wrap board">
          <div
            className="tile t62 headline"
            style={css({ "--c": "#050f16", "--t": "#ff7a1f" })}
          >
            <h2 id="board-h">Built to run unattended</h2>
          </div>
          <div className="tile t64" style={css({ "--c": "#ffffff" })}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="crop drift"
              src="/screens/agents.png"
              alt="Agent monitor listing pipeline runs"
              width={2880}
              height={1800}
              loading="lazy"
              style={css({ "--x": "-28%", "--y": "-4%" })}
            />
            <div
              className="cap"
              style={{
                background: "#ffffff",
                padding: "12px 14px",
                left: 8,
                bottom: 8,
              }}
            >
              <strong>Live agent log</strong>
              <span>Every step goes to Postgres and streams over SSE.</span>
            </div>
          </div>
          <div
            className="tile t34"
            style={css({ "--c": "#13232e", "--t": "#f2f4f5" })}
          >
            <div
              data-ui
              className="ui"
              style={css({ "--z": "2.6em", "--y": "36px" })}
            >
              Seedance
              <br />
              <span style={{ color: "#ff7a1f" }}>→ Kling</span>
            </div>
            <div className="cap">
              <strong>Video fallback</strong>
              <span>If one video provider fails, the other takes the job.</span>
            </div>
          </div>
          <div className="tile t34" style={css({ "--c": "#ffb27a" })}>
            <div
              data-ui
              className="ui"
              style={css({ "--z": "1.3em", "--y": "36px" })}
            >
              <span className="chip">OWNER</span>{" "}
              <span className="chip" style={{ opacity: 0.55 }}>
                EDITOR
              </span>{" "}
              <span className="chip" style={{ opacity: 0.3 }}>
                VIEWER
              </span>
            </div>
            <div className="cap">
              <strong>Roles and approvals</strong>
              <span>New sign-ups wait for an owner.</span>
            </div>
          </div>
          <div className="tile t62" style={css({ "--c": "#ffffff" })}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="crop"
              src="/screens/characters.png"
              alt="Character cards with soul documents"
              width={2880}
              height={1800}
              loading="lazy"
              style={css({ "--x": "-22%", "--y": "-12%" })}
            />
            <div
              className="cap"
              style={{
                background: "#ffffff",
                padding: "12px 14px",
                left: 8,
                bottom: 8,
              }}
            >
              <strong>Soul documents</strong>
              <span>Looks, voice and quirks that keep a cast consistent.</span>
            </div>
          </div>
          <div
            className="tile t32"
            style={css({ "--c": "#050f16", "--t": "#f2f4f5" })}
          >
            <div
              data-ui
              className="ui"
              style={css({ "--z": "2.6em", "--x": "20px" })}
            >
              {"<=>"}
            </div>
            <div className="cap">
              <strong>pgvector cosine search</strong>
              <span>Find similar characters and worlds.</span>
            </div>
          </div>
          <div className="tile t32" style={css({ "--c": "#ffffff" })}>
            <div data-ui className="ui" style={css({ "--z": "2.2em" })}>
              WhatsApp <span className="toggle" aria-hidden="true" />
            </div>
            <div className="cap">
              <strong>Optional chat control</strong>
              <span>Start a reel by message.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="publish" className="sec night" aria-labelledby="publish-h">
        <div className="wrap start">
          <div>
            <h2 id="publish-h" className="rise">
              One file, every feed
            </h2>
            <p
              className="lede rise"
              style={css({ "--i": 1, color: "var(--night-muted)" })}
            >
              Each reel is a 9:16 MP4 that every short-video platform takes as
              is. The Library writes a caption sized for each one and tells you
              where its AI label lives.
            </p>
            <p className="rise" style={css({ "--i": 2, marginTop: 28 })}>
              <Link href="/docs/earning" className="btn light">
                How creators earn
              </Link>{" "}
              <Link
                href="/docs/publishing"
                className="link"
                style={{ marginLeft: 16 }}
              >
                Publishing guide
              </Link>
            </p>
          </div>
          <ul className="feeds">
            {PLATFORMS.map((p, n) => (
              <li key={p.id} className="rise" style={css({ "--i": n })}>
                <strong>{p.name}</strong>
                <span>
                  {p.titleLimit ? `${p.titleLimit}-character title, ` : ""}
                  {p.captionLimit.toLocaleString("en-US")}-character caption,{" "}
                  {p.hashtagLimit} hashtags
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="honest" className="sec paper" aria-labelledby="honest-h">
        <div className="wrap">
          <h2 id="honest-h" className="rise">
            Labelled, never laundered
          </h2>
          <p className="lede rise" style={css({ "--i": 1 })}>
            Kalki makes synthetic media and says so. These are design rules, and
            the test suite checks them.
          </p>
          <div className="rules">
            <div className="rise">
              <h3>Every file is tagged</h3>
              <p>
                The Producer writes an AI-generated note into the video
                container. Kalki never strips provenance signals and never fakes
                camera or device metadata.
              </p>
            </div>
            <div className="rise" style={css({ "--i": 1 })}>
              <h3>Your keys, their terms</h3>
              <p>
                Kalki only calls providers with keys you supply. It does not
                create accounts, solve CAPTCHAs or rotate proxies.
              </p>
            </div>
            <div className="rise" style={css({ "--i": 2 })}>
              <h3>You disclose, you publish</h3>
              <p>
                Uploading stays manual. Turn on your platform&apos;s altered or
                synthetic content setting, such as YouTube&apos;s, when you
                post.
              </p>
            </div>
            <div className="rise" style={css({ "--i": 3 })}>
              <h3>No shell over chat</h3>
              <p>
                The WhatsApp webhook fails closed, checks a secret in constant
                time and can only start reels or read status.
              </p>
            </div>
          </div>
          <div className="meta-tag rise" data-ui>
            <pre>
              <code>{`$ ffprobe -show_entries format_tags reel_final.mp4
[FORMAT]
TAG:comment=AI-generated content (created with Kalki)
TAG:encoder=Kalki
[/FORMAT]`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="parts-h">
        <div className="wrap">
          <div className="parts">
            <div
              className="p lead"
              style={{ background: "#050f16", color: "#ff7a1f" }}
            >
              <h2 id="parts-h">Built on open parts</h2>
              <span>MIT licensed. Read it, fork it, swap any provider.</span>
            </div>
            {parts.map((p) => (
              <div key={p.name} className="p">
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="sec night" aria-labelledby="start-h">
        <div className="wrap start">
          <div>
            <h2 id="start-h" className="rise">
              Run it on your machine
            </h2>
            <p
              className="lede rise"
              style={css({ "--i": 1, color: "var(--night-muted)" })}
            >
              You need Bun, Docker, FFmpeg and a Gemini key. Image, voice and
              video keys are per provider.
            </p>
            <p className="rise" style={css({ "--i": 2, marginTop: 28 })}>
              <Link href="/docs/getting-started" className="btn light">
                Read the setup guide
              </Link>
            </p>
          </div>
          <div className="code rise" style={css({ "--i": 1 })}>
            <CopyButton text={quickstart} />
            <pre>
              <code>{quickstart}</code>
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
