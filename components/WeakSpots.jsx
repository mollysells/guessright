import Link from "next/link";

/* Static, illustrative marketing mockup (aspirational — depicts analytics the
   self-study app does not compute). */

const WEEKS = [
  ["Mar 24", 30, 0.34], ["Mar 31", 26, 0.4], ["Apr 7", 34, 0.46],
  ["Apr 14", 40, 0.5], ["Apr 21", 46, 0.56], ["Apr 28", 52, 0.6],
  ["May 5", 58, 0.66], ["May 12", 62, 0.72], ["May 19", 68, 0.78],
  ["May 26", 72, 0.82], ["Jun 2", 78, 0.86],
];

const LEFT_TOPICS = [
  ["Information and Ideas", 48, 72],
  ["Craft and Structure", 41, 58],
  ["Standard English Con…", 36, 81],
];
const RIGHT_TOPICS = [
  ["Algebra", 52, 64],
  ["Advanced Math", 38, 47],
  ["Problem-Solving and …", 29, 76],
];

function Donut({ center, segs, legend }) {
  const R = 30, SW = 12, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="ws-donut-block">
      <div className="ws-donut">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <circle cx="40" cy="40" r={R} fill="none" stroke="#f0f0ee" strokeWidth={SW} />
          {segs.map((s, i) => {
            const len = s.f * C;
            const el = (
              <circle
                key={i}
                cx="40" cy="40" r={R} fill="none"
                stroke={s.color} strokeWidth={SW}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc * C}
                transform="rotate(-90 40 40)"
                strokeLinecap="butt"
              />
            );
            acc += s.f;
            return el;
          })}
          <text x="40" y="38" textAnchor="middle" className="ws-donut-num">{center}</text>
          <text x="40" y="49" textAnchor="middle" className="ws-donut-cap">avg</text>
        </svg>
      </div>
      <div className="ws-legend">
        {legend.map((l, i) => (
          <div className="ws-legend-row" key={i}>
            <span className="ws-dot" style={{ background: l.color }} />
            <span className="ws-leg-label">{l.label}</span>
            <span className="ws-leg-val">{l.val}<em>avg {l.avg}</em></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicRow({ name, attempts, pct }) {
  return (
    <div className="ws-topic">
      <div className="ws-topic-info">
        <div className="ws-topic-name">{name}</div>
        <div className="ws-topic-att">{attempts} attempts</div>
      </div>
      <div className="ws-seg">
        <span className="ws-knob" style={{ left: `calc(${pct}% - 6px)` }} />
      </div>
      <div className="ws-topic-pct">{pct}<em>%</em></div>
    </div>
  );
}

function Pace() {
  // 7 columns: [lowSec, highSec, yourSec] on a 0..60s scale (top = 60s)
  const cols = [
    [22, 46, 34], [18, 40, 24], [26, 50, 40], [20, 44, 30],
    [30, 52, 38], [16, 38, 22], [24, 48, 44],
  ];
  const W = 300, H = 150, top = 14, bot = 120, left = 34;
  const y = (s) => top + ((60 - s) / 60) * (bot - top);
  const step = (W - left - 10) / cols.length;
  const yl = [60, 45, 30, 15, 0];
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ws-pace-svg">
      {yl.map((s) => (
        <g key={s}>
          <line x1={left} y1={y(s)} x2={W - 6} y2={y(s)} stroke="#eee" />
          <text x={left - 6} y={y(s) + 3} textAnchor="end" className="ws-axis">{fmt(s)}</text>
        </g>
      ))}
      {cols.map(([lo, hi, yr], i) => {
        const cx = left + step * (i + 0.5);
        return (
          <g key={i}>
            <rect x={cx - 6} y={y(hi)} width="12" height={y(lo) - y(hi)} rx="6" fill="#2a9df4" opacity="0.85" />
            <circle cx={cx} cy={y(yr)} r="4.5" fill="#fff" stroke="#2a9df4" strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}

function Month({ label, seed }) {
  // deterministic pseudo-random intensities (0..4) so SSR is stable
  const cells = [];
  let x = seed;
  for (let i = 0; i < 35; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    cells.push(x % 5);
  }
  const shades = ["#eef1f4", "#cfe6fb", "#93c9f6", "#4aa3ec", "#1f7fd6"];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="ws-month">
      <div className="ws-month-label">{label}</div>
      <div className="ws-heat-days">{days.map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="ws-heat-grid">
        {cells.map((c, i) => (
          <span key={i} className="ws-heat-cell" style={{ background: shades[c] }} />
        ))}
      </div>
    </div>
  );
}

export default function WeakSpots() {
  return (
    <section id="insights" className="lp-section ws-section">
      <div className="lp-wrap">
        {/* header */}
        <div className="ws-header">
          <div>
            <h2 className="lp-h2 ws-h2">Know your weak spots<br />before test day</h2>
            <Link href="/app" className="btn primary" style={{ marginTop: 22 }}>Open App</Link>
          </div>
          <p className="ws-sub">
            See your accuracy by topic, your pacing against other students, and the
            difficulty bands where you’re losing time.
          </p>
        </div>

        {/* dashboard grid */}
        <div className="ws-grid">
          {/* big card */}
          <div className="ws-card">
            <div className="ws-cardhead">
              <h4>Know your weak spots</h4>
              <p>See weekly activity, accuracy by topic, and time share by difficulty so you know exactly what to practice.</p>
            </div>

            <div className="ws-chart">
              <div className="ws-chart-y">
                {[80, 60, 40, 20, 0].map((n) => <span key={n}>{n}</span>)}
              </div>
              <div className="ws-bars">
                {WEEKS.map(([label, total, greenFrac]) => {
                  const h = (total / 80) * 100;
                  return (
                    <div className="ws-barwrap" key={label}>
                      <div className="ws-bar" style={{ height: `${h}%` }}>
                        <span className="ws-bar-g" style={{ height: `${greenFrac * 100}%` }} />
                        <span className="ws-bar-r" style={{ height: `${(1 - greenFrac) * 100}%` }} />
                      </div>
                      <span className="ws-xlabel">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ws-cols">
              <div className="ws-col">
                {LEFT_TOPICS.map((t) => <TopicRow key={t[0]} name={t[0]} attempts={t[1]} pct={t[2]} />)}
                <Donut
                  center="2m 12s"
                  segs={[{ f: 0.42, color: "#16a34a" }, { f: 0.3, color: "#f5a623" }, { f: 0.28, color: "#e0533d" }]}
                  legend={[
                    { color: "#16a34a", label: "Easy", val: "46s", avg: "1m 11s" },
                    { color: "#f5a623", label: "Medium", val: "1m 14s", avg: "1m 23s" },
                    { color: "#e0533d", label: "Hard", val: "2m 52s", avg: "2m 23s" },
                  ]}
                />
              </div>
              <div className="ws-col">
                {RIGHT_TOPICS.map((t) => <TopicRow key={t[0]} name={t[0]} attempts={t[1]} pct={t[2]} />)}
                <Donut
                  center="1m 58s"
                  segs={[{ f: 0.38, color: "#16a34a" }, { f: 0.32, color: "#f5a623" }, { f: 0.3, color: "#e0533d" }]}
                  legend={[
                    { color: "#16a34a", label: "Easy", val: "55s", avg: "1m 8s" },
                    { color: "#f5a623", label: "Medium", val: "1m 35s", avg: "1m 31s" },
                    { color: "#e0533d", label: "Hard", val: "3m 8s", avg: "2m 36s" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* side column */}
          <div className="ws-side">
            <div className="ws-sidecard">
              <Pace />
              <div className="ws-pace-legend">
                <span><i className="ws-sq" style={{ background: "#2a9df4" }} /> Platform range</span>
                <span><i className="ws-sq ws-sq-o" /> Your time</span>
              </div>
              <h5 className="ws-side-title">See how you pace</h5>
              <p className="ws-side-sub">Compare your pacing against thousands of other students on the platform to see where you stand.</p>
            </div>

            <div className="ws-sidecard">
              <div className="ws-heat">
                <Month label="Jun 2026" seed={7} />
                <Month label="Jul 2026" seed={19} />
              </div>
              <div className="ws-heat-legend">
                <span>Less</span>
                {["#eef1f4", "#cfe6fb", "#93c9f6", "#4aa3ec", "#1f7fd6"].map((c) => (
                  <i key={c} className="ws-sq" style={{ background: c }} />
                ))}
                <span>More</span>
              </div>
              <h5 className="ws-side-title">Track your daily activity</h5>
              <p className="ws-side-sub">See how daily practice adds up over time.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
