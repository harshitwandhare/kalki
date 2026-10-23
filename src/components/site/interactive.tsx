"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { channels, tour } from "./content";

/**
 * Adds `.in` to every `.rise` element once it is on screen or already behind the reader.
 *
 * An IntersectionObserver is not enough here. It only reports threshold crossings, so an
 * anchor jump or a scrollTo that lands past an element never fires for it, and the element
 * stays hidden for good. Elements also appear after mount when the layout is kept across
 * client navigation (docs to home). So the check is a plain sweep over whatever is still
 * hidden, run on scroll, resize, hash changes and every route change.
 * Content stays visible without JS (the `js` class is what hides it).
 */
export function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");
    let frame = 0;

    const sweep = () => {
      frame = 0;
      const limit = window.innerHeight * 0.92;
      document.querySelectorAll<HTMLElement>(".rise:not(.in)").forEach((el) => {
        if (el.getBoundingClientRect().top < limit) el.classList.add("in");
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sweep);
    };

    sweep();
    // Hash navigation scrolls after the route renders, so look again shortly after.
    const timers = [120, 400, 1000].map((ms) => setTimeout(sweep, ms));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      timers.forEach(clearTimeout);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [pathname]);

  return null;
}

export function ChannelSwitch() {
  const [i, setI] = useState(0);
  const ch = channels[i];
  return (
    <section
      id="channels"
      className={`live${ch.night ? " night-field" : ""}`}
      style={
        { "--field": ch.field, "--field-ink": ch.ink } as React.CSSProperties
      }
      aria-labelledby="channels-h"
    >
      <div className="wrap">
        <h2 id="channels-h" className="rise">
          One studio, {ch.word} channel
        </h2>
        <p className="lede rise" style={{ "--i": 1 } as React.CSSProperties}>
          A channel carries its audience, language, hooks and a recurring cast
          with written soul documents. These three ship as seed data. Pick one.
        </p>
        <div className="switch rise" role="group" aria-label="Seeded channels">
          {channels.map((c, n) => (
            <button
              key={c.name}
              type="button"
              aria-pressed={n === i}
              onClick={() => setI(n)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="brief" data-ui aria-live="polite">
          <div className="card meta">
            <h3>{ch.description}</h3>
            <dl>
              <div>
                <dt>Audience</dt>
                <dd>{ch.audience}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{ch.language}</dd>
              </div>
              <div>
                <dt>Default length</dt>
                <dd>{ch.duration} seconds</dd>
              </div>
            </dl>
            <ul className="hooks" aria-label="Opening hooks">
              {ch.hooks.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className="cast">
            {ch.cast.map((p) => (
              <div className="card" key={p.name}>
                <h3>{p.name}</h3>
                <p>{p.line}</p>
                <ul className="traits">
                  {p.traits.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Tour() {
  const [i, setI] = useState(0);
  return (
    <div className="tour">
      <ol>
        {tour.map((t, n) => (
          <li
            key={t.slug}
            className="rise"
            style={{ "--i": n } as React.CSSProperties}
          >
            <button
              type="button"
              aria-current={n === i}
              onMouseEnter={() => setI(n)}
              onFocus={() => setI(n)}
              onClick={() => setI(n)}
            >
              <span className="row-title">{t.title}</span>
              <span className="row-note">{t.note}</span>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="inline-shot"
              src={`/screens/${t.slug}.png`}
              alt={`Kalki ${t.title} screen`}
              width={2880}
              height={1800}
              loading="lazy"
            />
          </li>
        ))}
      </ol>
      <div className="frame" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={tour[i].slug}
          src={`/screens/${tour[i].slug}.png`}
          alt=""
          width={2880}
          height={1800}
        />
      </div>
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn light"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard blocked: the text is still selectable */
        }
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/** The hero recording: muted loop, paused for reduced motion, with a pause control. */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  // Mirrors the element's real state; autoplay can be refused by the browser.
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      v.pause();
    setPlaying(!v.paused);
  }, []);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setPlaying(false));
    else v.pause();
  };
  return (
    <div className="hero-video">
      <video
        ref={ref}
        className="shot"
        src="/screens/tour.mp4"
        poster="/screens/dashboard.png"
        width={1440}
        height={900}
        autoPlay
        muted
        loop
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label="Screen recording of the Kalki dashboard: overview, writing a prompt on Generate, then channels, characters, worlds and the agent monitor"
      />
      <button type="button" className="btn vid-toggle" onClick={toggle}>
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
}
