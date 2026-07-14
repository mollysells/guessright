import Link from "next/link";
import { INDEX } from "@/lib/data";
import WeakSpots from "@/components/WeakSpots";

function Mark({ size = 32, radius = 9 }) {
  return (
    <span
      className="brand-mark"
      style={{ width: size, height: size, borderRadius: radius }}
      aria-hidden="true"
    >
      <i />
    </span>
  );
}

function Watermark({ opacity = 0.04 }) {
  return (
    <svg className="wm" style={{ opacity }} aria-hidden="true">
      <defs>
        <pattern id="lpwm" width="360" height="132" patternUnits="userSpaceOnUse" patternTransform="rotate(-9)">
          <text x="0" y="66" fontFamily="var(--font-disp), sans-serif" fontWeight="800" fontSize="52" fill="#101013">
            GuessRight
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lpwm)" />
    </svg>
  );
}

export default function Landing() {
  const courses = INDEX.courses;
  const totalQ = courses.reduce((a, c) => a + c.count, 0);
  const totalTopics = courses.reduce((a, c) => a + (c.topics || 0), 0);
  const totalFRQ = courses.reduce((a, c) => a + c.frq, 0);

  return (
    <div className="lp">
      {/* ---------- Header ---------- */}
      <header className="lp-header">
        <div className="lp-wrap lp-headrow">
          <Link href="/" className="brand">
            <Mark />
            <span className="brand-name">GuessRight</span>
          </Link>
          <nav className="lp-nav">
            <a href="#how">How it works</a>
            <a href="#insights">Insights</a>
            <Link href="/app">Courses</Link>
          </nav>
          <Link href="/app" className="lp-openapp">Open App</Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="lp-hero">
        <Watermark />
        <div className="lp-wrap" style={{ position: "relative" }}>
          <h1>The AP question bank that orders itself.</h1>
          <p>
            {totalQ.toLocaleString()} real AP-style questions across {courses.length}{" "}
            courses — automatically sequenced the way the learning science says you
            actually learn: an easy-to-hard ramp, topics interleaved for retention.
          </p>
          <div className="lp-cta">
            <Link href="/app" className="btn primary">Open App</Link>
            <Link href="/app" className="btn ghost">Browse courses</Link>
          </div>
        </div>
      </section>

      {/* ---------- Real stats band ---------- */}
      <section className="lp-band">
        <div className="lp-wrap lp-stats">
          <div><b>{totalQ.toLocaleString()}</b><span>Questions</span></div>
          <div><b>{courses.length}</b><span>AP Courses</span></div>
          <div><b>{totalTopics.toLocaleString()}</b><span>Topics</span></div>
          <div><b>{totalFRQ.toLocaleString()}</b><span>Free-response</span></div>
        </div>
      </section>

      {/* ---------- Three steps ---------- */}
      <section id="how" className="lp-section">
        <Watermark opacity={0.03} />
        <div className="lp-wrap" style={{ position: "relative" }}>
          <h2 className="lp-h2">Three steps to exam-ready.</h2>
          <div className="lp-steps">
            {/* 01 — course dashboard */}
            <StepCard n="01" title="Pick your course" body="21 AP courses. See the whole bank at a glance — every unit and topic, with counts.">
              <div className="mk-dash">
                <div className="mk-dash-label">AP Biology</div>
                <div className="mk-dash-num">1,866</div>
                <div className="mk-dash-cap">questions</div>
                <div className="mk-dash-cols">
                  <div><span>Multiple choice</span><b>1,426</b></div>
                  <div><span>Free response</span><b>440</b></div>
                </div>
                <div className="mk-dash-focus">Units</div>
                {[["Unit 1", "100 Q", 43], ["Unit 2", "229 Q", 99], ["Unit 3", "232 Q", 100]].map(([u, q, pct]) => (
                  <div className="mk-dashrow" key={u}>
                    <div className="mk-dashrow-top"><span>{u}</span><span className="mk-muted">{q}</span></div>
                    <span className="mk-bar"><i style={{ width: `${pct}%` }} /></span>
                  </div>
                ))}
              </div>
            </StepCard>

            {/* 02 — topic checklist */}
            <StepCard n="02" title="Practice in the right order" body="Questions ramp easy → hard and interleave across topics — no manual sorting.">
              <div className="mk-check">
                {[
                  ["Water & macromolecules", "1.1", "16 Q"],
                  ["Cell membranes", "1.2", "21 Q"],
                  ["Enzyme function", "1.3", "13 Q"],
                ].map(([name, code, count]) => (
                  <div className="mk-checkrow" key={code}>
                    <span className="mk-radio" />
                    <div className="mk-checkmain">
                      <div className="mk-checkname">{name}</div>
                      <div className="mk-checkmeta">
                        <span className="mk-tag teal">Topic {code}</span>
                        <span className="mk-muted">{count}</span>
                      </div>
                    </div>
                    <span className="mk-start">Start <b>›</b></span>
                  </div>
                ))}
              </div>
            </StepCard>

            {/* 03 — resume cards */}
            <StepCard n="03" title="Track what you've covered" body="Every course remembers where you left off and how far through each unit you are.">
              <div className="mk-cardstack">
                {[["AP Biology", "Unit 2 · 64% covered", 64], ["AP U.S. History", "Unit 5 · 22% covered", 22]].map(([course, sub, pct]) => (
                  <div className="mk-resume" key={course}>
                    <div className="mk-resume-top">
                      <span className="mk-resume-title">{course}</span>
                      <span className="mk-chip">Resume ›</span>
                    </div>
                    <div className="mk-resume-sub">{sub}</div>
                    <span className="mk-bar"><i style={{ width: `${pct}%` }} /></span>
                  </div>
                ))}
              </div>
            </StepCard>
          </div>
        </div>
      </section>

      {/* ---------- Insights (weak spots) ---------- */}
      <WeakSpots />

      {/* ---------- Footer ---------- */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footrow">
          <div className="lp-footbrand">
            <Mark size={28} radius={8} />
            <span className="brand-name" style={{ fontSize: 19 }}>GuessRight</span>
          </div>
          <p className="lp-fine">
            A self-study AP question bank. Not affiliated with or endorsed by the
            College Board. AP is a trademark of the College Board.
          </p>
          <Link href="/app" className="lp-openapp">Open App</Link>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ n, title, body, children }) {
  return (
    <div className="step-card">
      <div className="step-mock">{children}</div>
      <div className="step-copy">
        <div className="step-n">{n}</div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </div>
  );
}
