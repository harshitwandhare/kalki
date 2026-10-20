import Link from "next/link";

export const REPO = "https://github.com/harshitwandhare/kalki";

export function SiteNav() {
  return (
    <header className="wrap nav">
      <Link href="/" className="brand" aria-label="Kalki home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-3d.svg" alt="" width={30} height={30} />
        <span translate="no">Kalki</span>
      </Link>
      <ul>
        <li>
          <Link href="/#pipeline">How it works</Link>
        </li>
        <li>
          <Link href="/#tour">The studio</Link>
        </li>
        <li>
          <Link href="/docs">Docs</Link>
        </li>
        <li>
          <a href={REPO}>GitHub</a>
        </li>
      </ul>
      <Link href="/#start" className="btn light">
        Self-host it
      </Link>
    </header>
  );
}

const letters = [
  { l: "K", h: "100%", c: "var(--bg)", t: "var(--ink)" },
  { l: "a", h: "72%", c: "var(--paper)", t: "var(--ink)" },
  { l: "l", h: "88%", c: "var(--soft)", t: "var(--ink)" },
  { l: "k", h: "64%", c: "var(--ink-2)", t: "var(--night-ink)" },
  { l: "i", h: "94%", c: "var(--bg)", t: "var(--ink)" },
];

export function SiteFooter() {
  return (
    <footer className="night foot">
      <div className="wrap">
        <div className="blocks" aria-label="Kalki">
          {letters.map((x) => (
            <span
              key={x.l}
              aria-hidden="true"
              style={
                {
                  "--h": x.h,
                  "--c": x.c,
                  "--t": x.t,
                } as React.CSSProperties
              }
            >
              {x.l}
            </span>
          ))}
        </div>
        <div className="foot-cols">
          <div>
            <h3>Product</h3>
            <ul>
              <li>
                <Link href="/#pipeline">Pipeline</Link>
              </li>
              <li>
                <Link href="/#tour">Studio tour</Link>
              </li>
              <li>
                <Link href="/#publish">Publishing</Link>
              </li>
              <li>
                <Link href="/docs/earning">Earning</Link>
              </li>
              <li>
                <Link href="/#honest">Responsible use</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Docs</h3>
            <ul>
              <li>
                <Link href="/docs/getting-started">Getting started</Link>
              </li>
              <li>
                <Link href="/docs/configuration">Configuration</Link>
              </li>
              <li>
                <Link href="/docs/architecture">Architecture</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Project</h3>
            <ul>
              <li>
                <a href={REPO}>Source code</a>
              </li>
              <li>
                <a href={`${REPO}/releases`}>Releases</a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/CHANGELOG.md`}>Changelog</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Community</h3>
            <ul>
              <li>
                <a href={`${REPO}/issues`}>Issues</a>
              </li>
              <li>
                <a href={`${REPO}/blob/main/CONTRIBUTING.md`}>Contributing</a>
              </li>
              <li>
                <a href={`${REPO}/security/policy`}>Security</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Made by</h3>
            <ul>
              <li>
                <a href="https://harshitwandhare.com">Harshit Wandhare</a>
              </li>
              <li>Released under the MIT license.</li>
            </ul>
          </div>
        </div>
        <div className="foot-last">
          <span>Kalki is free, open-source software. Bring your own keys.</span>
          <a href={REPO} className="btn light">
            Star on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
